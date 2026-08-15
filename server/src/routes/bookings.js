import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { createBookingReminderNotification } from "../utils/notifications.js";

const router = Router();
router.use(requireAuth);

const BOOKING_SELECT = `
  SELECT b.*, s.name AS service_name, s.category AS service_category
  FROM bookings b JOIN services s ON s.id = b.service_id
  `;

function getServiceSubcategory(service) {
  if (service.subcategory) return service.subcategory;
  return service.name?.toLowerCase().includes("video") ? "Videography" : "Photography";
}

function calculateServiceAmount(service, subcategory, selectedOption, selectedQuantity, bookingDetails) {
  const basePrice = Number(service.price_rwf || 0);
  const minPrice = service.price_min_rwf != null ? Number(service.price_min_rwf) : null;
  const maxPrice = service.price_max_rwf != null ? Number(service.price_max_rwf) : null;

  if (subcategory === "Photography") {
    const quantity = Number(selectedQuantity || bookingDetails?.photo_count || 50);
    if (quantity >= 200) return basePrice + 10000;
    if (quantity >= 100) return basePrice + 5000;
    return basePrice;
  }

  if (subcategory === "Videography") {
    if (selectedOption === "full_video_highlights") {
      return maxPrice ?? basePrice + 10000;
    }
    return minPrice ?? basePrice;
  }

  return basePrice;
}

async function resolveService(conn, body) {
  if (body.service_id) {
    const [rows] = await conn.execute("SELECT * FROM services WHERE id = ?", [body.service_id]);
    return rows[0];
  }

  const selected = Array.isArray(body.selected_services) ? body.selected_services : body.selected_services ? [body.selected_services] : body.booking_option ? [body.booking_option] : [];
  const selectsVideo = selected.includes("video") || selected.includes("photo_video") || (body.booking_option === "video");
  if (selectsVideo) {
    const [rows] = await conn.execute("SELECT * FROM services WHERE is_active = 1 AND LOWER(COALESCE(subcategory, '')) = 'videography' ORDER BY price_rwf ASC LIMIT 1");
    return rows[0];
  }

  const [rows] = await conn.execute("SELECT * FROM services WHERE is_active = 1 AND LOWER(COALESCE(subcategory, '')) = 'photography' ORDER BY price_rwf ASC LIMIT 1");
  return rows[0];
}

router.post("/", async (req, res, next) => {
  const { event_date, event_time, location, notes, selected_subcategory, selected_option, selected_quantity } = req.body;

  if (!event_date || !event_time) {
    return res.status(400).json({ error: "Date and time are required." });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (event_date < today) {
    return res.status(400).json({ error: "Please choose a date that hasn't passed yet." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const service = await resolveService(conn, req.body);
    if (!service) {
      await conn.rollback();
      return res.status(404).json({ error: "Service not found." });
    }

    const selectedServices = Array.isArray(req.body.selected_services)
      ? req.body.selected_services
      : req.body.selected_services
      ? [req.body.selected_services]
      : req.body.booking_option
      ? [req.body.booking_option]
      : ["photo_session"];

    const bookingDetails = {
      selected_services: selectedServices,
      photo_count: req.body.photo_count ? Number(req.body.photo_count) : null,
      album_required: req.body.album_required === true || req.body.album_required === "true",
      album_type: req.body.album_type || req.body.album_type_name || null,
      album_type_id: req.body.album_type_id ? Number(req.body.album_type_id) : null,
      album_type_name: req.body.album_type_name || req.body.album_type || null,
      album_photos: req.body.album_photos ? Number(req.body.album_photos) : 0,
      video_kind: req.body.video_kind || null,
      video_hours: req.body.video_hours ? Number(req.body.video_hours) : 0,
      cadres_count: req.body.cadres_count ? Number(req.body.cadres_count) : 0,
      photos_per_cadre: req.body.photos_per_cadre ? Number(req.body.photos_per_cadre) : 0,
      boards_count: req.body.boards_count ? Number(req.body.boards_count) : 0,
      photos_per_board: req.body.photos_per_board ? Number(req.body.photos_per_board) : 0,
      extra_request: req.body.extra_request || "",
    };

    // Server-side validation: allocations must not exceed total photo_count
    if (bookingDetails.photo_count != null) {
      let allocated = 0;
      if (selectedServices.includes("album") && bookingDetails.album_required) allocated += bookingDetails.album_photos;
      if (selectedServices.includes("cadre")) allocated += bookingDetails.cadres_count * bookingDetails.photos_per_cadre;
      if (selectedServices.includes("board")) allocated += bookingDetails.boards_count * bookingDetails.photos_per_board;
      if (allocated > bookingDetails.photo_count) {
        await conn.rollback();
        return res.status(400).json({ error: "Allocated photos exceed chosen total photo_count." });
      }
    }

    const subcategory = selected_subcategory || getServiceSubcategory(service);
    const amountRwf = calculateServiceAmount(service, subcategory, selected_option, selected_quantity, bookingDetails);
    const detailSummary = [
      (selectedServices.includes("album") ? `Album ${bookingDetails.album_required ? "with album" : "without album"}` : null),
      bookingDetails.photo_count ? `${bookingDetails.photo_count} photos` : null,
      bookingDetails.album_type_name ? `${bookingDetails.album_type_name} album` : null,
      bookingDetails.album_photos ? `${bookingDetails.album_photos} photos in album` : null,
      bookingDetails.video_kind ? `${bookingDetails.video_kind.replaceAll('_', ' ')} video` : null,
      bookingDetails.video_hours ? `${bookingDetails.video_hours} video hours` : null,
      bookingDetails.cadres_count ? `${bookingDetails.cadres_count} cadres` : null,
      bookingDetails.photos_per_cadre ? `${bookingDetails.photos_per_cadre} photos per cadre` : null,
      bookingDetails.boards_count ? `${bookingDetails.boards_count} boards` : null,
      bookingDetails.photos_per_board ? `${bookingDetails.photos_per_board} photos per board` : null,
    ].filter(Boolean).join(" • ");

    const detailNote = [notes, `Selection: ${service.category} • ${subcategory} • ${detailSummary || selectedServices.join(',')}`]
      .filter(Boolean)
      .join("\n");

    const [clashRows] = await conn.execute(
      `SELECT id FROM bookings WHERE event_date = ? AND event_time = ?
       AND status IN ('pending_payment','confirmed') FOR UPDATE`,
      [event_date, event_time]
    );
    if (clashRows[0]) {
      await conn.rollback();
      return res.status(409).json({ error: "That date and time is already booked. Please pick another slot." });
    }

    const [result] = await conn.execute(
      `INSERT INTO bookings (user_id, service_id, event_date, event_time, location, notes, amount_rwf, selected_subcategory, selected_option, selected_quantity, booking_details, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [req.user.id, service.id, event_date, event_time, location || null, detailNote || null, amountRwf, subcategory, selectedServices.join(','), bookingDetails.photo_count != null ? Number(bookingDetails.photo_count) : null, JSON.stringify(bookingDetails)]
    );

    await conn.commit();

    const [bookingRows] = await pool.execute(`${BOOKING_SELECT} WHERE b.id = ?`, [result.insertId]);
    const booking = bookingRows[0];
    await createBookingReminderNotification({ id: booking.id, user_id: req.user.id, event_date: booking.event_date, event_time: booking.event_time });

    res.status(201).json({ booking });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.get("/my", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `${BOOKING_SELECT} WHERE b.user_id = ? ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ bookings: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `${BOOKING_SELECT} WHERE b.id = ? AND b.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Booking not found." });
    res.json({ booking: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/cancel", async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM bookings WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.user.id,
    ]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "Booking not found." });
    if (row.status === "completed") {
      return res.status(400).json({ error: "A completed booking can't be cancelled." });
    }
    await pool.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [row.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
