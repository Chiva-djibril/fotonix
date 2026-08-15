import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

function isImage(mimetype) {
  return typeof mimetype === "string" && mimetype.startsWith("image/");
}

function getAlbumShareUrl(album) {
  return `${window.location.origin}/albums/public/${album.slug}`;
}

export default function Albums() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [albumsOpen, setAlbumsOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const fileInputRef = useRef(null);

  async function loadAlbums() {
    setLoading(true);
    try {
      const { data } = await api.get("/albums/my");
      setAlbums(data.albums || []);
    } catch (err) {
      toast.error(err.response?.data?.error || t("albums.toastLoadError") || "Couldn't load albums.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAlbum(albumId) {
    setLoading(true);
    try {
      const { data } = await api.get(`/albums/${albumId}`);
      setSelectedAlbum(data.album);
    } catch (err) {
      toast.error(err.response?.data?.error || t("albums.toastLoadError") || "Couldn't load album.");
      navigate("/albums", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  useEffect(() => {
    if (id) {
      loadAlbum(id);
    } else {
      setSelectedAlbum(null);
    }
    setPhotosOpen(false);
  }, [id]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleUploadPhotos() {
    if (!selectedAlbum) return;
    if (newFiles.length === 0) {
      toast.error(t("albums.toastUploadFiles") || "Please select one or more photos to upload.");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      newFiles.forEach((file) => formData.append("photos", file));
      const { data } = await api.post(`/albums/${selectedAlbum.id}/photos`, formData);
      toast.success(t("albums.toastUploaded") || "Photos uploaded.");
      setSelectedAlbum(data.album);
      setNewFiles([]);
      await loadAlbums();
    } catch (err) {
      toast.error(err.response?.data?.error || t("albums.toastUploadError") || "Couldn't upload photos.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePhoto(photoId) {
    if (!selectedAlbum) return;
    if (!window.confirm(t("albums.confirmDeletePhoto") || "Delete this photo?")) return;
    try {
      const { data } = await api.delete(`/albums/${selectedAlbum.id}/photos/${photoId}`);
      setSelectedAlbum((prev) => ({ ...prev, photos: data.photos }));
      await loadAlbums();
      toast.success(t("albums.toastPhotoDeleted") || "Photo deleted.");
    } catch (err) {
      toast.error(err.response?.data?.error || t("albums.toastDeleteError") || "Couldn't delete photo.");
    }
  }

  async function handleDeleteAlbum() {
    if (!selectedAlbum) return;
    if (!window.confirm(t("albums.confirmDeleteAlbum") || "Delete this album and all its photos?")) return;
    setBusy(true);
    try {
      await api.delete(`/albums/${selectedAlbum.id}`);
      toast.success(t("albums.toastAlbumDeleted") || "Album deleted.");
      setSelectedAlbum(null);
      await loadAlbums();
      navigate("/albums");
    } catch (err) {
      toast.error(err.response?.data?.error || t("albums.toastDeleteAlbumError") || "Couldn't delete album.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetCover(photoId) {
    if (!selectedAlbum) return;
    setBusy(true);
    try {
      const { data } = await api.patch(`/albums/${selectedAlbum.id}/cover`, { photoId });
      setSelectedAlbum((prev) => ({ ...prev, cover_url: data.cover_url }));
      toast.success(t("albums.toastCoverSet") || "Cover photo updated.");
      await loadAlbums();
    } catch (err) {
      toast.error(err.response?.data?.error || t("albums.toastCoverError") || "Couldn't update cover photo.");
    } finally {
      setBusy(false);
    }
  }

  function openPhotoPreview(photo) {
    if (isImage(photo.mimetype)) {
      setPreviewPhoto(photo);
    } else {
      window.open(photo.url, "_blank");
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setPreviewPhoto(null);
      }
    }
    if (previewPhoto) {
      document.addEventListener("keydown", onKeyDown);
    }
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [previewPhoto]);

  function albumUrlText() {
    if (!selectedAlbum) return "";
    return getAlbumShareUrl(selectedAlbum);
  }

  return (
    <div className="min-h-screen pt-[74px] bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="eyebrow-gradient">{t("albums.eyebrow")}</span>
            <h1 className="font-display text-5xl text-cream mt-3 header-with-accent">{t("albums.title")}</h1>
            <p className="text-stone mt-3 max-w-2xl">{t("albums.sub")}</p>
          </div>
          <button
            type="button"
            onClick={() => setAlbumsOpen((open) => !open)}
            className="font-mono text-[10px] uppercase tracking-widest border border-line text-cream px-4 py-2 rounded-sm hover:border-gold hover:text-gold-bright transition-colors"
          >
            {albumsOpen ? t("albums.hideAlbums") : t("albums.showAlbums")}
          </button>
        </div>

        <div className="space-y-6">
          <section className="bg-card border border-line rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-2xl text-gold-bright">{t("albums.yourAlbums")}</h2>
                <p className="text-sm text-stone mt-2">{t("albums.yourAlbumsSub")}</p>
              </div>
              <button
                type="button"
                onClick={() => setAlbumsOpen((open) => !open)}
                className="font-mono text-[10px] uppercase tracking-widest border border-line text-cream px-4 py-2 rounded-sm hover:border-gold hover:text-gold-bright transition-colors"
              >
                {albumsOpen ? t("albums.hideAlbums") : t("albums.showAlbums")}
              </button>
            </div>
            {loading ? (
              <p className="text-stone-dim">{t("albums.loading")}</p>
            ) : albums.length === 0 ? (
              <div className="border border-line rounded-sm p-8 text-center text-sm text-stone">
                {t("albums.empty")}
              </div>
            ) : !albumsOpen ? (
              <div className="border border-line rounded-sm p-8 flex items-center justify-between gap-4 text-sm text-stone">
                <span>{albums.length} {t("albums.albumCount")}</span>
                <button
                  type="button"
                  onClick={() => setAlbumsOpen(true)}
                  className="font-mono text-[10px] uppercase tracking-widest border border-line text-cream px-4 py-2 rounded-sm hover:border-gold hover:text-gold-bright transition-colors"
                >
                  {t("albums.showAlbums")}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {albums.map((album) => (
                  <button
                    key={album.id}
                    type="button"
                    onClick={() => navigate(`/albums/${album.id}`)}
                    className={`w-full border border-line rounded-sm p-4 text-left hover:border-gold transition-colors ${String(album.id) === String(id) ? "border-gold bg-bg/60" : "bg-bg"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-sm overflow-hidden bg-stone/10 flex items-center justify-center">
                        {album.cover_url ? (
                          <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm text-stone-dim">{t("albums.noCover")}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-lg text-cream">{album.title}</h3>
                        <p className="text-sm text-stone mt-1">{album.photo_count} {t("albums.photos")}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {selectedAlbum && (
          <section className="bg-card border border-line rounded-sm p-6 mt-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-3xl text-cream">{selectedAlbum.title}</h2>
                <p className="text-sm text-stone mt-2">{selectedAlbum.photos?.length || 0} {t("albums.photosInAlbum")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPhotosOpen((open) => !open)}
                  className="font-mono text-[10px] uppercase tracking-widest border border-line text-cream px-4 py-2 rounded-sm hover:border-gold hover:text-gold-bright transition-colors"
                >
                  {photosOpen ? t("albums.hidePhotos") : t("albums.showPhotos")}
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(albumUrlText()).then(() => toast.success(t("albums.toastCopied") || "Share link copied."))}
                  className="font-mono text-[10px] uppercase tracking-widest border border-line text-cream px-4 py-2 rounded-sm hover:border-gold hover:text-gold-bright transition-colors"
                >
                  {t("albums.copyLink")}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAlbum}
                  className="font-mono text-[10px] uppercase tracking-widest border border-red-600 text-red-400 px-4 py-2 rounded-sm hover:bg-red-600/10 transition-colors"
                  disabled={busy}
                >
                  {t("albums.deleteAlbum")}
                </button>
              </div>
            </div>
 
            {photosOpen ? (
              <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="space-y-4">
                  <div className="rounded-sm overflow-hidden bg-stone/10 h-72">
                    {selectedAlbum.cover_url ? (
                      <img src={selectedAlbum.cover_url} alt={selectedAlbum.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-stone-dim">{t("albums.noCover")}</div>
                    )}
                  </div>
                  <div className="border border-line rounded-sm p-4">
                    <h3 className="font-display text-lg text-cream mb-3">{t("albums.shareTitle")}</h3>
                    <div className="rounded-sm bg-bg border border-line p-3 text-sm break-words text-stone">{albumUrlText()}</div>
                    <div className="mt-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(albumUrlText())}`}
                        alt={t("albums.qrAlt")}
                        className="rounded-sm border border-line"
                      />
                    </div>
                  </div>
                </div>
 
                <div className="space-y-6">
                  <div className="border border-line rounded-sm p-6">
                    <h3 className="font-display text-xl text-gold-bright mb-4">{t("albums.uploadTitle")}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={openFilePicker}
                        className="font-mono text-xs uppercase tracking-widest bg-gold text-bg px-4 py-3 rounded-sm hover:bg-gold-bright transition-colors"
                      >
                        {t("albums.chooseFiles")}
                      </button>
                      <span className="text-sm text-stone">
                        {newFiles.length > 0 ? `${newFiles.length} ${t("albums.filesSelected")}` : t("albums.noFilesSelected")}
                      </span>
                    </div>
                    <input
                      hidden
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="*"
                      onChange={(event) => setNewFiles(Array.from(event.target.files || []))}
                    />
                    <button
                      type="button"
                      onClick={handleUploadPhotos}
                      disabled={busy || newFiles.length === 0}
                      className="mt-4 w-full font-mono text-xs uppercase tracking-widest bg-gold text-bg py-3 rounded-sm hover:bg-gold-bright transition-colors disabled:opacity-50"
                    >
                      {busy ? t("albums.uploading") : t("albums.uploadButton")}
                    </button>
                  </div>
 
                  <div className="border border-line rounded-sm p-6">
                    <h3 className="font-display text-xl text-gold-bright mb-4">{t("albums.photosTitle")}</h3>
                    {selectedAlbum.photos?.length ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {selectedAlbum.photos.map((photo) => (
                          <div
                            key={photo.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openPhotoPreview(photo)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openPhotoPreview(photo);
                              }
                            }}
                            className="border border-line rounded-sm overflow-hidden bg-bg text-left focus:outline-none focus:ring-2 focus:ring-gold"
                          >
                            {isImage(photo.mimetype) ? (
                              <img src={photo.url} alt={photo.filename} className="h-48 w-full object-cover" />
                            ) : (
                              <div className="h-48 flex items-center justify-center bg-stone/10 text-stone-dim">{photo.filename}</div>
                            )}
                            <div className="p-3 space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-cream truncate">{photo.filename}</span>
                                <a
                                  href={photo.url}
                                  download={photo.filename}
                                  onClick={(event) => event.stopPropagation()}
                                  className="text-[10px] uppercase tracking-widest text-gold"
                                >
                                  {t("albums.download")}
                                </a>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeletePhoto(photo.id);
                                  }}
                                  className="text-[10px] uppercase tracking-widest border border-red-600 text-red-400 px-3 py-2 rounded-sm"
                                >
                                  {t("albums.delete")}
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleSetCover(photo.id);
                                  }}
                                  className="text-[10px] uppercase tracking-widest border border-line text-cream px-3 py-2 rounded-sm hover:border-gold hover:text-gold-bright transition-colors"
                                >
                                  {t("albums.setCover")}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-stone">{t("albums.noPhotos")}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-line rounded-sm p-6 text-sm text-stone">{t("albums.photosCollapsed")}</div>
            )}
          </section>
        )}
 
        {previewPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewPhoto(null)}>
            <div
              className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-line bg-[var(--bg)] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="absolute right-4 top-4 z-10 font-mono text-xs uppercase tracking-widest border border-line text-cream px-3 py-2 rounded-sm bg-bg/90 hover:bg-bg"
              >
                {t("ui.close")}
              </button>
              <img
                src={previewPhoto.url}
                alt={previewPhoto.filename}
                className="h-[80vh] w-full object-contain bg-black"
              />
              <div className="border-t border-line bg-card p-4 text-sm text-stone">
                <div className="font-display text-base text-cream mb-2">{previewPhoto.filename}</div>
                <a
                  href={previewPhoto.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] uppercase tracking-widest text-gold"
                >
                  {t("albums.openPhoto")}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
