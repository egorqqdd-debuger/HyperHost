import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import fs from "fs-extra";
import multer from "multer";
import cors from "cors";
import axios from "axios";
import { spawn } from "child_process";
import { createClient } from "@supabase/supabase-js";

import dotenv from "dotenv";

// Add global error handlers to help debug crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

dotenv.config();

console.log("Server module loading...");
console.log("Environment check:", {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: !!process.env.VERCEL,
  HAS_SUPABASE_URL: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
  HAS_SUPABASE_KEY: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase (Lazy load to avoid crash if keys missing)
let supabaseClient: any = null;
function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                process.env.SUPABASE_ANON_KEY || 
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      console.warn("Supabase credentials missing. Available env vars:", Object.keys(process.env).filter(k => k.includes("SUPABASE")));
      return null;
    }
    
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log("Supabase client initialized");
    } catch (err) {
      console.error("Supabase init error:", err);
      return null;
    }
  }
  return supabaseClient;
}

export async function createServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Storage setup - Use /tmp for serverless environments
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  const uploadsDir = isServerless ? "/tmp/uploads" : path.join(process.cwd(), "uploads");
  const botsDir = isServerless ? "/tmp/bots_scripts" : path.join(process.cwd(), "bots_scripts");
  
  try {
    await fs.ensureDir(uploadsDir);
    await fs.ensureDir(botsDir);
    console.log(`Storage ready at ${uploadsDir}`);
  } catch (err) {
    console.warn("Storage initialization warning:", err);
  }

  // --- File Upload Setup (Memory storage for Serverless compatibility) ---
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // --- Mock DB Fallback ---
  let mockUsers: any[] = [];
  const initialAdminEmail = process.env.ADMIN_EMAIL || "admin@hyperhost.io";
  const initialAdminPassword = process.env.ADMIN_PASSWORD;
  
  if (initialAdminPassword) {
    mockUsers.push({ 
      id: "1", 
      email: initialAdminEmail, 
      role: "SUPERADMIN", 
      password: initialAdminPassword 
    });
  }

// --- API Routes ---

  // Health Check & Diagnostics
  app.get("/api/health", async (req, res) => {
    console.log("Health check requested");
    const supabase = getSupabase();
    const diagnostics: any = {
      status: "ok",
      timestamp: new Date().toISOString(),
      supabaseConfigured: !!supabase,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
        HAS_SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        HAS_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    };

    if (supabase) {
      try {
        console.log("Testing Supabase connection...");
        const { error } = await supabase.from("profiles").select("count", { count: "exact", head: true });
        diagnostics.databaseConnection = error ? "error" : "connected";
        if (error) {
          console.error("Supabase health test error:", error);
          diagnostics.databaseError = error.message;
        } else {
          console.log("Supabase connection OK");
        }
      } catch (e: any) {
        console.error("Supabase health test exception:", e);
        diagnostics.databaseConnection = "exception";
        diagnostics.databaseError = e.message;
      }
    }

    res.json(diagnostics);
  });

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured locally" });
    }

    try {
      console.log("Attempting Supabase registration for:", email);
      
      const supabase = getSupabase();
      let authData, authError;

      // If we have a service role key, we can use the admin API to skip email confirmation
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log("Using Supabase Admin API for registration (bypassing email confirmation)");
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });
        authData = data;
        authError = error;
      } else {
        console.log("Using standard Supabase signUp");
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        authData = data;
        authError = error;
      }

      if (authError) {
        console.error("Supabase registration error:", authError);
        return res.status(400).json({ error: authError.message });
      }

      if (authData?.user) {
        // Optional: create profile, but don't fail if it doesn't work
        try {
          await supabase.from("profiles").insert({
            id: authData.user.id,
            email: email,
            role: "USER"
          });
        } catch (e) {
          console.error("Non-fatal profile creation error:", e);
        }

        return res.json({
          user: {
            id: authData.user.id,
            email: authData.user.email,
            role: "USER"
          }
        });
      }

      res.status(400).json({ error: "Registration failed or confirmation required" });
    } catch (err: any) {
      console.error("Registration error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    const supabase = getSupabase();

    if (supabase) {
      // Try Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData.user) {
        // Fetch user metadata from our profile table
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        return res.json({ 
          id: authData.user.id, 
          email: authData.user.email, 
          role: profile?.role || "USER" 
        });
      }
    }

    // Fallback to mock users
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      res.json({ id: user.id, email: user.email, role: user.role });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Bots
  app.get("/api/bots", async (req, res) => {
    const userId = req.query.userId as string;
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("bots")
        .select("*")
        .or(`owner_id.eq.${userId},owner_id.is.null`);
      
      if (!error && data) {
        return res.json(data.map((b: any) => ({
          id: b.id,
          name: b.name,
          token: b.token,
          ownerId: b.owner_id,
          scriptPath: b.script_path,
          variables: b.variables,
          status: b.status,
          webhookUrl: b.webhook_url,
          createdAt: b.created_at
        })));
      }
    }
    
    res.json([]);
  });

  app.post("/api/bots", async (req, res) => {
    const { ownerId, name, token, scriptPath, variables } = req.body;
    const supabase = getSupabase();
    
    try {
      const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
      if (!response.data.ok) throw new Error("Invalid token");
      
      const webhookUrl = `${process.env.APP_URL || "http://localhost:3000"}/api/webhooks/bot/${token}`;

      const newBot = {
        name,
        token,
        owner_id: ownerId,
        script_path: scriptPath,
        variables: variables || {},
        status: "STOPPED",
        webhook_url: webhookUrl,
        created_at: new Date().toISOString()
      };

      await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
        url: webhookUrl
      });

      if (supabase) {
        const { data, error } = await supabase.from("bots").insert(newBot).select().single();
        if (error) throw error;
        return res.json({
          id: data.id,
          name: data.name,
          token: data.token,
          ownerId: data.owner_id,
          scriptPath: data.script_path,
          variables: data.variables,
          status: data.status,
          webhookUrl: data.webhook_url,
          createdAt: data.created_at
        });
      }

      res.status(500).json({ error: "Supabase not configured" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/bots/:id/start", async (req, res) => {
    const botId = req.params.id;
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("bots")
        .update({ status: "RUNNING" })
        .eq("id", botId)
        .select()
        .single();
      
      if (!error && data) return res.json({
        id: data.id,
        status: data.status
      });
    }
    res.status(404).json({ error: "Bot not found or DB error" });
  });

  app.post("/api/bots/:id/stop", async (req, res) => {
    const botId = req.params.id;
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("bots")
        .update({ status: "STOPPED" })
        .eq("id", botId)
        .select()
        .single();
      
      if (!error && data) return res.json({
        id: data.id,
        status: data.status
      });
    }
    res.status(404).json({ error: "Bot not found or DB error" });
  });

  // Files
  app.post("/api/files/upload", upload.array("files"), async (req, res) => {
    const userId = req.body.userId;
    const supabase = getSupabase();
    const filesArr = req.files as Express.Multer.File[];
    
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    const results = [];
    for (const f of filesArr) {
      const fileName = `${userId}/${Date.now()}-${f.originalname}`;
      
      // Upload to Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("bot-files")
        .upload(fileName, f.buffer, {
          contentType: f.mimetype,
          upsert: true
        });

      if (uploadError) continue;

      // Insert into metadata table
      const { data: dbData, error: dbError } = await supabase
        .from("files")
        .insert({
          owner_id: userId,
          name: f.originalname,
          storage_path: uploadData.path,
          size: f.size,
          type: f.mimetype,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!dbError && dbData) {
        results.push({
          id: dbData.id,
          name: dbData.name,
          type: dbData.type,
          size: dbData.size,
          createdAt: dbData.created_at,
          path: dbData.storage_path
        });
      }
    }

    res.json(results);
  });

  app.get("/api/files", async (req, res) => {
    const userId = req.query.userId as string;
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("owner_id", userId);
      
      if (!error && data) {
        return res.json(data.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          createdAt: f.created_at,
          path: f.storage_path
        })));
      }
    }
    res.json([]);
  });

  // Webhook Handler
  app.post("/api/webhooks/bot/:token", async (req, res) => {
    const token = req.params.token;
    const supabase = getSupabase();
    
    let bot = null;
    if (supabase) {
      const { data } = await supabase.from("bots").select("*").eq("token", token).single();
      bot = data;
    }

    if (!bot || bot.status !== "RUNNING") {
      return res.status(200).send("Bot not active");
    }

    // In a real serverless env, we wouldn't use spawn for long running tasks
    // But for a webhook, we could trigger an Edge Function or another process
    console.log(`Webhook received for bot: ${bot.name}`);
    
    res.status(200).json({ ok: true });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Using Vite middleware (development)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files (production)");
    const distPath = path.join(process.cwd(), "dist");
    if (await fs.pathExists(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn("Dist folder not found, static serving might fail");
    }
  }

  return app;
}

// Only start the server on port 3000 if not in a serverless environment
const PORT = Number(process.env.PORT) || 3000;
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  createServer().then(app => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server successfully started and listening on http://0.0.0.0:${PORT}`);
    });
  }).catch(err => {
    console.error("CRITICAL: Failed to start server:", err);
    process.exit(1);
  });
}
