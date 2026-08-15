import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { ThemeToggle, LanguageToggle } from "./Toggles";
import { useEffect, useState } from "react";
import api from "../api/client";

const linkClass = ({ isActive }) =>
  `font-mono text-[11px] uppercase tracking-widest transition-colors ${
    isActive ? "text-gold-bright" : "text-stone hover:text-gold-bright"
  }`;

function NotificationsBadge({ user }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user) return;
      try {
        const res = await api.get("/notifications");
        const notes = res.data.notifications || [];
        if (!mounted) return;
        setUnread(notes.filter((n) => n.status === "unread").length);
      } catch (err) {
        // ignore
      }
    }
    load();
    const iv = setInterval(load, 30000); // refresh every 30s
    window.addEventListener("notifications:refresh", load);
    return () => {
      mounted = false;
      clearInterval(iv);
      window.removeEventListener("notifications:refresh", load);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Link to="/notifications" className="relative">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cream">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z" />
      </svg>
      {unread > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-1 rounded-full">{unread}</span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Render entirely different navbar for admins: only admin-related links
  if (user?.role === "admin") {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-90)] backdrop-blur-md border-b border-line">
        <nav className="max-w-6xl mx-auto px-6 h-[74px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Fotonix Studio" className="w-16 h-17 object-cover " />
            <span className="font-display text-xl text-cream tracking-wide">FOTONIX<span className="text-gold"> Studio</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/admin" className={linkClass}>{t("nav.dashboard")}</NavLink>
            <NavLink to="/admin" className={linkClass}>{t("nav.bookings")}</NavLink>
            <NavLink to="/admin" className={linkClass}>{t("nav.users")}</NavLink>
            <NavLink to="/admin" className={linkClass}>{t("nav.services")}</NavLink>
            <NavLink to="/admin" className={linkClass}>{t("nav.feedback")}</NavLink>
            <NavLink to="/admin" className={linkClass}>{t("nav.messages")}</NavLink>
            <NotificationsBadge user={user} />
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="font-mono text-[11px] uppercase tracking-widest border border-stone-dim text-cream px-4 py-2 rounded-sm hover:border-gold hover:text-gold-bright transition-colors"
            >
              {t("nav.signOut")}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <NotificationsBadge user={user} />
            <ThemeToggle />
            <button className="text-cream p-1" onClick={() => setOpen(!open)} aria-label={t("nav.menuToggle")}> 
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>

          {open && (
            <div className="md:hidden bg-bg-alt border-t border-line px-6 py-5 flex flex-col gap-5">
              <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>{t("nav.dashboard")}</NavLink>
              <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>{t("nav.bookings")}</NavLink>
              <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>{t("nav.users")}</NavLink>
              <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>{t("nav.services")}</NavLink>
              <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>{t("nav.feedback")}</NavLink>
              <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>{t("nav.messages")}</NavLink>
              <button
                onClick={() => { logout(); setOpen(false); navigate('/'); }}
                className="font-mono text-[11px] uppercase tracking-widest text-left text-cream"
              >
                {t("nav.signOut")}
              </button>
            </div>
          )}
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-90)] backdrop-blur-md border-b border-line">
      <nav className="max-w-6xl mx-auto px-6 h-[74px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Fotonix Studio" className="w-16 h-17 object-cover " />
          <span className="font-display text-xl text-cream tracking-wide">FOTONIX<span className="text-gold"> Studio</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <NavLink to="/services" className={linkClass}>{t("nav.services")}</NavLink>
          <NavLink to="/book" className={linkClass}>{t("nav.book")}</NavLink>
          <NavLink to="/albums" className={linkClass}>{t("nav.albums")}</NavLink>
          <NavLink to="/contact" className={linkClass}>{t("nav.contact")}</NavLink>
          <NavLink to="/feedback" className={linkClass}>{t("nav.feedback")}</NavLink>
          {user && <NavLink to="/dashboard" className={linkClass}>{t("nav.myBookings")}</NavLink>}
          <NotificationsBadge user={user} />

          {!user ? (
            <>
              <NavLink to="/login" className={linkClass}>{t("nav.login")}</NavLink>
              <Link
                to="/register"
                className="font-mono text-[11px] uppercase tracking-widest border border-gold text-gold px-4 py-2 rounded-sm hover:bg-gold hover:text-cream transition-colors"
              >
                {t("nav.createAccount")}
              </Link>
            </>
          ) : (
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="font-mono text-[11px] uppercase tracking-widest border border-stone-dim text-cream px-4 py-2 rounded-sm hover:border-gold hover:text-gold-bright transition-colors"
            >
              {t("nav.signOut")}
            </button>
          )}
          <div className="flex items-center gap-2 pl-2 border-l border-line">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button className="text-cream p-1 nav-icon-btn" onClick={() => setOpen(!open)} aria-label={t("nav.menuToggle")} title={open ? "Close menu" : "Open menu"}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden bg-bg-alt border-t border-line px-6 py-5 flex flex-col gap-5">
          <NavLink to="/services" className={linkClass} onClick={() => setOpen(false)}>{t("nav.services")}</NavLink>
          <NavLink to="/book" className={linkClass} onClick={() => setOpen(false)}>{t("nav.book")}</NavLink>
          <NavLink to="/albums" className={linkClass} onClick={() => setOpen(false)}>{t("nav.albums")}</NavLink>
          <NavLink to="/contact" className={linkClass} onClick={() => setOpen(false)}>{t("nav.contact")}</NavLink>
          <NavLink to="/feedback" className={linkClass} onClick={() => setOpen(false)}>{t("nav.feedback")}</NavLink>
          {user && <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>{t("nav.myBookings")}</NavLink>}
          {!user ? (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>{t("nav.login")}</NavLink>
              <NavLink to="/register" className={linkClass} onClick={() => setOpen(false)}>{t("nav.createAccount")}</NavLink>
            </>
          ) : (
            <button
              onClick={() => { logout(); setOpen(false); navigate("/"); }}
              className="font-mono text-[11px] uppercase tracking-widest text-left text-cream"
            >
              {t("nav.signOut")}
            </button>
          )}
          <div className="pt-2 border-t border-line">
            <LanguageToggle />
          </div>
        </div>
      )}
    </header>
  );
}

