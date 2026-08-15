import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

function isImage(mimetype) {
  return typeof mimetype === "string" && mimetype.startsWith("image/");
}

export default function PublicAlbum() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get(`/albums/public/${slug}`);
        setAlbum(data.album);
      } catch (err) {
        toast.error(err.response?.data?.error || t("publicAlbum.toastLoadError") || "Could not load this album.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, t]);

  if (loading) {
    return (  
      <div className="min-h-screen pt-[74px] bg-bg flex items-center justify-center">
        <p className="font-mono text-xs text-stone-dim uppercase tracking-widest">{t("publicAlbum.loading") || "Loading album…"}</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen pt-[74px] bg-bg flex items-center justify-center px-6">
        <div className="max-w-2xl text-center bg-card border border-line rounded-sm p-10">
          <p className="text-cream text-xl mb-4">{t("publicAlbum.notFound") || "Album not found."}</p>
          <Link to="/" className="text-gold hover:underline">{t("publicAlbum.goHome") || "Return to Fotonix home"}</Link>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/albums/public/${album.slug}`;

  return (
    <div className="min-h-screen pt-[74px] bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <div className="space-y-3">
          <span className="eyebrow-gradient">{t("publicAlbum.eyebrow")}</span>
          <h1 className="font-display text-5xl text-cream header-with-accent">{album.title}</h1>
          <p className="text-stone max-w-2xl">{t("publicAlbum.sub")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="border border-line rounded-sm overflow-hidden bg-stone/10">
              {album.cover_url ? (
                <img src={album.cover_url} alt={album.title} className="w-full object-cover" />
              ) : (
                <div className="h-80 flex items-center justify-center text-stone-dim">{t("publicAlbum.noCover")}</div>
              )}
            </div>

            {album.photos?.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {album.photos.map((photo) => (
                  <div key={photo.id} className="border border-line rounded-sm overflow-hidden bg-bg">
                    {isImage(photo.mimetype) ? (
                      <img src={photo.url} alt={photo.filename} className="h-64 w-full object-cover" />
                    ) : (
                      <div className="h-64 flex items-center justify-center bg-stone/10 text-stone-dim">{photo.filename}</div>
                    )}
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="text-sm text-stone truncate">{photo.filename}</div>
                      <a href={photo.url} download={photo.filename} className="text-gold text-[10px] uppercase tracking-widest">
                        {t("publicAlbum.download")}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-line rounded-sm p-8 text-center text-stone">
                {t("publicAlbum.empty")}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="border border-line rounded-sm p-6 bg-card">
              <h2 className="font-display text-2xl text-gold-bright mb-4">{t("publicAlbum.shareTitle")}</h2>
              <p className="text-sm text-stone mb-4">{t("publicAlbum.shareDescription")}</p>
              <div className="bg-bg border border-line rounded-sm p-3 text-sm text-stone break-words">{shareUrl}</div>
              <div className="mt-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`}
                  alt="Album QR code"
                  className="w-full rounded-sm border border-line"
                />
              </div>
            </div>

            <div className="border border-line rounded-sm p-6 bg-card">
              <h3 className="font-display text-xl text-cream mb-3">{t("publicAlbum.albumDetails")}</h3>
              <div className="space-y-2 text-sm text-stone">
                <div>{album.photos.length} {t("publicAlbum.photos") || "photos"}</div>
                <div>{t("publicAlbum.created") || `Created on ${new Date(album.created_at).toLocaleDateString()}`}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
