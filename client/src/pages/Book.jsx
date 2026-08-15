import { useEffect, useState } from "react";
import DatePicker from "../components/DatePicker";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { formatRwf } from "../utils/format";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";
import AlertModal from "../components/AlertModal";

function getDefaultPrice(option) {
  switch (option) {
    case "photo_video":
      return 230000;
    case "album":
      return 150000;
    case "cadre":
      return 80000;
    case "board":
      return 60000;
    case "video":
      return 180000;
    default:
      return 50000;
  }
}

export default function Book() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    selected_services: [],
    photo_count: "50",
    photo_whole_session: false,
    album_required: true,
    album_type: "regular",
    album_photos: "0",
    cadres_count: "1",
    // cadres and boards should have only 1 photo each per user request
    photos_per_cadre: "1",
    boards_count: "1",
    photos_per_board: "1",
    video_kind: "highlight",
    video_hours: "1",
    event_date: "",
    event_time: "",
    location: "",
    extra_request: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [allocationError, setAllocationError] = useState(null);
  const [albumTypes, setAlbumTypes] = useState([]);

  useEffect(() => {
    async function loadAlbumTypes() {
      try {
        const { data } = await api.get("/albums/types");
        setAlbumTypes(data.albumTypes || []);
      } catch {
        setAlbumTypes([]);
      }
    }

    loadAlbumTypes();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const previewAmount = (form.selected_services || []).reduce((sum, s) => sum + getDefaultPrice(s), 0);
  const hasPhotos = form.selected_services?.includes("photo_session") || form.selected_services?.includes("photo_video");
  const hasVideo = form.selected_services?.includes("video") || form.selected_services?.includes("photo_video");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const totalPhotos = Number(form.photo_count || 0);
      // compute allocated photos based on selected services
      let allocated = 0;
      if ((form.selected_services || []).includes("album") && form.album_required) {
        allocated += Number(form.album_photos || 0);
      }
      if ((form.selected_services || []).includes("cadre")) {
        allocated += Number(form.cadres_count || 0) * Number(form.photos_per_cadre || 0);
      }
      if ((form.selected_services || []).includes("board")) {
        allocated += Number(form.boards_count || 0) * Number(form.photos_per_board || 0);
      }

      if (allocated > totalPhotos) {
        // show friendly, actionable UI for non-developers
        setAllocationError({ allocated, total: totalPhotos });
        setBusy(false);
        return;
      }

      const selectedAlbumType = albumTypes.find((type) => String(type.id) === String(form.album_type_id)) || null;
      const payload = {
        ...form,
        photo_count: totalPhotos,
        photo_whole_session: Boolean(form.photo_whole_session),
        cadres_count: Number(form.cadres_count || 0),
        photos_per_cadre: Number(form.photos_per_cadre || 0),
        boards_count: Number(form.boards_count || 0),
        photos_per_board: Number(form.photos_per_board || 0),
        album_required: Boolean(form.album_required),
        album_type: selectedAlbumType?.name || form.album_type || null,
        album_type_id: selectedAlbumType?.id || null,
        album_type_name: selectedAlbumType?.name || form.album_type || null,
        selected_services: form.selected_services || [],
        video_hours: Number(form.video_hours || 0),
      };
      await api.post("/bookings", payload);
      toast.success(t("book.toastCreated"));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || t("book.toastCreateFail"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pt-[74px] bg-bg">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <span className="eyebrow-gradient">{t("book.eyebrow")}</span>
        <h1 className="font-display text-cream text-5xl mt-3 mb-2 header-with-accent">{t("book.title")}</h1>
        <p className="text-stone mb-10">{t("book.sub")}</p>

        <AlertModal
          open={!!allocationError}
          title={t('book.allocationAlertTitle') || 'Photo allocation mismatch'}
          body={allocationError ? (t('book.allocationAlertBody', { allocated: allocationError.allocated, total: allocationError.total }) || `You assigned ${allocationError.allocated} photos but only selected ${allocationError.total} total photos.`) : ''}
          onClose={() => setAllocationError(null)}
          actions={allocationError ? [
            {
              label: t('book.actionIncreaseTotal') || 'Increase total photos',
              onClick: () => {
                setForm((f) => ({ ...f, photo_count: String(allocationError.allocated) }));
                setAllocationError(null);
              },
              primary: true,
            },
            {
              label: t('book.actionAutoAdjust') || 'Auto-adjust allocations',
              onClick: () => {
                setForm((f) => {
                  let diff = allocationError.allocated - allocationError.total;
                  const next = { ...f };
                  if (next.selected_services?.includes('album') && next.album_required) {
                    const albumPhotos = Number(next.album_photos || 0);
                    const reduce = Math.min(albumPhotos, diff);
                    next.album_photos = String(Math.max(0, albumPhotos - reduce));
                    diff -= reduce;
                  }
                  if (diff > 0 && next.selected_services?.includes('cadre')) {
                    const cadres = Number(next.cadres_count || 1);
                    const reduceCadres = Math.min(Math.max(0, cadres - 1), diff);
                    next.cadres_count = String(Math.max(1, cadres - reduceCadres));
                    diff -= reduceCadres;
                  }
                  if (diff > 0) {
                    next.photo_count = String(allocationError.allocated);
                  }
                  return next;
                });
                setAllocationError(null);
              },
            },
          ] : []}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                ["photo_session", t("book.optionPhotoSession")],
                ["photo_video", t("book.optionPhotoVideo")],
                ["album", t("book.optionAlbum")],
                ["cadre", t("book.optionCadre")],
                ["board", t("book.optionBoard")],
                ["video", t("book.optionVideo")],
              ].map(([val, label]) => {
                const checked = (form.selected_services || []).includes(val);
                return (
                  <button
                    key={val}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => {
                      const cur = new Set(form.selected_services || []);
                      if (val === "photo_video") {
                        if (cur.has(val)) cur.delete(val); else {
                          cur.delete("photo_session");
                          cur.delete("video");
                          cur.add(val);
                        }
                      } else {
                        cur.delete("photo_video");
                        if (cur.has(val)) cur.delete(val); else cur.add(val);
                      }
                      setForm({ ...form, selected_services: Array.from(cur) });
                    }}
                    className={`w-full text-left p-3 rounded-sm flex items-center gap-3 transition-all ${checked ? 'bg-gold text-bg border border-gold' : 'bg-card text-cream border border-line hover:brightness-105'}`}
                  >
                    <span className={`w-5 h-5 rounded-sm inline-flex items-center justify-center ${checked ? 'bg-bg text-gold' : 'bg-bg/30'}`}>
                      {checked ? '✓' : ''}
                    </span>
                    <span className="font-display text-sm">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.numberOfPhotosLabel")}</span>
            <input
              type="number"
              min="1"
              value={form.photo_count}
              onChange={(e) => setForm({ ...form, photo_count: e.target.value })}
              className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream"
            />
            <p className="text-sm text-stone-dim mt-2">{t("book.photoCountHelp")}</p>
          </label>

          {hasPhotos && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.photo_whole_session} onChange={(e) => setForm({ ...form, photo_whole_session: e.target.checked })} />
                <span className="text-cream">{t('book.photoWholeSession')}</span>
              </label>
            </div>
          )}

          {(form.selected_services || []).includes("album") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.album_required}
                  onChange={(e) => setForm({ ...form, album_required: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-cream">{t("book.albumLabel")}</span>
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.albumTypeLabel")}</span>
                <div className="space-y-2">
                  {albumTypes.length === 0 ? (
                    <p className="text-sm text-stone-dim">{t("book.albumTypeEmpty") || "No album types are available yet."}</p>
                  ) : albumTypes.map((albumType) => (
                    <label key={albumType.id} className="flex items-center gap-2 text-cream">
                      <input
                        type="radio"
                        name="album_type"
                        value={albumType.id}
                        checked={String(form.album_type_id || form.album_type || "") === String(albumType.id)}
                        onChange={() => setForm({ ...form, album_type: albumType.name, album_type_id: albumType.id, album_type_name: albumType.name })}
                      />
                      <span>{albumType.name}</span>
                      {albumType.price_rwf ? <span className="text-sm text-stone-dim">• {formatRwf(albumType.price_rwf)}</span> : null}
                    </label>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.albumPhotosLabel")}</span>
                <input
                  type="number"
                  min="0"
                  value={form.album_photos}
                  onChange={(e) => setForm({ ...form, album_photos: e.target.value })}
                  className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream"
                />
                <p className="text-sm text-stone-dim mt-2">{t("book.albumPhotosHelp")}</p>
              </label>
            </div>
          )}

          {(form.selected_services || []).includes("cadre") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.cadresLabel")}</span>
                <input
                  type="number"
                  min="1"
                  value={form.cadres_count}
                  onChange={(e) => setForm({ ...form, cadres_count: e.target.value })}
                  className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.photosPerCadreLabel")}</span>
                {/* fixed to 1 photo per cadre and not editable */}
                <input
                  type="number"
                  min="1"
                  value={"1"}
                  disabled
                  className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream opacity-70"
                />
              </label>
            </div>
          )}

          {(form.selected_services || []).includes("board") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.boardsLabel")}</span>
                <input
                  type="number"
                  min="1"
                  value={form.boards_count}
                  onChange={(e) => setForm({ ...form, boards_count: e.target.value })}
                  className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.photosPerBoardLabel")}</span>
                {/* fixed to 1 photo per board and not editable */}
                <input
                  type="number"
                  min="1"
                  value={"1"}
                  disabled
                  className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream opacity-70"
                />
              </label>
            </div>
          )}

          {hasVideo && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t('book.videoKindLabel')}</span>
                <select className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream" value={form.video_kind} onChange={(e) => setForm({ ...form, video_kind: e.target.value })}>
                  <option value="highlight">{t('book.videoKindHighlight')}</option>
                  <option value="full">{t('book.videoKindFull')}</option>
                  <option value="full_highlights">{t('book.videoKindFullHighlights')}</option>
                </select>
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t('book.videoHoursLabel')}</span>
                <input type="number" min="0" value={form.video_hours} onChange={(e) => setForm({ ...form, video_hours: e.target.value })} className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream" />
              </label>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card border border-line rounded-sm p-4">
              <div>
                <DatePicker
                  value={form.event_date}
                  min={today}
                  onChange={(val) => setForm({ ...form, event_date: val })}
                />

                <div className="mt-3">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.time")}</span>
                    <input
                      type="time"
                      required
                      value={form.event_time}
                      onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                      className="w-full bg-bg border border-line rounded-sm px-4 py-3 text-cream"
                    />
                  </label>
                </div>

                <div className="mt-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2">{t('book.quickTimes')}</div>
                  <div className="flex gap-2">
                    <button type="button" className="px-3 py-2 bg-gold text-bg rounded-sm" onClick={() => setForm({ ...form, event_time: '09:00' })}>09:00</button>
                    <button type="button" className="px-3 py-2 bg-gold text-bg rounded-sm" onClick={() => setForm({ ...form, event_time: '13:00' })}>13:00</button>
                    <button type="button" className="px-3 py-2 bg-gold text-bg rounded-sm" onClick={() => setForm({ ...form, event_time: '17:00' })}>17:00</button>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-card border border-line rounded-sm p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2">{t('book.timezoneLabel') || 'Timezone'}</div>
              <div className="text-sm text-stone mb-3">{t('book.timezoneHelp') || 'Select the timezone for the booking time.'}</div>
              <select className="w-full bg-bg border border-line rounded-sm px-4 py-3 text-cream" value={form.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</option>
                <option value="UTC">UTC</option>
                <option value="Africa/Kigali">Africa/Kigali</option>
              </select>
            </div>
          </div>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.location")}</span>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder={t("book.locationPlaceholder")}
              className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.notes")}</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t("book.notesPlaceholder")}
              className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream resize-none"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-2 block">{t("book.extraRequestLabel")}</span>
            <textarea
              rows={2}
              value={form.extra_request}
              onChange={(e) => setForm({ ...form, extra_request: e.target.value })}
              placeholder={t("book.extraRequestPlaceholder")}
              className="w-full bg-card border border-line rounded-sm px-4 py-3 text-cream resize-none"
            />
          </label>

          <div className="border border-line bg-card rounded-sm p-5 flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-stone-dim">{t("book.totalDue")}</p>
              <p className="font-display text-2xl text-gold-bright">{formatRwf(previewAmount)}</p>
            </div>
            <p className="text-sm text-stone">{t("book.previewSummary")}</p>
          </div>

          <button
            disabled={busy}
            className="w-full font-mono text-xs uppercase tracking-widest bg-gold text-bg py-4 rounded-sm hover:bg-gold-bright transition-colors disabled:opacity-50"
          >
            {busy ? t("book.creating") : t("book.continue")}
          </button>
        </form>
      </div>
    </div>
  );
}
