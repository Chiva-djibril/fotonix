import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-line py-9">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] text-stone-dim tracking-wide">
          © {new Date().getFullYear()} FOTONIX STUDIO — {t("footer.rights")}
        </p>
        <p className="font-mono text-[11px] text-stone-dim tracking-wide">{t("footer.location")}</p>
      </div>
    </footer>
  );
}
