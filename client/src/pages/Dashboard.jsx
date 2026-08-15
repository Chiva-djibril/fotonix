import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { formatRwf } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
import toast from "react-hot-toast";

function getBookingDetails(booking) {
  if (!booking.booking_details) return null;
  try {
    return JSON.parse(booking.booking_details);
  } catch {
    return null;
  }
}

function formatBookingSummary(booking) {
  const details = getBookingDetails(booking);
  if (!details) return booking.notes || "";

  const summary = [];
  const selectedServices = details.selected_services || [];
  if (selectedServices.includes("album") || details.booking_option === "album") {
    summary.push(details.album_required ? "Album requested" : "No album requested");
    if (details.album_type_name || details.album_type) summary.push(`${details.album_type_name || details.album_type} album`);
  }
  if (selectedServices.includes("photo_video")) summary.push("Photos + video");
  if (selectedServices.includes("video") || selectedServices.includes("photo_video")) {
    if (details.video_kind) summary.push(details.video_kind.replaceAll("_", " "));
    if (details.video_hours) summary.push(`${details.video_hours} video hours`);
  }
  if (details.photo_count) summary.push(`${details.photo_count} photos`);
  if (details.cadres_count) summary.push(`${details.cadres_count} cadres`);
  if (details.photos_per_cadre) summary.push(`${details.photos_per_cadre} per cadre`);
  if (details.boards_count) summary.push(`${details.boards_count} boards`);
  if (details.photos_per_board) summary.push(`${details.photos_per_board} per board`);
  return summary.join(" • ");
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    Promise.all([api.get("/bookings/my"), api.get("/notifications")])
      .then(([bookingsRes, notificationsRes]) => {
        setBookings(bookingsRes.data.bookings || []);
        const allNotes = notificationsRes.data.notifications || [];
        setNotifications(allNotes.filter((n) => n.type === "booking_reminder" && n.status !== "read"));
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function cancelBooking(id) {
    if (!window.confirm(t("dashboard.confirmCancel"))) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      toast.success(t("dashboard.toastCancelled"));
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t("dashboard.toastCancelError"));
    }
  }

  async function respondToNotification(id, action) {
    try {
      await api.patch(`/notifications/${id}/respond`, { action });
      // ensure the notification is also marked read when user accepts or cancels
      try {
        await api.patch(`/notifications/${id}/mark`, { status: "read" });
      } catch (e) {
        // ignore mark error
      }
      toast.success(action === "accept" ? t("dashboard.toastReminderAccepted") : t("dashboard.toastReminderCancelled"));
      window.dispatchEvent(new Event("notifications:refresh"));
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t("dashboard.toastReminderError"));
    }
  }

  return (
    <div className="min-h-screen pt-[74px] bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <span className="eyebrow-gradient">{t("dashboard.eyebrow")}</span>
        <h1 className="font-display text-cream text-5xl mt-3 mb-2 header-with-accent">{t("dashboard.title")}</h1>
        <p className="text-stone mb-10">{t("dashboard.signedInAs")} {user?.name} · {user?.email}</p>

        {loading ? (
          <p className="font-mono text-xs text-stone-dim uppercase tracking-widest">{t("dashboard.loading")}</p>
        ) : (
          <div className="space-y-6">
            {notifications.length > 0 && (
              <section className="border border-line bg-card rounded-sm p-6">
                <h2 className="font-display text-2xl text-gold-bright mb-4">{t("dashboard.notificationsTitle")}</h2>
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <div key={item.id} className="border border-line rounded-sm p-4 bg-bg/70">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-display text-lg text-cream">{item.title}</p>
                          <p className="text-sm text-stone mt-1">{item.message}</p>
                          {item.event_date && <p className="text-sm text-stone-dim mt-2">{item.event_date} at {item.event_time}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => respondToNotification(item.id, "accept")}
                            className="font-mono text-[10px] uppercase tracking-widest bg-gold text-bg px-3 py-2 rounded-sm"
                          >
                            {t("dashboard.reminderAccept")}
                          </button>
                          <button
                            onClick={() => respondToNotification(item.id, "cancel")}
                            className="font-mono text-[10px] uppercase tracking-widest border border-stone-dim text-stone px-3 py-2 rounded-sm"
                          >
                            {t("dashboard.reminderCancel")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="border border-line bg-card rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl text-gold-bright">{t("dashboard.bookingsTitle")}</h2>
                <Link to="/book" className="font-mono text-[10px] uppercase tracking-widest bg-gold text-bg px-4 py-2 rounded-sm hover:bg-gold-bright transition-colors">
                  {t("dashboard.bookFirst")}
                </Link>
              </div>

              {bookings.length === 0 ? (
                <div className="border border-line rounded-sm p-10 text-center">
                  <p className="text-stone mb-6">{t("dashboard.empty")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((b) => (
                    <div key={b.id} className="border border-line rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display text-2xl text-cream tracking-wide">{b.service_name}</h3>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="font-mono text-[11px] text-stone-dim uppercase tracking-widest">{b.service_category} · {b.event_date} at {b.event_time}</p>
                        {b.location && <p className="text-sm text-stone mt-1">{b.location}</p>}
                        {formatBookingSummary(b) && <p className="text-sm text-stone mt-2">{formatBookingSummary(b)}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-display text-2xl text-gold-bright">{formatRwf(b.amount_rwf)}</span>
                        {b.status !== "cancelled" && (
                          <button
                            onClick={() => cancelBooking(b.id)}
                            className="font-mono text-[10px] uppercase tracking-widest text-stone-dim hover:text-maroon transition-colors"
                          >
                            {t("dashboard.cancel")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
