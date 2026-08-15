import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM services WHERE is_active = 1 ORDER BY category, subcategory, price_rwf"
    );
    res.json({ services: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM services WHERE id = ?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Service not found." });
    res.json({ service: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
