import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import ApertureSpinner from "../components/ApertureSpinner";
import BackgroundImage from "../components/BackgroundImage";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-[74px] overflow-hidden bg-bg">
        {/* background image (stock Unsplash) */}
        <BackgroundImage
          image={"https://images.unsplash.com/photo-1501471984908-815b996862f4?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
          radial
        />

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1.15fr_0.85fr] gap-14 items-center relative z-10">
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-px bg-gold-bright shrink-0" />
              <span className="eyebrow-gradient">
                {t("hero.eyebrow")}
              </span>
            </div>
            <h1 className="font-display text-white text-[48px] sm:text-[64px] md:text-[78px] xl:text-[96px] leading-[0.9] tracking-[-0.04em] text-shadow-soft">
              <span className="block opacity-0 animate-fade-in-up-slow" style={{ animationDelay: '0.15s' }}>{t("hero.line1")}</span>
              <span className="block text-gold opacity-0 animate-fade-in-up-slow" style={{ animationDelay: '0.3s' }}>{t("hero.line2")}</span>
              <span className="block opacity-0 animate-fade-in-up-slow" style={{ animationDelay: '0.45s' }}>{t("hero.line3")}</span>
            </h1>
            <p className="font-body italic font-light text-white text-lg max-w-xl mt-4 leading-relaxed opacity-0 animate-fade-in-up-slow" style={{ animationDelay: '0.55s' }}>
              {t("hero.sub")}
            </p>

            <div className="flex flex-wrap gap-4 opacity-0 animate-fade-in-up-slow" style={{ animationDelay: '0.75s' }}>
              <Link
                to="/book"
                className="font-mono text-xs uppercase tracking-[0.35em] border border-gold text-gold px-8 py-4 rounded-full hover:bg-gold hover:text-cream transition-smooth"
              >
                {t("hero.cta1")}
              </Link>
              <Link
                to="/services"
                className="font-mono text-xs uppercase tracking-[0.35em] border border-gold text-gold px-8 py-4 rounded-full hover:border-gold-bright hover:text-gold-bright transition-smooth"
              >
                {t("hero.cta2")}
              </Link>
            </div>
          </div>

          {/* Real photo, right side of the "Let Your Story Shine" copy */}
          <HeroPhoto />
        </div>
      </section>

      <div className="sprockets" />

      {/* ABOUT */}
      <section className="bg-bg-alt border-b border-line py-24 overflow-hidden">
        <BackgroundImage image={"https://unsplash.com/photos/black-dslr-camera-floating-over-mans-hand-at-the-woods-WxM465oM4j4"} />
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-6 animate-fade-in-up">
            <span className="eyebrow-gradient">{t("about.eyebrow")}</span>
            <h2 className="font-display text-white text-4xl md:text-5xl mt-4 mb-5 tracking-[-0.03em] header-with-accent">
              {t("about.title1")}<br />{t("about.title2")}
            </h2>
            <p className="text-white/90 max-w-xl text-lg leading-relaxed">{t("about.p1")}</p>
            <p className="text-white/80 max-w-xl text-lg leading-relaxed">{t("about.p2")}</p>
            <Link
              to="/services"
              className="font-mono text-xs uppercase tracking-[0.35em] border border-gold text-white px-7 py-4 rounded-full hover:border-gold hover:text-gold-bright transition-smooth inline-block"
            >
              {t("about.cta")}
            </Link>
          </div>
          <div className="aspect-[4/5] border border-line rounded-3xl relative overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.24)] animate-float">
            <img
              src="/photos/artistic-portrait.jpg"
              alt="Behind the lens at Fotonix Studio"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-70)] via-transparent to-transparent" />
            <div className="absolute inset-3.5 border border-[var(--cream-10)] pointer-events-none rounded-3xl" />
          </div>
        </div>
      </section>

      {/* CRAFT SHOWCASE — spinning aperture, pure SVG/CSS, no heavy runtime */}
      <section className="py-24 relative overflow-hidden">
        <BackgroundImage image={"https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1600&q=80"} />
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center relative z-10">
          <div className="h-[360px] md:h-[440px] order-2 md:order-1 rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.25)] animate-float">
            <ApertureSpinner className="w-full h-full" />
          </div>
          <div className="order-1 md:order-2 space-y-5 animate-fade-in-up">
            <span className="eyebrow-gradient">{t("craft.eyebrow")}</span>
            <h2 className="font-display text-white text-4xl md:text-5xl mt-4 mb-5 tracking-[-0.03em] header-with-accent">{t("craft.title")}</h2>
            <p className="text-white/85 max-w-lg text-lg leading-relaxed">{t("craft.sub")}</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-bg-alt border-t border-line">
        <BackgroundImage image={"https://images.unsplash.com/photo-1501471984908-815b996862f4?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"} />
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <span className="eyebrow-gradient">{t("process.eyebrow")}</span>
            <h2 className="font-display text-white text-4xl md:text-5xl mt-4 header-with-accent">{t("process.title")}</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-10 relative">
            <div className="hidden md:block absolute top-[17px] left-0 right-0 h-px bg-line" />
            {t("process.steps").map(([title, body], i) => (
              <div key={i} className="relative z-10">
                <div className="w-[34px] h-[34px] rounded-full border border-gold flex items-center justify-center font-mono text-xs text-gold bg-bg-alt mb-5">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h4 className="font-display text-2xl text-white tracking-wide mb-2">{title}</h4>
                <p className="text-sm text-white ">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroPhoto() {
  return (
    <div className="hero-photo relative w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[640px] mx-auto md:ml-auto group">
      <div className="aspect-[4/5] rounded-sm overflow-hidden border border-line relative transition-transform duration-500 group-hover:-translate-y-1">
        <img
          src="/photos/wedding-couple.jpg"
          alt="A couple photographed by Fotonix Studio"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-60)] via-transparent to-transparent" />
        <div className="absolute inset-3 border border-[var(--cream-15)] pointer-events-none rounded-m" />
        {/* <span className="absolute top-5 left-5 font-mono text-[10px] text-[var(--cream-70)] tracking-widest">FOTONIX / WEDDINGS</span> */}
      </div>
    </div>
  );
}

