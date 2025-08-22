import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleResumeDownload,
  handleBatchResumeDownload,
  handleResumeMetadata,
} from "./routes/resume-download";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Resume download routes
  app.post("/api/resume/download", handleResumeDownload);
  app.post("/api/resume/batch-download", handleBatchResumeDownload);
  app.get("/api/resume/metadata", handleResumeMetadata);

  return app;
}
