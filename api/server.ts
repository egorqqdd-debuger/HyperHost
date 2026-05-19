import { createServer } from "../server.js";

console.log("Vercel Function starting...");

let app: any;

export default async (req: any, res: any) => {
  try {
    if (!app) {
      console.log("Initializing app for the first time in this instance...");
      app = await createServer();
    }
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Function Error:", err);
    res.status(500).json({ 
      error: "Vercel Function Initialization Failed", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
