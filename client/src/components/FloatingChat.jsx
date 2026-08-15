import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

// Floating chat widget available to signed-in customers on every page.
// Users can only use this to pick an admin and send a message — they
// cannot browse a shared inbox of messages, since those are only
// visible to the admin who receives them.
export default function FloatingChat() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadAdminReplies, setUnreadAdminReplies] = useState(0);

  useEffect(() => {
    if (!open || !user) return;
    let mounted = true;
    setLoadingAdmins(true);
    api
      .get("/notifications/admins")
      .then((res) => {
        if (!mounted) return;
        const list = res.data.admins || [];
        setAdmins(list);
        if (list.length === 1) setAdminId(String(list[0].id));
      })
      .catch(() => {
        if (mounted) toast.error(t("chat.loadAdminsFail") || "Couldn't load admins right now.");
      })
      .finally(() => mounted && setLoadingAdmins(false));
    return () => {
      mounted = false;
    };
  }, [open, user]);

  // load unread admin-reply notifications count for the floating badge
  async function loadUnreadAdminReplies() {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      const notes = res.data.notifications || [];
      const cnt = notes.filter(n => n.type === 'admin_reply' && n.status === 'unread').length;
      setUnreadAdminReplies(cnt);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    loadUnreadAdminReplies();
    const handler = () => loadUnreadAdminReplies();
    window.addEventListener('notifications:refresh', handler);
    return () => window.removeEventListener('notifications:refresh', handler);
  }, [user]);

  if (!user || user.role === "admin") return null;

  async function handleSend(e) {
    e.preventDefault();
    if (!adminId) return toast.error(t("chat.chooseAdmin") || "Please choose an admin to message.");
    if (!subject || !message) return toast.error(t("notifications.composeRequire") || "Subject and message are required.");
    setSending(true);
    try {
      await api.post("/notifications/send-to-admin", { adminId: Number(adminId), subject, message });
      toast.success(t("chat.sentToast") || "Message sent");
      setSubject("");
      setMessage("");
      setOpen(false);
      // bump local count to indicate admin will see it (server will create responses later)
      // no change to unreadAdminReplies here; admin replies will increment via notifications:refresh
    } catch (err) {
      toast.error(err.response?.data?.error || t("chat.sendFail") || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) { /* opening: mark admin replies read? leave to Notifications page */ } }}
        title={t("notifications.floatingButton") || "Chat with admins"}
        className="fixed right-6 bottom-6 border-2 border-gold text-gold bg-transparent w-12 h-12 rounded-full shadow-lg z-50 inline-flex items-center justify-center hover:bg-gold hover:text-cream hover:scale-105 transition-smooth btn-hover-lift float-right btn-ripple nav-icon-btn"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <span className="relative inline-flex items-center justify-center" aria-hidden="true">
          {open ? (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2v-5.1A7.5 7.5 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
          {unreadAdminReplies > 0 && !open && (
            <span className="absolute -top-2 -right-2 bg-maroon text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{unreadAdminReplies}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="fixed right-6 bottom-20 w-[90vw] max-w-96 bg-card border border-line rounded-sm p-4 shadow-lg z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-sm text-cream">{t("notifications.compose") || "Message an admin"}</div>
            <button onClick={() => setOpen(false)} className="text-stone-dim hover:text-cream transition-colors btn-click" title="Close chat" aria-label="Close chat">✕ Close</button>
          </div>
          <form onSubmit={handleSend} className="space-y-2">
            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-1">
                {t("chat.chooseAdminLabel") || "Send to"}
              </span>
              <select
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full bg-bg border border-line rounded-sm px-3 py-2 text-cream"
              >
                <option value="">{loadingAdmins ? (t("chat.loadingAdmins") || "Loading admins…") : (t("chat.selectAdmin") || "Select an admin")}</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {!loadingAdmins && admins.length === 0 && (
                <p className="text-xs text-stone-dim mt-1">{t("chat.noAdmins") || "No admins are available right now."}</p>
              )}
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("notifications.composePlaceholderSubject") || "Subject"}
              className="w-full bg-bg border border-line rounded-sm px-3 py-2 text-cream"
            />
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("notifications.composePlaceholderMessage") || "Message"}
              className="w-full bg-bg border border-line rounded-sm px-3 py-2 text-cream resize-none"
            />
            <div className="flex items-center justify-between">
              <button
                disabled={sending}
                className="font-mono text-[11px] uppercase tracking-widest border border-gold text-gold px-4 py-2 rounded-sm hover:bg-gold hover:text-cream transition-colors disabled:opacity-50"
              >
                {t("notifications.sendButton") || "Send"}
              </button>
              <button
                type="button"
                onClick={() => { setSubject(""); setMessage(""); }}
                className="text-stone-dim"
              >
                {t("notifications.clear") || "Clear"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
