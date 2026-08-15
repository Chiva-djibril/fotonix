import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  return (
    <button
      onClick={toggleTheme}
      aria-label={t("ui.themeToggle")}
      className={`w-9 h-9 flex items-center justify-center rounded-full border border-line text-cream hover:border-gold hover:text-gold-bright transition-colors btn-click nav-icon-btn ${className}`}
      title={theme === "dark" ? t("ui.themeToggleDark") : t("ui.themeToggleLight")}
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}

export function LanguageToggle({ className = "" }) {
  const { lang, toggleLang, t } = useLanguage();
  return (
    <button
      onClick={toggleLang}
      aria-label={t("ui.languageToggle")}
      className={`font-mono text-[11px] tracking-widest border border-line text-cream px-3 h-9 rounded-full hover:border-gold hover:text-gold-bright transition-colors btn-click nav-icon-btn ${className}`}
      title={lang === "en" ? t("ui.languageToggleEn") : t("ui.languageToggleRw")}
    >
      {lang === "en" ? "EN / RW" : "RW / EN"}
    </button>
  );
}
