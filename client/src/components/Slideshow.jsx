import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function Slideshow({ images = [], interval = 5000, variant = 'normal', className = '' }) {
  const { t } = useLanguage();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % images.length), interval);
    return () => clearInterval(id);
  }, [images, interval, variant]);

  if (!images || images.length === 0) {
    return <div className="p-6 bg-card border border-line rounded-sm text-stone text-body-lg text-center">{t("slideshow.noImages")}</div>;
  }

  return (
    <div className={`slideshow-frame relative mx-auto bg-card border border-line rounded-md overflow-hidden group ${variant === 'videoLarge' ? 'slideshow-frame-large' : ''} ${variant === 'mobile' ? 'slideshow-frame-mobile' : ''} ${className}`}>
      <img key={idx} src={images[idx]} alt={`slide-${idx}`} className="slideshow-image w-full h-full rounded-md object-cover object-center" />

      {/* Left chevron - visible on small screens, hover on larger screens */}
      <button
        onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-[rgba(0,0,0,0.35)] hover:bg-[rgba(0,0,0,0.55)] dark:bg-[rgba(0,0,0,0.5)] dark:hover:bg-[rgba(0,0,0,0.7)] text-cream p-3 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 font-display text-2xl font-bold slideshow-btn btn-click"
        aria-label={t("slideshow.previousSlide")}
        title="Previous slide"
      >
        ‹
      </button>

      {/* Right chevron */}
      <button
        onClick={() => setIdx((i) => (i + 1) % images.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-[rgba(0,0,0,0.35)] hover:bg-[rgba(0,0,0,0.55)] dark:bg-[rgba(0,0,0,0.5)] dark:hover:bg-[rgba(0,0,0,0.7)] text-cream p-3 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 font-display text-2xl font-bold slideshow-btn btn-click"
        aria-label={t("slideshow.nextSlide")}
        title="Next slide"
      >
        ›
      </button>
    </div>
  );
}
