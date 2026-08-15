import { pool } from "../config/db.js";

export async function createNotification({ userId, senderId = null, bookingId = null, type, title, message, status = "unread" }) {
  if (!userId) return null;
  const [result] = await pool.execute(
    `INSERT INTO notifications (user_id, sender_id, booking_id, type, title, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, senderId, bookingId, type, title, message, status]
  );
  return result.insertId;
}

export async function createBookingReminderNotification(booking) {
  if (!booking?.id || !booking?.user_id) return null;
  const eventDate = new Date(booking.event_date);
  const now = new Date();
  const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0 || diffDays > 7) return null;
  const title = diffDays <= 1 ? "Your booking is coming up soon" : "Your booking reminder";
  const message = `Your booking for ${booking.event_date} at ${booking.event_time} is getting close. Please confirm you can still make it or cancel if needed.`;
  return createNotification({
    userId: booking.user_id,
    bookingId: booking.id,
    type: "booking_reminder",
    title,
    message,
  });
}
