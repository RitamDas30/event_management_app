import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Lock, AlertTriangle, Save, ArrowLeft } from "lucide-react";

const categories = ["Technical", "Cultural", "Sports", "Academic", "Social"];

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "", description: "", category: "Technical", fullAddress: "", venueName: "",
    startTime: "", endTime: "", capacity: 50, price: 0, imageFile: null,
  });
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [occupiedSeats, setOccupiedSeats] = useState(0);
  const [lifecycle, setLifecycle] = useState("open"); // open | has_registrations | live | ended

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        const e = res.data;
        const occupied = e.capacity - e.seatsAvailable;
        setOccupiedSeats(occupied);
        setOriginal(e);

        const now = new Date();
        const start = new Date(e.startTime);
        const end = new Date(e.endTime);
        if (now > end) setLifecycle("ended");
        else if (now >= start) setLifecycle("live");
        else if (occupied > 0) setLifecycle("has_registrations");
        else setLifecycle("open");

        const fmt = (iso) => iso ? new Date(iso).toISOString().slice(0, 16) : "";
        setForm({
          title: e.title, description: e.description, category: e.category,
          fullAddress: e.fullAddress || "", venueName: e.venueName || "",
          startTime: fmt(e.startTime), endTime: fmt(e.endTime),
          capacity: e.capacity, price: e.price, imageFile: null,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  // Field lock rules per lifecycle
  const fieldLocks = {
    open: {},
    has_registrations: {
      price: "Price is locked after registrations. Create a new ticket tier instead.",
    },
    live: {
      title: "Locked during live event",
      category: "Locked during live event",
      fullAddress: "Locked during live event",
      venueName: "Locked during live event",
      startTime: "Locked during live event",
      endTime: "Locked during live event",
      capacity: "Locked during live event",
      price: "Locked during live event",
    },
    ended: {
      title: "Event has ended",
      category: "Event has ended",
      fullAddress: "Event has ended",
      venueName: "Event has ended",
      startTime: "Event has ended",
      endTime: "Event has ended",
      capacity: "Event has ended",
      price: "Event has ended",
    },
  };

  const locks = fieldLocks[lifecycle] || {};
  const isLocked = (field) => !!locks[field];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (isLocked(name)) return;
    if (name === "imageFile" && files?.length > 0) {
      setForm({ ...form, imageFile: files[0] });
    } else {
      const v = (name === "capacity" || name === "price") ? (value === "" ? "" : Number(value)) : value;
      setForm({ ...form, [name]: v });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.capacity < occupiedSeats) {
      return toast.error(`Capacity can't be less than ${occupiedSeats} booked seats`);
    }
    if (form.endTime && form.startTime && new Date(form.endTime) <= new Date(form.startTime)) {
      return toast.error("End time must be after start time");
    }

    setSaving(true);
    try {
      const isImageUpdated = form.imageFile !== null;
      const payload = { ...form };
      delete payload.imageFile;

      // Only send changed fields to avoid triggering locks on unchanged data
      const changedFields = {};
      for (const key of Object.keys(payload)) {
        if (isLocked(key)) continue;
        const orig = key === "startTime" || key === "endTime"
          ? new Date(original[key]).toISOString().slice(0, 16)
          : original[key];
        if (String(payload[key]) !== String(orig)) {
          changedFields[key] = payload[key];
        }
      }

      // Always send description (it's always editable)
      if (!changedFields.description && payload.description !== original.description) {
        changedFields.description = payload.description;
      }

      let res;
      if (isImageUpdated) {
        const fd = new FormData();
        fd.append("image", form.imageFile);
        Object.entries(changedFields).forEach(([k, v]) => fd.append(k, v));
        res = await api.put(`/events/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        if (Object.keys(changedFields).length === 0) {
          toast("No changes detected");
          setSaving(false);
          return;
        }
        res = await api.put(`/events/${id}`, changedFields);
      }

      // Show warnings if any
      if (res.data.warnings?.length > 0) {
        res.data.warnings.forEach((w) => toast(w, { icon: "⚠️", duration: 5000 }));
      }

      toast.success("Event updated!");
      navigate("/organizer/events");
    } catch (err) {
      const msg = err.response?.data?.message || "Update failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const lifecycleLabels = {
    open: { text: "Fully Editable", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-green-200" },
    has_registrations: { text: `${occupiedSeats} Registered — Some Fields Locked`, color: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200" },
    live: { text: "Event is Live — Most Fields Locked", color: "bg-red-50 text-rose-700 dark:text-rose-300 border-red-200" },
    ended: { text: "Event Ended — Read Only (except description)", color: "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-border" },
  };

  const label = lifecycleLabels[lifecycle];
  const inputBase = "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none transition";
  const inputNormal = `${inputBase} border-border focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/30`;
  const inputLocked = `${inputBase} border-border bg-surface-100 dark:bg-surface-800 text-surface-500 cursor-not-allowed`;

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error) return <div className="text-center py-20 text-rose-600 dark:text-rose-400 font-semibold">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-surface-600 dark:text-surface-400 hover:text-surface-950 dark:text-surface-50 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50 mb-2">Edit Event</h1>

      {/* Lifecycle Banner */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-6 text-sm font-medium ${label.color}`}>
        {lifecycle === "open" ? null : lifecycle === "live" ? <AlertTriangle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        {label.text}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Title {isLocked("title") && <Lock className="w-3 h-3 inline text-surface-400 dark:text-surface-500 ml-1" />}
          </label>
          <input type="text" name="title" value={form.title} onChange={handleChange} disabled={isLocked("title")} required className={isLocked("title") ? inputLocked : inputNormal} />
          {isLocked("title") && <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{locks.title}</p>}
        </div>

        {/* Description — always editable */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Description <span className="text-emerald-600 dark:text-emerald-400 text-xs">(always editable)</span></label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} required className={inputNormal + " resize-none"} />
        </div>

        {/* Category + Venue */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Category {isLocked("category") && <Lock className="w-3 h-3 inline text-surface-400 dark:text-surface-500 ml-1" />}
            </label>
            <select name="category" value={form.category} onChange={handleChange} disabled={isLocked("category")} className={isLocked("category") ? inputLocked : inputNormal + " bg-surface-50 dark:bg-surface-900"}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Venue {isLocked("venueName") && <Lock className="w-3 h-3 inline text-surface-400 dark:text-surface-500 ml-1" />}
            </label>
            <input type="text" name="venueName" value={form.venueName} onChange={handleChange} disabled={isLocked("venueName")} className={isLocked("venueName") ? inputLocked : inputNormal} />
            {lifecycle === "has_registrations" && !isLocked("venueName") && occupiedSeats > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Changing venue will notify {occupiedSeats} attendees</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Full Address {isLocked("fullAddress") && <Lock className="w-3 h-3 inline text-surface-400 dark:text-surface-500 ml-1" />}
          </label>
          <input type="text" name="fullAddress" value={form.fullAddress} onChange={handleChange} disabled={isLocked("fullAddress")} className={isLocked("fullAddress") ? inputLocked : inputNormal} />
        </div>

        {/* Date/Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Start Time {isLocked("startTime") && <Lock className="w-3 h-3 inline text-surface-400 dark:text-surface-500 ml-1" />}
            </label>
            <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} disabled={isLocked("startTime")} className={isLocked("startTime") ? inputLocked : inputNormal} />
            {lifecycle === "has_registrations" && !isLocked("startTime") && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Changing time will notify {occupiedSeats} attendees</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              End Time {isLocked("endTime") && <Lock className="w-3 h-3 inline text-surface-400 dark:text-surface-500 ml-1" />}
            </label>
            <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} disabled={isLocked("endTime")} className={isLocked("endTime") ? inputLocked : inputNormal} />
          </div>
        </div>

        {/* Capacity + Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Capacity {isLocked("capacity") && <Lock className="w-3 h-3 inline text-surface-400 dark:text-surface-500 ml-1" />}
              {!isLocked("capacity") && occupiedSeats > 0 && <span className="text-xs text-surface-500 ml-1">(min: {occupiedSeats} booked)</span>}
            </label>
            <input type="number" name="capacity" value={form.capacity} onChange={handleChange} disabled={isLocked("capacity")} min={occupiedSeats || 1} className={isLocked("capacity") ? inputLocked : inputNormal} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Price (₹) {isLocked("price") && <Lock className="w-3 h-3 inline text-surface-400 dark:text-surface-500 ml-1" />}
            </label>
            <input type="number" name="price" value={form.price} onChange={handleChange} disabled={isLocked("price")} min="0" className={isLocked("price") ? inputLocked : inputNormal} />
            {isLocked("price") && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{locks.price}</p>}
          </div>
        </div>

        {/* Image — always editable */}
        {lifecycle !== "ended" && (
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Change Image</label>
            <input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp" onChange={handleChange}
              className="w-full border border-border p-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 dark:bg-brand-500/10 file:text-brand-700 dark:text-brand-300 hover:file:bg-brand-100 dark:bg-brand-500/20 rounded-lg bg-surface-100 dark:bg-surface-900/50" />
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button type="submit" disabled={saving || lifecycle === "ended"} className="flex items-center gap-2 bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-brand-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
          {lifecycle === "ended" && <p className="text-sm text-surface-500">Event has ended — only description edits are saved</p>}
        </div>
      </form>
    </div>
  );
}
