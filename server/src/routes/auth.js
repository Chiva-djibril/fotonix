import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "Name, email, phone and password are all required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.toLowerCase();
    const [existingRows] = await pool.execute("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (existingRows.length > 0) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, 'user', 'active')",
      [name, normalizedEmail, phone, password_hash]
    );

    const user = { id: result.insertId, name, email: normalizedEmail, phone, role: "user", status: "active" };
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    const row = rows[0];
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    if (row.status === "suspended") {
      return res.status(403).json({ error: "This account has been suspended." });
    }

    const user = { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role || "user", status: row.status || "active" };
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, phone, role, status FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Account not found." });
    if (rows[0].status === "suspended") {
      return res.status(403).json({ error: "This account has been suspended." });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
