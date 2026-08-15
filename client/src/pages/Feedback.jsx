import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../api/client";
import toast from "react-hot-toast";

export default function Feedback() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    type: "bug",
    message: "",
  });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/feedback", form);
      toast.success(t("feedback.toastSent"));
      setForm({ ...form, message: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || t("feedback.toastError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pt-[74px] bg-bg">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <span className="eyebrow-gradient">{t("feedback.eyebrow")}</span>
        <h1 className="font-display text-cream text-5xl mt-3 mb-2 header-with-accent">{t("feedback.title")}</h1>
        <p className="text-stone mb-10">{t("feedback.sub")}</p>

        <form onSubmit={handleSubmit} className="space-y-5 border border-line bg-card rounded-sm p-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("feedback.name")}</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-bg border border-line rounded-sm px-4 py-3 text-cream"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("feedback.email")}</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-bg border border-line rounded-sm px-4 py-3 text-cream"
              />
            </label>
          </div>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("feedback.type")}</span>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-bg border border-line rounded-sm px-4 py-3 text-cream"
            >
              <option value="bug">{t("feedback.typeBug")}</option>
              <option value="recommendation">{t("feedback.typeRecommendation")}</option>
              <option value="other">{t("feedback.typeOther")}</option>
            </select>
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("feedback.message")}</span>
            <textarea
              rows={6}
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full bg-bg border border-line rounded-sm px-4 py-3 text-cream resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full font-mono text-xs uppercase tracking-widest bg-gold text-bg py-4 rounded-sm hover:bg-gold-bright transition-colors disabled:opacity-50"
          >
            {busy ? t("feedback.sending") : t("feedback.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
