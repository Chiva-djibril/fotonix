import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { formatRwf } from "../utils/format";
import { useLanguage } from "../context/LanguageContext";
import Slideshow from "../components/Slideshow";

function formatServicePrice(service) {
  if (service.price_min_rwf != null || service.price_max_rwf != null) {
    const min = service.price_min_rwf ?? service.price_rwf;
    const max = service.price_max_rwf ?? service.price_rwf;
    return min === max ? formatRwf(min) : `${formatRwf(min)} - ${formatRwf(max)}`;
  }

  return formatRwf(service.price_rwf);
}

export default function Services() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/services")
      .then(({ data }) => setServices(data.services))
      .catch(() => setError(t("services.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const grouped = services.reduce((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  // Studio showcase slideshow — one moment from each event type we shoot.
  const studioImages = [
    "https://images.pexels.com/photos/1587042/pexels-photo-1587042.jpeg?auto=compress&cs=tinysrgb&w=1600", // wedding couple
    "https://images.pexels.com/photos/6666644/pexels-photo-6666644.jpeg?auto=compress&cs=tinysrgb&w=1600", // birthday party
    "https://images.pexels.com/photos/30110285/pexels-photo-30110285.jpeg?auto=compress&cs=tinysrgb&w=1600", // bridal shower
    "https://images.pexels.com/photos/29964272/pexels-photo-29964272.jpeg?auto=compress&cs=tinysrgb&w=1600", // baby shower
  ];

  return (
    <div className="pt-[74px]">
      <section className="max-w-6xl mx-auto px-6 py-20">
        <span className="eyebrow-gradient">{t("services.eyebrow")}</span>
        <h1 className="font-display text-cream text-5xl md:text-6xl mt-4 mb-4 header-with-accent">{t("services.title")}</h1>
        <p className="text-stone max-w-xl">{t("services.sub")}</p>
      </section>

      {loading && <p className="text-center font-mono text-xs text-stone-dim uppercase tracking-widest pb-20">{t("services.loading")}</p>}
      {error && <p className="text-center text-maroon pb-20">{error}</p>}

      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-[28px] border border-gold/40 bg-black/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-black/35 backdrop-blur-md" />
            <div className="h-full w-full scale-105 blur-[2px] brightness-[0.7] contrast-125">
              <Slideshow
                images={studioImages}
                variant="videoLarge"
                className="!mx-0 !rounded-none !border-0 !bg-transparent h-full min-h-[420px] w-full"
              />
            </div>
          </div>

          <div className="relative z-10 p-3 md:p-5">
            <div className="space-y-4 md:space-y-5">
              {Object.entries(grouped).map(([category, items]) => (
                <AccordionCategory key={category} category={category} items={items} t={t} navigate={navigate} formatServicePrice={formatServicePrice} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccordionCategory({ category, items, t, navigate, formatServicePrice }) {
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const label = t("services.eventLabels")?.[category] || category;

  return (
    <div className="rounded-[18px] border border-gold/40 bg-black backdrop-blur-sm shadow-[0_18px_40px_rgba(0,0,0,0.3)] overflow-hidden">
      <button className="w-full text-left flex items-center justify-between p-4 md:p-5 bg-black border-b border-gold/30" onClick={() => setOpen((v) => !v)}>
        <div>
          <div className="font-display text-xl md:text-2xl text-gold">{label}</div>
          <div className="text-sm text-white">{t("services.chooseOption")}</div>
        </div>
        <div className="text-sm text-white">{open ? t('services.collapse') : t('services.view')}</div>
      </button>

      {open && (
        <div className="p-3 md:p-4">
          <ul className="space-y-2">
            {items.map((s) => (
              <li key={s.id}>
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedService(s)}
                    className={`w-full text-left p-3 rounded-sm border transition-colors ${selectedService?.id === s.id ? 'bg-black text-gold border-gold' : 'bg-black/70 text-white border-gold/20 hover:border-gold hover:text-gold'}`}
                  >
                    <div className="font-display text-sm md:text-base text-gold">{s.name}</div>
                    <div className="text-xs text-white/80">{formatServicePrice(s)}</div>
                  </button>
                  <button
                    onClick={() => navigate(`/book?service=${s.id}`)}
                    className="ml-2 px-3 py-2 bg-gold text-bg rounded-sm text-xs whitespace-nowrap"
                  >
                    {t('services.bookBtn')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
