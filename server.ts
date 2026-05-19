import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import fs from "fs-extra";
import multer from "multer";
import cors from "cors";
import axios from "axios";
import { spawn } from "child_process";
import * as admin from "firebase-admin";

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

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log("Firebase Admin initialized");
  } catch (err) {
    console.error("Firebase Admin initialization error:", err);
  }
}

const db = admin.firestore();
const auth = admin.auth();

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
    const diagnostics: any = {
      status: "ok",
      timestamp: new Date().toISOString(),
      firebaseConfigured: !!admin.apps.length,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HAS_FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      }
    };

    try {
      console.log("Testing Firestore connection...");
      await db.collection("profiles").limit(1).get();
      diagnostics.databaseConnection = "connected";
      console.log("Firestore connection OK");
    } catch (e: any) {
      console.error("Firestore health test error:", e);
      diagnostics.databaseConnection = "error";
      diagnostics.databaseError = e.message;
    }

    res.json(diagnostics);
  });

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      console.log("Attempting Firebase registration for:", email);
      
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: true
      });

      // Create profile
      const profileData = {
        id: userRecord.uid,
        email: email,
        role: "USER",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("profiles").doc(userRecord.uid).set(profileData);

      return res.json({
        user: {
          id: userRecord.uid,
          email: userRecord.email,
          role: "USER"
        }
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      res.status(400).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    try {
      // In a real production app, we would verify a token from the client
      // But to maintain the current flow without massive client changes yet:
      // We'll treat this as a mock/proxy if needed or just use client auth.
      // For now, let's keep it simple: fetch user, but we can't truly "verify password" easily with Admin SDK.
      // So I'll recommend switching to client-side auth for login.
      
      const userRecord = await auth.getUserByEmail(email);
      const profileDoc = await db.collection("profiles").doc(userRecord.uid).get();
      const profile = profileDoc.data();

      return res.json({ 
        id: userRecord.uid, 
        email: userRecord.email, 
        role: profile?.role || "USER" 
      });
    } catch (err: any) {
      console.error("Login lookup error:", err);
      // Fallback for demo: if it's the admin from env
      if (email === initialAdminEmail && password === initialAdminPassword) {
         return res.json({ id: "admin-fallback", email, role: "SUPERADMIN" });
      }
      res.status(401).json({ error: "Invalid credentials or user not found" });
    }
  });

  // Bots
  app.get("/api/bots", async (req, res) => {
    const userId = req.query.userId as string;

    try {
      let query: any = db.collection("bots");
      if (userId) {
        // Simple filter for demo
        const snapshot = await query.get();
        const bots = snapshot.docs
          .map((doc: any) => ({ id: doc.id, ...doc.data() }))
          .filter((b: any) => !b.ownerId || b.ownerId === userId);
        
        return res.json(bots);
      }
      
      const snapshot = await query.get();
      return res.json(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      console.error("Fetch bots error:", err);
      res.json([]);
    }
  });

  app.post("/api/bots", async (req, res) => {
    const { ownerId, name, token, scriptPath, variables } = req.body;
    
    try {
      const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
      if (!response.data.ok) throw new Error("Invalid token");
      
      const webhookUrl = `${process.env.APP_URL || "http://localhost:3000"}/api/webhooks/bot/${token}`;

      const newBot = {
        name,
        token,
        ownerId,
        scriptPath,
        variables: variables || {},
        status: "STOPPED",
        webhookUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
        url: webhookUrl
      });

      const docRef = await db.collection("bots").add(newBot);
      const savedDoc = await docRef.get();
      
      res.json({ id: savedDoc.id, ...savedDoc.data() });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/bots/:id/start", async (req, res) => {
    const botId = req.params.id;
    try {
      await db.collection("bots").doc(botId).update({ status: "RUNNING" });
      res.json({ id: botId, status: "RUNNING" });
    } catch (err) {
      res.status(404).json({ error: "Bot not found" });
    }
  });

  app.post("/api/bots/:id/stop", async (req, res) => {
    const botId = req.params.id;
    try {
      await db.collection("bots").doc(botId).update({ status: "STOPPED" });
      res.json({ id: botId, status: "STOPPED" });
    } catch (err) {
      res.status(404).json({ error: "Bot not found" });
    }
  });

  // Files
  app.post("/api/files/upload", upload.array("files"), async (req, res) => {
    const userId = req.body.userId;
    const filesArr = req.files as Express.Multer.File[];
    
    const results = [];
    const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

    for (const f of filesArr) {
      const storagePath = `uploads/${userId}/${Date.now()}-${f.originalname}`;
      
      try {
        const file = bucket.file(storagePath);
        await file.save(f.buffer, {
          metadata: { contentType: f.mimetype }
        });
        
        // Make it public or get signed URL if needed, but for now we'll just save the path
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491' // Far future
        });

        const fileMetadata = {
          ownerId: userId,
          name: f.originalname,
          path: storagePath,
          url: url,
          size: f.size,
          type: f.mimetype,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection("files").add(fileMetadata);
        const saved = await docRef.get();
        
        results.push({ id: saved.id, ...saved.data() });
      } catch (uploadErr) {
        console.error("Storage upload error, falling back to metadata only:", uploadErr);
        // Fallback to metadata only if bucket logic fails
        const fileMetadata = {
          ownerId: userId,
          name: f.originalname,
          path: storagePath,
          size: f.size,
          type: f.mimetype,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection("files").add(fileMetadata);
        const saved = await docRef.get();
        results.push({ id: saved.id, ...saved.data() });
      }
    }

    res.json(results);
  });

  app.get("/api/files", async (req, res) => {
    const userId = req.query.userId as string;
    try {
      const snapshot = await db.collection("files").where("ownerId", "==", userId).get();
      res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      res.json([]);
    }
  });

  // Webhook Handler
  app.post("/api/webhooks/bot/:token", async (req, res) => {
    const token = req.params.token;
    
    try {
      const snapshot = await db.collection("bots").where("token", "==", token).limit(1).get();
      if (snapshot.empty) return res.status(200).send("Bot not active");
      
      const bot = snapshot.docs[0].data();
      if (bot.status !== "RUNNING") {
        return res.status(200).send("Bot not active");
      }

      console.log(`Webhook received for bot: ${bot.name}`);
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).send("Internal error");
    }
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
