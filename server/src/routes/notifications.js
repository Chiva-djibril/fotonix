import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { createNotification } from "../utils/notifications.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, b.event_date, b.event_time FROM notifications n
       LEFT JOIN bookings b ON b.id = n.booking_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );
    res.json({ notifications: rows });
  } catch (err) {
    next(err);
  }
});

// mark read/unread
router.patch("/:id/mark", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["read", "unread", "archived"].includes(status)) return res.status(400).json({ error: "Invalid status." });
    const [rows] = await pool.execute("SELECT * FROM notifications WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "Notification not found." });
    await pool.execute("UPDATE notifications SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// respond to a booking reminder: "accept" keeps the booking as-is, "cancel" cancels it
router.patch("/:id/respond", async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!["accept", "cancel"].includes(action)) {
      return res.status(400).json({ error: "Invalid action." });
    }

    const [rows] = await pool.execute("SELECT * FROM notifications WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    const note = rows[0];
    if (!note) return res.status(404).json({ error: "Notification not found." });

    if (action === "cancel" && note.booking_id) {
      const [bookingRows] = await pool.execute("SELECT * FROM bookings WHERE id = ? AND user_id = ?", [note.booking_id, req.user.id]);
      const booking = bookingRows[0];
      if (booking && booking.status !== "completed" && booking.status !== "cancelled") {
        await pool.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [booking.id]);
      }
    }

    await pool.execute("UPDATE notifications SET status = 'read' WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// list active admins so a user can pick who to message
router.get("/admins", async (req, res, next) => {
  try {
    const [admins] = await pool.query(
      "SELECT id, name FROM users WHERE role = 'admin' AND status = 'active' ORDER BY name"
    );
    res.json({ admins });
  } catch (err) {
    next(err);
  }
});

// user sends a message to one chosen admin (in-app). Only that admin can see and reply to it.
router.post("/send-to-admin", async (req, res, next) => {
  try {
    const { adminId, subject, message } = req.body;
    if (!adminId || !subject || !message) {
      return res.status(400).json({ error: "Please choose an admin and fill in the subject and message." });
    }

    const [admins] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND role = 'admin' AND status = 'active'",
      [adminId]
    );
    if (!admins[0]) return res.status(404).json({ error: "That admin isn't available right now." });

    await createNotification({
      userId: admins[0].id,
      senderId: req.user.id,
      bookingId: null,
      type: "admin_message",
      title: subject,
      message,
      status: "unread",
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
