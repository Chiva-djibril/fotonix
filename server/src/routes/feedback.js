import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { type, message, name, email } = req.body;
    if (!type || !message) {
      return res.status(400).json({ error: "Type and message are required." });
    }

    const userId = req.user?.id ?? null;
    const [result] = await pool.execute(
      `INSERT INTO feedback (user_id, name, email, type, message) VALUES (?, ?, ?, ?, ?)`,
      [userId, name || null, email || null, type, message]
    );

    res.status(201).json({ feedback: { id: result.insertId, type, message } });
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM feedback ORDER BY created_at DESC");
    res.json({ feedback: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
