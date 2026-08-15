import { useLanguage } from "../context/LanguageContext";

const STYLES = {
  pending_payment: "border-gold text-gold-bright",
  confirmed: "border-emerald-600 text-emerald-500",
  cancelled: "border-stone-dim text-stone-dim",
  completed: "border-stone text-stone",
};

export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-widest border rounded-full px-3 py-1 ${
        STYLES[status] || "border-stone-dim text-stone-dim"
      }`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
