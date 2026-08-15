import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form);
      toast.success(t("auth.toastWelcomeBack"));
      navigate(location.state?.from?.pathname || "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || t("auth.toastLoginFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pt-[74px] flex items-center bg-bg">
      <div className="max-w-md w-full mx-auto px-6 py-16">
        <span className="eyebrow-gradient">{t("auth.welcomeBack")}</span>
        <h1 className="font-display text-cream text-5xl mt-3 mb-8 header-with-accent">{t("auth.signIn")}</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label={t("auth.email")} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Field label={t("auth.password")} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
          <button
            disabled={busy}
            className="w-full font-mono text-xs uppercase tracking-widest bg-gold text-bg py-4 rounded-sm hover:bg-gold-bright transition-colors disabled:opacity-50"
          >
            {busy ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>

        <p className="text-sm text-stone mt-6">
          {t("auth.newHere")}{" "}
          <Link to="/register" className="text-gold-bright hover:underline">{t("auth.createOne")}</Link>
        </p>
      </div>
    </div>
  );
}

export function Field({ label, type = "text", value, onChange, required }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream font-body focus:outline-none focus:border-gold transition-colors"
      />
    </label>
  );
}
