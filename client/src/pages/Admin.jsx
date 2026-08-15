import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";
import { formatRwf } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const emptyServiceForm = {
  category: "Weddings",
  subcategory: "Photography",
  name: "",
  description: "",
  price_rwf: "",
  price_min_rwf: "",
  price_max_rwf: "",
  duration_label: "",
  price_note: "",
};

function formatServicePrice(service) {
  if (service.price_min_rwf != null || service.price_max_rwf != null) {
    const min = service.price_min_rwf ?? service.price_rwf;
    const max = service.price_max_rwf ?? service.price_rwf;
    return min === max ? formatRwf(min) : `${formatRwf(min)} - ${formatRwf(max)}`;
  }

  return formatRwf(service.price_rwf);
}

function FeedbackItem({ entry, onReplied }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`Re: ${entry.type}`);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!subject || !message) {
      toast.error(t("notifications.composeRequire"));
      return;
    }
    setSending(true);
    try {
      await api.post(`/admin/feedback/${entry.id}/reply`, { subject, message });
      toast.success(t("admin.replySentToast") || "Reply sent");
      setOpen(false);
      if (onReplied) onReplied();
    } catch (err) {
      toast.error(err.response?.data?.error || t("admin.replyFail") || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border border-line p-4 rounded-sm bg-bg/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-lg text-cream">{entry.name || entry.email || (t("admin.feedbackFallback") || "No sender")}</p>
          <p className="text-sm text-stone mt-1">{entry.message}</p>
          <p className="text-sm text-stone-dim mt-2">{entry.type} • {entry.email}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full ${entry.status === 'responded' ? 'bg-gold text-bg' : 'border border-line text-stone'}`}>
            {entry.status}
          </span>
          {entry.user_id ? (
            <button onClick={() => setOpen((v) => !v)} className="font-mono text-[10px] uppercase tracking-widest border border-gold text-gold px-3 py-2 rounded-sm hover:bg-gold hover:text-bg transition-colors">
              {open ? t('admin.closeButton') || 'Close' : t('admin.replyButton') || 'Reply'}
            </button>
          ) : (
            <div className="text-xs text-stone-dim">{t('admin.cannotReplyAnonymous')}</div>
          )}
        </div>
      </div>

      {open && entry.user_id && (
        <div className="mt-4 space-y-2">
          <input placeholder={t('notifications.composePlaceholderSubject') || 'Subject'} value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-bg border border-line rounded-sm px-3 py-2 text-cream" />
          <textarea placeholder={t('notifications.composePlaceholderMessage') || 'Message'} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-bg border border-line rounded-sm px-3 py-2 text-cream resize-none" />
          <div className="flex items-center gap-2">
            <button onClick={handleSend} disabled={sending} className="font-mono text-[10px] uppercase tracking-widest bg-gold text-bg px-3 py-2 rounded-sm hover:bg-gold-bright transition-colors disabled:opacity-50">{t('notifications.sendButton') || 'Send'}</button>
            <button onClick={() => setOpen(false)} className="font-mono text-[10px] uppercase tracking-widest border border-stone-dim text-cream px-3 py-2 rounded-sm">{t('admin.cancelButton') || 'Cancel'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageItem({ entry, onReplied }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`Re: ${entry.title}`);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!subject || !message) {
      toast.error(t("notifications.composeRequire") || "Subject and message are required.");
      return;
    }
    setSending(true);
    try {
      await api.post(`/admin/messages/${entry.id}/reply`, { subject, message });
      toast.success(t("admin.replySentToast") || "Reply sent");
      setOpen(false);
      if (onReplied) onReplied();
    } catch (err) {
      toast.error(err.response?.data?.error || t("admin.replyFail") || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border border-line p-4 rounded-sm bg-bg/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-lg text-cream">{entry.sender_name || entry.sender_email || (t("admin.feedbackFallback") || "No sender")}</p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-gold mt-1">{entry.title}</p>
          <p className="text-sm text-stone mt-1">{entry.message}</p>
          <p className="text-sm text-stone-dim mt-2">{entry.sender_email}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full ${entry.status === 'replied' ? 'bg-gold text-bg' : 'border border-line text-stone'}`}>
            {entry.status}
          </span>
          <button onClick={() => setOpen((v) => !v)} className="font-mono text-[10px] uppercase tracking-widest border border-gold text-gold px-3 py-2 rounded-sm hover:bg-gold hover:text-bg transition-colors">
            {open ? t('admin.closeButton') || 'Close' : t('admin.replyButton') || 'Reply'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-2">
          <input placeholder={t('notifications.composePlaceholderSubject') || 'Subject'} value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-bg border border-line rounded-sm px-3 py-2 text-cream" />
          <textarea placeholder={t('notifications.composePlaceholderMessage') || 'Message'} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-bg border border-line rounded-sm px-3 py-2 text-cream resize-none" />
          <div className="flex items-center gap-2">
            <button onClick={handleSend} disabled={sending} className="font-mono text-[10px] uppercase tracking-widest bg-gold text-bg px-3 py-2 rounded-sm hover:bg-gold-bright transition-colors disabled:opacity-50">{t('notifications.sendButton') || 'Send'}</button>
            <button onClick={() => setOpen(false)} className="font-mono text-[10px] uppercase tracking-widest border border-stone-dim text-cream px-3 py-2 rounded-sm">{t('admin.cancelButton') || 'Cancel'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [services, setServices] = useState([]);
  const [albumTypes, setAlbumTypes] = useState([]);
  const [albumTypeForm, setAlbumTypeForm] = useState({ name: "", description: "", price_rwf: "", is_active: true });
  const [albumForm, setAlbumForm] = useState({ title: "", user_id: "", album_type_id: "" });
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [messages, setMessages] = useState([]);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesRes, albumTypesRes, usersRes, bookingsRes, feedbackRes, messagesRes] = await Promise.all([
        api.get("/admin/services"),
        api.get("/admin/album-types"),
        api.get("/admin/users"),
        api.get("/admin/bookings"),
        api.get("/admin/feedback"),
        api.get("/admin/messages"),
      ]);
      setServices(servicesRes.data.services || []);
      setAlbumTypes(albumTypesRes.data.albumTypes || []);
      setUsers(usersRes.data.users || []);
      setBookings(bookingsRes.data.bookings || []);
      setFeedback(feedbackRes.data.feedback || []);
      setMessages(messagesRes.data.messages || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const serviceGroups = useMemo(() => {
    return services.reduce((acc, service) => {
      (acc[service.category] ||= []).push(service);
      return acc;
    }, {});
  }, [services]);

  const eventLabels = t("services.eventLabels");
  const subcategoryLabels = t("services.categories");
  const adminSubtitle = t("admin.subtitle").replace("{name}", user?.name || "");

  async function handleCreateService(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...serviceForm,
        price_rwf: Number(serviceForm.price_rwf),
        price_min_rwf: serviceForm.price_min_rwf ? Number(serviceForm.price_min_rwf) : null,
        price_max_rwf: serviceForm.price_max_rwf ? Number(serviceForm.price_max_rwf) : null,
      };
      await api.post("/admin/services", payload);
      setServiceForm(emptyServiceForm);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAlbumType(e) {
    e.preventDefault();
    try {
      await api.post("/admin/album-types", {
        name: albumTypeForm.name.trim(),
        description: albumTypeForm.description.trim(),
        price_rwf: albumTypeForm.price_rwf ? Number(albumTypeForm.price_rwf) : null,
        is_active: albumTypeForm.is_active,
      });
      setAlbumTypeForm({ name: "", description: "", price_rwf: "", is_active: true });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || t("admin.toastAlbumTypeError") || "Couldn't save album type.");
    }
  }

  async function handleCreateAlbum(e) {
    e.preventDefault();
    try {
      await api.post("/admin/albums", albumForm);
      toast.success(t("admin.albumCreatedToast") || "Album created for customer.");
      setAlbumForm({ title: "", user_id: "", album_type_id: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || t("admin.albumCreateError") || "Couldn't create album.");
    }
  }

  async function handleUpdateAlbumType(albumType) {
    try {
      await api.patch(`/admin/album-types/${albumType.id}`, {
        name: albumType.name,
        description: albumType.description,
        price_rwf: albumType.price_rwf == null || albumType.price_rwf === "" ? null : Number(albumType.price_rwf),
        is_active: albumType.is_active,
      });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || t("admin.toastAlbumTypeError") || "Couldn't update album type.");
    }
  }

  async function handleUpdatePrice(service) {
    const key = service.id;
    setUpdatingPrices((current) => ({ ...current, [key]: true }));
    try {
      await api.patch(`/admin/services/${service.id}`, {
        price_rwf: Number(service.price_rwf),
        price_min_rwf: service.price_min_rwf == null || service.price_min_rwf === "" ? null : Number(service.price_min_rwf),
        price_max_rwf: service.price_max_rwf == null || service.price_max_rwf === "" ? null : Number(service.price_max_rwf),
      });
      await loadData();
    } finally {
      setUpdatingPrices((current) => ({ ...current, [key]: false }));
    }
  }

  async function handleToggleUserRole(userId, role) {
    await api.patch(`/admin/users/${userId}`, { role: role === "admin" ? "user" : "admin" });
    await loadData();
  }

  async function handleToggleUserStatus(entry) {
    const nextStatus = entry.status === "suspended" ? "active" : "suspended";
    await api.patch(`/admin/users/${entry.id}`, { status: nextStatus, suspended_reason: nextStatus === "suspended" ? t("admin.defaultSuspendReason") : null });
    await loadData();
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm(t("admin.confirmDeleteUser"))) return;
    await api.delete(`/admin/users/${userId}`);
    await loadData();
  }

  return (
    <div className="min-h-screen pt-[74px] bg-bg text-cream">
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-10">
        <div className="space-y-3">
          <p className="eyebrow-gradient">{t("admin.eyebrow")}</p>
          <h1 className="font-display text-4xl md:text-5xl text-cream header-with-accent">{t("admin.title")}</h1>
          <p className="text-stone max-w-3xl">{adminSubtitle}</p>
        </div>

        {loading ? (
          <p className="font-mono text-xs uppercase tracking-widest text-stone-dim">{t("admin.loading")}</p>
        ) : (
          <div className="space-y-10">
            <section className="border border-line bg-card p-6 rounded-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl text-gold-bright">{t("admin.createTitle")}</h2>
                  <p className="text-sm text-stone">{t("admin.createSubtitle")}</p>
                </div>
              </div>
              <form onSubmit={handleCreateService} className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.eventLabel")}</span>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                  >
                    {['Weddings', 'Birthdays', 'Baby Show', 'Welcome Backs', 'Bride show', 'Studio Session'].map((value) => (
                      <option key={value} value={value}>{eventLabels?.[value] || value}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.categoryLabel")}</span>
                  <select
                    value={serviceForm.subcategory}
                    onChange={(e) => setServiceForm({ ...serviceForm, subcategory: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                  >
                    <option value="Photography">{subcategoryLabels?.Photography || "Photography"}</option>
                    <option value="Videography">{subcategoryLabels?.Videography || "Videography"}</option>
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.serviceNameLabel")}</span>
                  <input
                    required
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                    placeholder={t("admin.serviceNamePlaceholder")}
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.descriptionLabel")}</span>
                  <textarea
                    rows={3}
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream resize-none"
                    placeholder={t("admin.descriptionPlaceholder")}
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.priceLabel")}</span>
                  <input
                    required
                    type="number"
                    min="0"
                    value={serviceForm.price_rwf}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_rwf: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.durationLabel")}</span>
                  <input
                    value={serviceForm.duration_label}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_label: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                    placeholder="1:30 min highlight"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.minPriceLabel")}</span>
                  <input
                    type="number"
                    min="0"
                    value={serviceForm.price_min_rwf}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_min_rwf: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.maxPriceLabel")}</span>
                  <input
                    type="number"
                    min="0"
                    value={serviceForm.price_max_rwf}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_max_rwf: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.priceNoteLabel")}</span>
                  <input
                    value={serviceForm.price_note}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_note: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                    placeholder={t("admin.priceNotePlaceholder")}
                  />
                </label>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="font-mono text-[11px] uppercase tracking-widest bg-gold text-bg px-4 py-3 rounded-sm hover:bg-gold-bright transition-colors disabled:opacity-50"
                  >
                    {saving ? t("admin.savingButton") : t("admin.addServiceButton")}
                  </button>
                </div>
              </form>
            </section>

            <section className="border border-line bg-card p-6 rounded-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl text-gold-bright">{t("admin.servicesTitle")}</h2>
                  <p className="text-sm text-stone">{t("admin.servicesSubtitle")}</p>
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(serviceGroups).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">{eventLabels?.[category] || category}</h3>
                    <div className="space-y-3">
                      {items.map((service) => (
                        <div key={service.id} className="border border-line p-4 rounded-sm bg-bg/70">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{subcategoryLabels?.[service.subcategory] || service.subcategory}</p>
                              <h4 className="font-display text-xl text-cream">{service.name}</h4>
                              <p className="text-sm text-stone mt-1">{service.description}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <label className="text-sm">
                                <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-1">{t("admin.priceLabel")}</span>
                                <input
                                  type="number"
                                  value={service.price_rwf ?? ""}
                                  onChange={(e) => {
                                    const updated = services.map((item) => (item.id === service.id ? { ...item, price_rwf: Number(e.target.value) } : item));
                                    setServices(updated);
                                  }}
                                  className="bg-bg border border-line rounded-sm px-3 py-2 text-cream"
                                />
                              </label>
                              <label className="text-sm">
                                <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-1">{t("admin.minPriceLabel")}</span>
                                <input
                                  type="number"
                                  value={service.price_min_rwf ?? ""}
                                  onChange={(e) => {
                                    const updated = services.map((item) => (item.id === service.id ? { ...item, price_min_rwf: Number(e.target.value) } : item));
                                    setServices(updated);
                                  }}
                                  className="bg-bg border border-line rounded-sm px-3 py-2 text-cream"
                                />
                              </label>
                              <label className="text-sm">
                                <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-1">{t("admin.maxPriceLabel")}</span>
                                <input
                                  type="number"
                                  value={service.price_max_rwf ?? ""}
                                  onChange={(e) => {
                                    const updated = services.map((item) => (item.id === service.id ? { ...item, price_max_rwf: Number(e.target.value) } : item));
                                    setServices(updated);
                                  }}
                                  className="bg-bg border border-line rounded-sm px-3 py-2 text-cream"
                                />
                              </label>
                              <button
                                onClick={() => handleUpdatePrice(service)}
                                disabled={updatingPrices[service.id]}
                                className="self-end font-mono text-[10px] uppercase tracking-widest bg-gold text-bg px-3 py-2 rounded-sm hover:bg-gold-bright transition-colors disabled:opacity-50"
                              >
                                {updatingPrices[service.id] ? t("admin.savingButton") : t("admin.savePriceButton")}
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-stone">{t("admin.currentPriceLabel")} <span className="text-gold-bright">{formatServicePrice(service)}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-line bg-card p-6 rounded-sm">
              <div className="mb-6">
                <h2 className="font-display text-2xl text-gold-bright">{t("admin.createAlbumTitle") || "Create an album for a customer"}</h2>
                <p className="text-sm text-stone">{t("admin.createAlbumSubtitle") || "Only administrators can create albums and assign their type."}</p>
              </div>
              <form onSubmit={handleCreateAlbum} className="grid md:grid-cols-3 gap-4">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.albumNameLabel") || "Album name"}</span>
                  <input
                    required
                    value={albumForm.title}
                    onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                    placeholder={t("admin.albumNamePlaceholder") || "e.g. Alice & Jean wedding"}
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.albumCustomerLabel") || "Customer"}</span>
                  <select
                    required
                    value={albumForm.user_id}
                    onChange={(e) => setAlbumForm({ ...albumForm, user_id: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                  >
                    <option value="">{t("admin.albumCustomerPlaceholder") || "Select a customer"}</option>
                    {users.filter((entry) => entry.role === "user").map((entry) => (
                      <option key={entry.id} value={entry.id}>{entry.name} · {entry.email}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.albumTypeLabel") || "Album type"}</span>
                  <select
                    required
                    value={albumForm.album_type_id}
                    onChange={(e) => setAlbumForm({ ...albumForm, album_type_id: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                  >
                    <option value="">{t("admin.albumTypePlaceholder") || "Select an album type"}</option>
                    {albumTypes.filter((type) => type.is_active).map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </label>
                <div className="md:col-span-3">
                  <button type="submit" className="font-mono text-[11px] uppercase tracking-widest bg-gold text-bg px-4 py-3 rounded-sm hover:bg-gold-bright transition-colors">
                    {t("admin.createAlbumButton") || "Create album"}
                  </button>
                </div>
              </form>
            </section>

            <section className="border border-line bg-card p-6 rounded-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl text-gold-bright">{t("admin.albumsTitle")}</h2>
                  <p className="text-sm text-stone">{t("admin.albumsSubtitle") || "Choose the album options your customers can pick from during booking."}</p>
                </div>
              </div>
              <form onSubmit={handleCreateAlbumType} className="grid md:grid-cols-2 gap-4 mb-6">
                <label className="block md:col-span-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.albumTypeNameLabel") || "Album type name"}</span>
                  <input
                    required
                    value={albumTypeForm.name}
                    onChange={(e) => setAlbumTypeForm({ ...albumTypeForm, name: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                    placeholder={t("admin.albumTypeNamePlaceholder") || "e.g. Premium"}
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.albumTypeDescriptionLabel") || "Description"}</span>
                  <textarea
                    rows={2}
                    value={albumTypeForm.description}
                    onChange={(e) => setAlbumTypeForm({ ...albumTypeForm, description: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream resize-none"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.priceLabel")}</span>
                  <input
                    type="number"
                    min="0"
                    value={albumTypeForm.price_rwf}
                    onChange={(e) => setAlbumTypeForm({ ...albumTypeForm, price_rwf: e.target.value })}
                    className="w-full mt-2 bg-bg border border-line rounded-sm px-3 py-3 text-cream"
                  />
                </label>
                <label className="flex items-center gap-2 mt-8">
                  <input
                    type="checkbox"
                    checked={albumTypeForm.is_active}
                    onChange={(e) => setAlbumTypeForm({ ...albumTypeForm, is_active: e.target.checked })}
                  />
                  <span className="text-cream">{t("admin.albumTypeActiveLabel") || "Active"}</span>
                </label>
                <div className="md:col-span-2">
                  <button type="submit" className="font-mono text-[11px] uppercase tracking-widest bg-gold text-bg px-4 py-3 rounded-sm hover:bg-gold-bright transition-colors">
                    {t("admin.addAlbumTypeButton") || "Add album type"}
                  </button>
                </div>
              </form>
              <div className="space-y-3">
                {albumTypes.map((albumType) => (
                  <div key={albumType.id} className="border border-line p-4 rounded-sm bg-bg/70">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-display text-xl text-cream">{albumType.name}</p>
                        <p className="text-sm text-stone mt-1">{albumType.description || t("admin.albumTypeNoDescription") || "No description yet."}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <label className="text-sm">
                          <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-dim mb-1">{t("admin.priceLabel")}</span>
                          <input
                            type="number"
                            value={albumType.price_rwf ?? ""}
                            onChange={(e) => {
                              const updated = albumTypes.map((item) => (item.id === albumType.id ? { ...item, price_rwf: Number(e.target.value) } : item));
                              setAlbumTypes(updated);
                            }}
                            className="bg-bg border border-line rounded-sm px-3 py-2 text-cream"
                          />
                        </label>
                        <label className="flex items-center gap-2 self-end">
                          <input
                            type="checkbox"
                            checked={albumType.is_active}
                            onChange={(e) => {
                              const updated = albumTypes.map((item) => (item.id === albumType.id ? { ...item, is_active: e.target.checked } : item));
                              setAlbumTypes(updated);
                            }}
                          />
                          <span className="text-cream">{t("admin.albumTypeActiveLabel") || "Active"}</span>
                        </label>
                        <button
                          onClick={() => handleUpdateAlbumType(albumType)}
                          className="self-end font-mono text-[10px] uppercase tracking-widest bg-gold text-bg px-3 py-2 rounded-sm hover:bg-gold-bright transition-colors"
                        >
                          {t("admin.savePriceButton")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-line bg-card p-6 rounded-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl text-gold-bright">{t("admin.usersTitle")}</h2>
                  <p className="text-sm text-stone">{t("admin.usersSubtitle")}</p>
                </div>
              </div>
              <div className="space-y-3">
                {users.map((entry) => (
                  <div key={entry.id} className="flex flex-col md:flex-row md:items-center md:justify-between border border-line p-4 rounded-sm bg-bg/70 gap-3">
                    <div>
                      <p className="font-display text-lg text-cream">{entry.name}</p>
                      <p className="text-sm text-stone">{entry.email}</p>
                      <p className="text-sm text-stone-dim">{entry.phone}</p>
                      <p className="text-sm text-stone-dim mt-1">{entry.status === "suspended" ? t("admin.suspended") : t("admin.active")}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full ${entry.role === "admin" ? "bg-gold text-bg" : "border border-line text-stone"}`}>
                        {entry.role === "admin" ? t("admin.roleAdmin") : t("admin.roleUser")}
                      </span>
                      <button
                        onClick={() => handleToggleUserRole(entry.id, entry.role)}
                        className="font-mono text-[10px] uppercase tracking-widest border border-gold text-gold px-3 py-2 rounded-sm hover:bg-gold hover:text-bg transition-colors"
                      >
                        {entry.role === "admin" ? t("admin.removeAdminButton") : t("admin.makeAdminButton")}
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(entry)}
                        className="font-mono text-[10px] uppercase tracking-widest border border-stone-dim text-stone px-3 py-2 rounded-sm hover:border-gold hover:text-gold-bright transition-colors"
                      >
                        {entry.status === "suspended" ? t("admin.activateUserButton") : t("admin.suspendUserButton")}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(entry.id)}
                        className="font-mono text-[10px] uppercase tracking-widest text-maroon hover:text-gold-bright transition-colors"
                      >
                        {t("admin.deleteUserButton")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-line bg-card p-6 rounded-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl text-gold-bright">{t("admin.bookingsTitle")}</h2>
                  <p className="text-sm text-stone">{t("admin.bookingsSubtitle")}</p>
                </div>
              </div>
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-line p-4 rounded-sm bg-bg/70">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-display text-lg text-cream">{booking.service_name || booking.service_category}</p>
                        <p className="text-sm text-stone">{booking.user_name} • {booking.user_email}</p>
                        <p className="text-sm text-stone-dim">{booking.event_date} at {booking.event_time} • {booking.location || t("admin.noLocation")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-dim">{t("admin.amountDueLabel")}</p>
                        <p className="font-display text-xl text-gold-bright">{formatRwf(booking.amount_rwf || booking.amount_rwf)}</p>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-gold mt-2">{booking.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-line bg-card p-6 rounded-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl text-gold-bright">{t("admin.messagesTitle") || "Messages"}</h2>
                  <p className="text-sm text-stone">{t("admin.messagesSubtitle") || "Direct messages users have sent to you. Only you can see and reply to these."}</p>
                </div>
              </div>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-stone-dim">{t("admin.messagesEmpty") || "No messages yet."}</p>
                ) : (
                  messages.map((entry) => (
                    <MessageItem key={entry.id} entry={entry} onReplied={loadData} />
                  ))
                )}
              </div>
            </section>

            <section className="border border-line bg-card p-6 rounded-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl text-gold-bright">{t("admin.feedbackTitle")}</h2>
                  <p className="text-sm text-stone">{t("admin.feedbackSubtitle")}</p>
                </div>
              </div>
              <div className="space-y-3">
                {feedback.map((entry) => (
                  <FeedbackItem key={entry.id} entry={entry} onReplied={loadData} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
