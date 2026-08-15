import { useLanguage } from "../context/LanguageContext";

const WHATSAPP_URL = "https://wa.me/250788509188";
const CALL_HREF = "tel:+250784538466";

export default function Contact() {
  const { t } = useLanguage();
  const tags = t("contact.tags");

  return (
    <div className="pt-[74px] bg-bg min-h-screen">
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="relative overflow-hidden border border-line rounded-[28px] bg-[color:var(--bg-alt)]/90 p-6 md:p-8 lg:p-10 shadow-[0_24px_90px_rgba(36,31,25,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(181,112,15,0.14),transparent_55%)]" />
          <div className="relative grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-center">
            <div className="max-w-2xl">
            <span className="eyebrow-gradient">
                {t("contact.eyebrow")}
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-cream tracking-wide mt-3 mb-4 header-with-accent">
                {t("contact.paperworkTitle")}
              </h2>
              <p className="text-sm md:text-base text-stone leading-7 max-w-xl">
                {t("contact.paperworkText")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {Array.isArray(tags) &&
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[11px] tracking-[0.24em] border border-gold text-gold-bright px-4 py-2 rounded-full whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </div>

            <div className="relative min-h-[320px] rounded-[24px] overflow-hidden border border-line bg-card">
              <img
                src="/photos/artistic-portrait.jpg"
                alt="Fotonix Studio portrait"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--bg)]/95 via-[color:var(--bg)]/25 to-transparent" />
              <div className="absolute inset-3 border border-[color:var(--cream-15)] rounded-[20px]" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-bright mb-2">
                  {t("contact.cardTitle")}
                </p>
                <p className="text-sm text-cream max-w-sm leading-6">
                  {t("contact.cardText")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sprockets mt-4" />

      <section className="max-w-6xl mx-auto px-6 py-14 md:py-18">
        <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-14 items-start">
          <div className="rounded-[24px] border border-line bg-[color:var(--card)]/95 p-8 md:p-10 backdrop-blur-sm shadow-[0_18px_48px_rgba(36,31,25,0.08)]">
            <span className="eyebrow-gradient">
              {t("contact.eyebrow")}
            </span>
            <h1 className="font-display text-cream text-5xl md:text-6xl mt-4 mb-5 leading-[0.95] header-with-accent">
              {t("contact.title")}
              <br />
              <span className="text-gold">{t("contact.titleAccent")}</span>
            </h1>
            <p className="text-stone max-w-md mb-8 leading-7">
              {t("contact.description")}
            </p>

            <div className="space-y-0 rounded-[18px] border border-line overflow-hidden">
              <ContactRow label={t("contact.phoneNumbers")}>
                <div className="flex flex-wrap justify-end gap-3">
                  <a href={CALL_HREF} className="text-cream hover:text-gold-bright transition-colors">
                    0788 509 188
                  </a>
                  <span className="text-stone-dim">•</span>
                  <a href={CALL_HREF} className="text-cream hover:text-gold-bright transition-colors">
                    0784 538 466
                  </a>
                </div>
              </ContactRow>
              <ContactRow label={t("contact.whatsapp")}>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-bright hover:underline"
                >
                  {t("contact.messageStudio")}
                </a>
              </ContactRow>
              <ContactRow label={t("contact.location")}>
                <span className="text-cream">{t("contact.locationValue")}</span>
              </ContactRow>
              <ContactRow label={t("contact.studioHours")} last>
                <span className="text-cream">{t("contact.hoursValue")}</span>
              </ContactRow>
            </div>
          </div>

          <div className="border border-line bg-card/95 rounded-[24px] p-8 md:p-10 h-fit shadow-[0_20px_70px_rgba(36,31,25,0.08)]">
            <span className="eyebrow-gradient block mb-3">
              {t("contact.bookShoot")}
            </span>
            <h3 className="font-display text-3xl text-cream mb-3">{t("contact.tellUsYourDate")}</h3>
            <p className="text-sm text-stone mb-8 leading-7">{t("contact.bookOutFast")}</p>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center font-mono text-xs uppercase tracking-[0.28em] border border-gold text-gold py-4 rounded-sm hover:bg-gold hover:text-cream transition-colors mb-3"
            >
              {t("contact.whatsappCta")}
            </a>
            <a
              href={CALL_HREF}
              className="block text-center font-mono text-xs uppercase tracking-[0.28em] border border-stone-dim text-gold py-4 rounded-sm hover:border-gold hover:text-gold-bright transition-colors"
            >
              {t("contact.contactUs")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactRow({ label, children, last = false }) {
  return (
    <div className={`flex items-center justify-between py-4 border-t border-line ${last ? "border-b" : ""}`}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{label}</span>
      <span className="text-sm text-right">{children}</span>
    </div>
  );
}
