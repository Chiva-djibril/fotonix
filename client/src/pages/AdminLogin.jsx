import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(form);
      if (user.role !== "admin") {
        toast.error(t("adminLogin.adminOnly"));
        return;
      }
      const from = location.state?.from?.pathname || "/admin-panel";
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || t("adminLogin.loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pt-[74px] bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-line bg-card p-8 rounded-sm">
        <p className="eyebrow-gradient">{t("adminLogin.eyebrow")}</p>
        <h1 className="font-display text-cream text-4xl mt-3 mb-2 header-with-accent">{t("adminLogin.title")}</h1>
        <p className="text-stone mb-8">{t("adminLogin.subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("adminLogin.email")}</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-bg border border-line rounded-sm px-4 py-3 text-cream"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("adminLogin.password")}</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-bg border border-line rounded-sm px-4 py-3 text-cream"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full font-mono text-[11px] uppercase tracking-widest bg-gold text-bg py-3 rounded-sm hover:bg-gold-bright transition-colors disabled:opacity-50"
          >
            {busy ? t("adminLogin.submitting") : t("adminLogin.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
