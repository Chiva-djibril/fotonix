import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { pool, initDb } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import serviceRoutes from "./routes/services.js";
import adminRoutes from "./routes/admin.js";
import bookingRoutes from "./routes/bookings.js";
import feedbackRoutes from "./routes/feedback.js";
import notificationRoutes from "./routes/notifications.js";
import albumRoutes from "./routes/albums.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, service: "fotonix-server", db: "connected" });
  } catch {
    res.status(503).json({ ok: false, service: "fotonix-server", db: "unreachable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/albums", albumRoutes);

// fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end. Please try again." });
});

const PORT = process.env.PORT || 4000;

async function startServer({ dbConnected } = { dbConnected: false }) {
  const server = app.listen(PORT, () => {
    console.log(`Fotonix API running on http://localhost:${PORT}`);
    console.log(`Database connected: ${dbConnected}`);
  });

  function shutdown(signal) {
    console.log(`\n${signal} received, shutting down gracefully…`);
    server.close(async () => {
      try {
        await pool.end();
        console.log("MySQL pool closed. Bye.");
      } catch (e) {
        // pool may be unusable if DB wasn't connected
      }
      process.exit(0);
    });
    // force-exit if something hangs
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

(async () => {
  try {
    await initDb();
    await startServer({ dbConnected: true });
  } catch (err) {
    console.error("Warning: Failed to connect to MySQL / initialize schema:", err.message || err);
    console.error("The server will start but database operations will fail until the DB is available.");
    await startServer({ dbConnected: false });
  }
})();



