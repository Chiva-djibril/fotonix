import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { createNotification } from "../utils/notifications.js";
import crypto from "crypto";

const router = Router();
router.use(requireAuth, requireAdmin);

const SERVICE_FIELDS = ["category", "subcategory", "name", "description", "price_rwf", "price_min_rwf", "price_max_rwf", "duration_label", "price_note", "is_active"];
const ALBUM_TYPE_FIELDS = ["name", "description", "price_rwf", "is_active"];

function generateAlbumSlug() {
  return crypto.randomBytes(9).toString("base64url");
}

router.get("/services", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM services WHERE is_active = 1 ORDER BY category, subcategory, price_rwf"
    );
    res.json({ services: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/services", async (req, res, next) => {
  try {
    const payload = req.body;
    const missing = ["category", "subcategory", "name", "price_rwf"].filter((field) => !payload[field]);
    if (missing.length > 0) {
      return res.status(400).json({ error: "Category, subcategory, name and price are required." });
    }

    const values = SERVICE_FIELDS.map((field) => {
      if (field === "is_active") return payload.is_active ?? 1;
      return payload[field] ?? null;
    });
    const [result] = await pool.execute(
      `INSERT INTO services (${SERVICE_FIELDS.join(", ")}) VALUES (${SERVICE_FIELDS.map(() => "?").join(", ")})`,
      values
    );

    const [rows] = await pool.execute("SELECT * FROM services WHERE id = ?", [result.insertId]);
    res.status(201).json({ service: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch("/services/:id", async (req, res, next) => {
  try {
    const updates = {};
    SERVICE_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No service updates were provided." });
    }

    const columns = Object.keys(updates)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = Object.values(updates);

    await pool.execute(`UPDATE services SET ${columns} WHERE id = ?`, [...values, req.params.id]);

    const [rows] = await pool.execute("SELECT * FROM services WHERE id = ?", [req.params.id]);
    res.json({ service: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/album-types", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM album_types ORDER BY is_active DESC, name ASC"
    );
    res.json({ albumTypes: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/album-types", async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload.name || !String(payload.name).trim()) {
      return res.status(400).json({ error: "Album type name is required." });
    }

    const values = ALBUM_TYPE_FIELDS.map((field) => {
      if (field === "is_active") return payload.is_active ?? 1;
      return payload[field] ?? null;
    });

    const [result] = await pool.execute(
      `INSERT INTO album_types (${ALBUM_TYPE_FIELDS.join(", ")}) VALUES (${ALBUM_TYPE_FIELDS.map(() => "?").join(", ")})`,
      values
    );

    const [rows] = await pool.execute("SELECT * FROM album_types WHERE id = ?", [result.insertId]);
    res.status(201).json({ albumType: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch("/album-types/:id", async (req, res, next) => {
  try {
    const updates = {};
    ALBUM_TYPE_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No album type updates were provided." });
    }

    const columns = Object.keys(updates)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = Object.values(updates);

    await pool.execute(`UPDATE album_types SET ${columns} WHERE id = ?`, [...values, req.params.id]);

    const [rows] = await pool.execute("SELECT * FROM album_types WHERE id = ?", [req.params.id]);
    res.json({ albumType: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post("/albums", async (req, res, next) => {
  try {
    const { title, user_id, album_type_id } = req.body;
    if (!title || !String(title).trim() || !user_id || !album_type_id) {
      return res.status(400).json({ error: "Album name, customer and album type are required." });
    }

    const [userRows] = await pool.execute("SELECT id FROM users WHERE id = ? AND role = 'user'", [user_id]);
    if (!userRows[0]) return res.status(404).json({ error: "Customer not found." });

    const [typeRows] = await pool.execute("SELECT id FROM album_types WHERE id = ? AND is_active = 1", [album_type_id]);
    if (!typeRows[0]) return res.status(404).json({ error: "Active album type not found." });

    const [result] = await pool.execute(
      "INSERT INTO albums (user_id, title, album_type_id, slug) VALUES (?, ?, ?, ?)",
      [user_id, String(title).trim(), album_type_id, generateAlbumSlug()]
    );

    const [rows] = await pool.execute(
      `SELECT a.id, a.title, a.slug, a.cover_url, a.created_at, a.album_type_id,
              at.name AS album_type_name, u.name AS user_name, u.email AS user_email
       FROM albums a
       LEFT JOIN album_types at ON at.id = a.album_type_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ album: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    const updates = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(req.body, "role")) {
      updates.push("role = ?");
      values.push(req.body.role);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
      updates.push("status = ?");
      values.push(req.body.status);
      if (req.body.status === "suspended") {
        updates.push("suspended_reason = ?");
        values.push(req.body.suspended_reason || "Account suspended by admin.");
      } else {
        updates.push("suspended_reason = ?");
        values.push(null);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No user updates were provided." });
    }

    await pool.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, [...values, req.params.id]);

    const [userRows] = await pool.execute("SELECT id, name, email, phone, role, status FROM users WHERE id = ?", [req.params.id]);
    const user = userRows[0];

    if (user && Object.prototype.hasOwnProperty.call(req.body, "status")) {
      const title = user.status === "suspended" ? "Your account has been suspended" : "Your account has been reactivated";
      const message = user.status === "suspended"
        ? "Your account was suspended by an administrator. Please contact the studio if you need help."
        : "Your account has been reactivated. You can continue using Fotonix Studio.";
      await createNotification({ userId: user.id, type: "account_update", title, message });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT id, name, email FROM users WHERE id = ?", [req.params.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User not found." });

    await createNotification({
      userId: user.id,
      type: "account_update",
      title: "Your account was removed",
      message: "Your account was removed by an administrator. Please contact the studio for help.",
    });

    await pool.execute("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get("/bookings", async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, u.name AS user_name, u.email AS user_email, s.name AS service_name, s.category AS service_category, s.subcategory AS service_subcategory
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN services s ON s.id = b.service_id
      ORDER BY b.created_at DESC
    `);
    res.json({ bookings: rows });
  } catch (err) {
    next(err);
  }
});

// Messages sent by users directly to this admin (chosen from the admin list)
router.get("/messages", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.name AS sender_name, u.email AS sender_email
       FROM notifications n
       LEFT JOIN users u ON u.id = n.sender_id
       WHERE n.user_id = ? AND n.type = 'admin_message'
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );
    res.json({ messages: rows });
  } catch (err) {
    next(err);
  }
});

// Reply to a message a user sent to this admin
router.post("/messages/:id/reply", async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: "Subject and message are required." });

    const [rows] = await pool.execute(
      "SELECT * FROM notifications WHERE id = ? AND user_id = ? AND type = 'admin_message'",
      [req.params.id, req.user.id]
    );
    const original = rows[0];
    if (!original) return res.status(404).json({ error: "Message not found." });
    if (!original.sender_id) return res.status(400).json({ error: "This message has no sender to reply to." });

    await createNotification({
      userId: original.sender_id,
      senderId: req.user.id,
      bookingId: null,
      type: "admin_reply",
      title: subject,
      message,
      status: "unread",
    });

    await pool.execute("UPDATE notifications SET status = 'replied' WHERE id = ?", [req.params.id]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/feedback", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM feedback ORDER BY created_at DESC");
    res.json({ feedback: rows });
  } catch (err) {
    next(err);
  }
});

// Reply to feedback via email and mark it responded
router.post("/feedback/:id/reply", async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: "Subject and message are required." });

    const [rows] = await pool.execute("SELECT * FROM feedback WHERE id = ?", [req.params.id]);
    const fb = rows[0];
    if (!fb) return res.status(404).json({ error: "Feedback not found." });

    // If this feedback is linked to a user, create an in-app notification. For anonymous feedback, save the admin response but don't attempt a notification.
    let notified = false;
    if (fb.user_id) {
      await createNotification({ userId: fb.user_id, bookingId: null, type: "feedback_reply", title: subject, message, status: "unread" });
      notified = true;
    }

    await pool.execute("UPDATE feedback SET status = ?, admin_response = ?, responder_id = ?, responded_at = NOW() WHERE id = ?", ["responded", message, req.user.id, req.params.id]);

    res.json({ ok: true, notified });
  } catch (err) {
    next(err);
  }
});

export default router;
