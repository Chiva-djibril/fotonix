import React, { useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function AlertModal({ open, title, body, actions = [], onClose }) {
  const { t } = useLanguage();
  const panelRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      // focus first interactive element
      setTimeout(() => {
        const btn = panelRef.current?.querySelector("button");
        btn?.focus();
      }, 0);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div ref={panelRef} role="dialog" aria-modal="true" className="relative w-full max-w-xl mx-4 bg-[var(--bg)] border border-line rounded-lg p-6 shadow-lg">
        <div className="mb-3">
          <div className="font-display text-lg text-gold">{title}</div>
        </div>
        <div className="text-sm text-stone-dim mb-5">{body}</div>

        <div className="flex items-center gap-3 justify-end">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className={`${a.primary ? 'font-mono text-xs uppercase tracking-widest border border-gold text-gold px-4 py-2 rounded-sm hover:bg-gold hover:text-cream transition-colors' : 'font-mono text-xs uppercase tracking-widest border border-gold text-gold px-4 py-2 rounded-sm hover:border-gold hover:text-gold-bright transition-colors'}`}
            >
              {a.label}
            </button>
          ))}

          <button onClick={onClose} className="ml-2 text-sm text-stone-dim">{t("ui.close")}</button>
        </div>
      </div>
    </div>
  );
}
