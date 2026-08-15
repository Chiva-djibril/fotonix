import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);

function getFromPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem("fotonix_lang") || "en";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function toggleLang() {
    setLang((l) => {
      const next = l === "en" ? "rw" : "en";
      localStorage.setItem("fotonix_lang", next);
      return next;
    });
  }

  function t(path) {
    const value = getFromPath(translations[lang], path);
    if (value !== undefined) return value;
    const en = getFromPath(translations.en, path);
    return en !== undefined ? en : undefined;
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
