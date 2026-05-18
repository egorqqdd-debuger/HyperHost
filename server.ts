import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import fs from "fs-extra";
import multer from "multer";
import cors from "cors";
import axios from "axios";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Storage setup
  const uploadsDir = path.join(process.cwd(), "uploads");
  const botsDir = path.join(process.cwd(), "bots_scripts");
  await fs.ensureDir(uploadsDir);
  await fs.ensureDir(botsDir);

  // --- File Upload Setup (Memory storage for Serverless compatibility) ---
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // --- Mock DB (In-memory for demo, should be Firestore/Postgres) ---
  const initialAdminEmail = process.env.ADMIN_EMAIL || "admin@hyperhost.io";
  const initialAdminPassword = process.env.ADMIN_PASSWORD;

  let users: any[] = [];
  
  if (initialAdminPassword) {
    users.push({ 
      id: "1", 
      email: initialAdminEmail, 
      role: "SUPERADMIN", 
      password: initialAdminPassword 
    });
    console.log(`Initial admin user created: ${initialAdminEmail}`);
  } else {
    console.warn("ADMIN_PASSWORD not set. Initial admin user will not be created automatically.");
  }
  let userBots: any[] = [];
  let files: any[] = [];

  // --- API Routes ---

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      res.json({ id: user.id, email: user.email, role: user.role });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Bots
  app.get("/api/bots", (req, res) => {
    const userId = req.query.userId as string;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    if (user.role === "SUPERADMIN" || user.role === "ADMIN") {
      return res.json(userBots);
    }
    res.json(userBots.filter(b => b.ownerId === userId));
  });

  app.post("/api/bots", async (req, res) => {
    const { ownerId, name, token, scriptPath, variables } = req.body;
    
    try {
      const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
      if (!response.data.ok) throw new Error("Invalid token");
      
      const newBot = {
        id: Math.random().toString(36).substr(2, 9),
        ownerId,
        name,
        token,
        scriptPath,
        variables: variables || {},
        status: "STOPPED",
        webhookUrl: `${process.env.APP_URL || "http://localhost:3000"}/api/webhooks/bot/${token}`,
        createdAt: new Date().toISOString()
      };

      await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
        url: newBot.webhookUrl
      });

      userBots.push(newBot);
      res.json(newBot);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/bots/:id/start", (req, res) => {
    const bot = userBots.find(b => b.id === req.params.id);
    if (bot) {
      bot.status = "RUNNING";
      res.json(bot);
    } else {
      res.status(404).json({ error: "Bot not found" });
    }
  });

  app.post("/api/bots/:id/stop", (req, res) => {
    const bot = userBots.find(b => b.id === req.params.id);
    if (bot) {
      bot.status = "STOPPED";
      res.json(bot);
    } else {
      res.status(404).json({ error: "Bot not found" });
    }
  });

  // Files
  app.post("/api/files/upload", upload.array("files"), (req, res) => {
    const userId = req.body.userId;
    const uploadedFiles = (req.files as Express.Multer.File[]).map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      ownerId: userId,
      name: f.originalname,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      type: f.mimetype,
      createdAt: new Date().toISOString()
    }));
    files.push(...uploadedFiles);
    res.json(uploadedFiles);
  });

  app.get("/api/files", (req, res) => {
    const userId = req.query.userId as string;
    res.json(files.filter(f => f.ownerId === userId));
  });

  // Webhook Handler
  app.post("/api/webhooks/bot/:token", async (req, res) => {
    const token = req.params.token;
    const bot = userBots.find(b => b.token === token);
    
    if (!bot || bot.status !== "RUNNING") {
      return res.status(200).send("Bot not active");
    }

    if (bot.scriptPath && fs.existsSync(bot.scriptPath)) {
      const pythonProcess = spawn('python3', [bot.scriptPath]);
      pythonProcess.stdin.write(JSON.stringify({ update: req.body, token: bot.token }));
      pythonProcess.stdin.end();
    }
    res.status(200).json({ ok: true });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  createServer().then(app => {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
