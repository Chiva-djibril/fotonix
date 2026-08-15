import { useEffect, useState } from "react";
import api from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

export default function Notifications() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotes(res.data.notifications || []);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/mark`, { status: "read" });
      setNotes((n) => n.map((it) => (it.id === id ? { ...it, status: "read" } : it)));
      window.dispatchEvent(new Event("notifications:refresh"));
    } catch (err) {
      toast.error("Failed to mark read");
    }
  }

  return (
    <div className="min-h-screen pt-[74px] bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl text-cream mb-4 header-with-accent">{t("nav.notifications") || 'Notifications'}</h1>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-card border border-line rounded-sm p-4">
            <h2 className="font-mono text-sm uppercase text-gold mb-3">{t('notifications.inbox') || 'Inbox'}</h2>
            {loading ? (
              <p className="text-stone-dim">{t('notifications.loading')}</p>
            ) : notes.length === 0 ? (
              <p className="text-stone-dim">{t('notifications.noNotifications') || 'No notifications'}</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className={`p-3 rounded-sm border ${n.status === 'unread' ? 'bg-bg/70' : 'bg-bg/40'} border-line` }>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-display text-sm text-cream">{n.title}</div>
                        <div className="text-sm text-stone mt-1">{n.message}</div>
                        <div className="text-xs text-stone-dim mt-2">{n.created_at}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {n.status === 'unread' && (
                          <button onClick={() => markRead(n.id)} className="text-xs font-mono uppercase border border-gold text-gold px-2 py-1 rounded-sm">{t('notifications.markRead')}</button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
