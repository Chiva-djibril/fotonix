import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Field } from "./Login";
import toast from "react-hot-toast";

export default function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success(t("auth.toastAccountCreated"));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || t("auth.toastRegisterFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pt-[74px] flex items-center bg-bg">
      <div className="max-w-md w-full mx-auto px-6 py-16">
        <span className="eyebrow-gradient">{t("auth.getStarted")}</span>
        <h1 className="font-display text-cream text-5xl mt-3 mb-8 header-with-accent">{t("auth.createAccount")}</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label={t("auth.fullName")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label={t("auth.email")} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Field label={t("auth.phoneLabel")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
          <Field label={t("auth.password")} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
          <button
            disabled={busy}
            className="w-full font-mono text-xs uppercase tracking-widest bg-gold text-bg py-4 rounded-sm hover:bg-gold-bright transition-colors disabled:opacity-50"
          >
            {busy ? t("auth.creating") : t("auth.createAccount")}
          </button>
        </form>

        <p className="text-sm text-stone mt-6">
          {t("auth.alreadyHave")}{" "}
          <Link to="/login" className="text-gold-bright hover:underline">{t("auth.signInLink")}</Link>
        </p>
      </div>
    </div>
  );
}
