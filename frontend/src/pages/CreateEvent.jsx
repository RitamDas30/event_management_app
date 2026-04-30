import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  X,
  Calendar,
  MapPin,
  Users,
  Image,
  FileText,
  Tag,
  HelpCircle,
  Mic,
} from "lucide-react";

const steps = [
  { id: 1, name: "Basic Info", icon: FileText },
  { id: 2, name: "Schedule & Venue", icon: Calendar },
  { id: 3, name: "Details", icon: Tag },
  { id: 4, name: "Media & Review", icon: Image },
];

const categories = ["Technical", "Cultural", "Sports", "Academic", "Social"];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Technical",
    fullAddress: "",
    venueName: "",
    startTime: "",
    endTime: "",
    capacity: 50,
    price: 0,
    eventMode: "in-person",
    imageFile: null,
    tags: [],
    agenda: [],
    faqs: [],
    speakers: [],
  });

  const [tagInput, setTagInput] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imageFile" && files?.length > 0) {
      setForm({ ...form, imageFile: files[0] });
    } else {
      const finalValue =
        name === "capacity" || name === "price"
          ? value === ""
            ? ""
            : Number(value)
          : value;
      setForm({ ...form, [name]: finalValue });
    }
  };

  // Tag management
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag) && form.tags.length < 10) {
      setForm({ ...form, tags: [...form.tags, tag] });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  // Agenda management
  const addAgendaItem = () => {
    setForm({
      ...form,
      agenda: [...form.agenda, { time: "", title: "", speaker: "", duration: "" }],
    });
  };

  const updateAgendaItem = (index, field, value) => {
    const updated = [...form.agenda];
    updated[index][field] = value;
    setForm({ ...form, agenda: updated });
  };

  const removeAgendaItem = (index) => {
    setForm({ ...form, agenda: form.agenda.filter((_, i) => i !== index) });
  };

  // FAQ management
  const addFaq = () => {
    setForm({ ...form, faqs: [...form.faqs, { question: "", answer: "" }] });
  };

  const updateFaq = (index, field, value) => {
    const updated = [...form.faqs];
    updated[index][field] = value;
    setForm({ ...form, faqs: updated });
  };

  const removeFaq = (index) => {
    setForm({ ...form, faqs: form.faqs.filter((_, i) => i !== index) });
  };

  // Speaker management
  const addSpeaker = () => {
    setForm({
      ...form,
      speakers: [...form.speakers, { name: "", role: "", bio: "", socialLink: "" }],
    });
  };

  const updateSpeaker = (index, field, value) => {
    const updated = [...form.speakers];
    updated[index][field] = value;
    setForm({ ...form, speakers: updated });
  };

  const removeSpeaker = (index) => {
    setForm({ ...form, speakers: form.speakers.filter((_, i) => i !== index) });
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!form.title || !form.description || !form.category) {
          toast.error("Please fill in all required fields");
          return false;
        }
        return true;
      case 2:
        if (!form.startTime || !form.endTime) {
          toast.error("Please fill in time details");
          return false;
        }
        if (form.eventMode !== "online" && (!form.venueName || !form.fullAddress)) {
          toast.error("Please fill in venue details");
          return false;
        }
        if (new Date(form.endTime) <= new Date(form.startTime)) {
          toast.error("End time must be after start time");
          return false;
        }
        return true;
      case 3:
        return true; // Optional fields
      case 4:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      if (form.imageFile) formData.append("image", form.imageFile);

      // Auto-fill venue for online events
      const submissionData = { ...form };
      if (submissionData.eventMode === "online") {
        submissionData.venueName = "Virtual Event";
        submissionData.fullAddress = "Online";
      }

      // Basic fields
      const basicFields = [
        "title", "description", "category", "fullAddress", "venueName",
        "startTime", "endTime", "capacity", "price", "eventMode",
      ];
      basicFields.forEach((key) => {
        if (submissionData[key] !== null && submissionData[key] !== undefined) {
          formData.append(key, submissionData[key]);
        }
      });

      // Array/JSON fields
      if (form.tags.length > 0) formData.append("tags", JSON.stringify(form.tags));
      if (form.agenda.length > 0) formData.append("agenda", JSON.stringify(form.agenda));
      if (form.faqs.length > 0) formData.append("faqs", JSON.stringify(form.faqs));
      if (form.speakers.length > 0) formData.append("speakers", JSON.stringify(form.speakers));

      await api.post("/events", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Event created successfully!");
      navigate("/organizer/events");
    } catch (err) {
      toast.error(err.response?.data?.message || "Event creation failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/30 focus:outline-none transition-colors";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-brand-600 text-white"
                        : "bg-surface-200 dark:bg-surface-800 text-surface-500"
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      isActive ? "text-brand-600 dark:text-brand-400" : "text-surface-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mt-[-12px] ${
                      currentStep > step.id ? "bg-green-500" : "bg-surface-200 dark:bg-surface-800"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6 sm:p-8">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-surface-950 dark:text-surface-50 mb-4">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Annual Tech Fest 2026"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the event..."
                rows={4}
                required
                className={inputClass + " resize-none"}
              />
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{form.description.length}/2000</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Event Mode *</label>
              <div className="grid grid-cols-3 gap-2">
                {["in-person", "online", "hybrid"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setForm({ ...form, eventMode: mode })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                      form.eventMode === mode
                        ? "border-blue-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                        : "border-border text-surface-600 dark:text-surface-400 hover:border-border"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Category *</label>
                <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  placeholder="0 for free"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Schedule & Venue */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-surface-950 dark:text-surface-50 mb-4">Schedule & Venue</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Start Time *</label>
                <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">End Time *</label>
                <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required className={inputClass} />
              </div>
            </div>

            {/* Venue — conditional based on event mode */}
            {form.eventMode === "online" ? (
              <div className="bg-violet-50 dark:bg-violet-500/10 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-800">Virtual Event</p>
                    <p className="text-xs text-violet-600 dark:text-violet-400">A streaming link will be auto-generated. Attendees join via the Live Events page.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Venue Name *</label>
                    <input type="text" name="venueName" value={form.venueName} onChange={handleChange} placeholder="e.g., Main Auditorium" required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      {form.eventMode === "hybrid" ? "In-Person Capacity *" : "Capacity *"}
                    </label>
                    <input type="number" name="capacity" value={form.capacity} onChange={handleChange} min="1" required className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Full Address *</label>
                  <input type="text" name="fullAddress" value={form.fullAddress} onChange={handleChange} placeholder="e.g., 123 University Road, City, State" required className={inputClass} />
                </div>

                {form.eventMode === "hybrid" && (
                  <div className="bg-brand-50 dark:bg-brand-500/10 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" /></svg>
                    <p className="text-xs text-brand-700 dark:text-brand-300">Hybrid event — a virtual streaming link will also be generated for remote attendees.</p>
                  </div>
                )}
              </>
            )}

            {/* Capacity for online-only (no venue) */}
            {form.eventMode === "online" && (
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Max Viewers *</label>
                <input type="number" name="capacity" value={form.capacity} onChange={handleChange} min="1" required className={inputClass} placeholder="Maximum online attendees" />
              </div>
            )}

            {/* Agenda Builder */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Agenda / Schedule</label>
                <button type="button" onClick={addAgendaItem} className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-300 font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
              {form.agenda.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-start">
                  <input type="text" value={item.time} onChange={(e) => updateAgendaItem(idx, "time", e.target.value)} placeholder="10:00 AM" className="w-24 px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500" />
                  <input type="text" value={item.title} onChange={(e) => updateAgendaItem(idx, "title", e.target.value)} placeholder="Session title" className="flex-1 px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500" />
                  <input type="text" value={item.speaker} onChange={(e) => updateAgendaItem(idx, "speaker", e.target.value)} placeholder="Speaker" className="w-32 px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500" />
                  <input type="text" value={item.duration} onChange={(e) => updateAgendaItem(idx, "duration", e.target.value)} placeholder="30m" className="w-16 px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500" />
                  <button type="button" onClick={() => removeAgendaItem(idx)} className="p-2 text-surface-400 dark:text-surface-500 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Details (Tags, FAQ, Speakers) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-surface-950 dark:text-surface-50 mb-4">Additional Details</h2>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                <Tag className="w-4 h-4 inline mr-1" /> Tags
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add a tag and press Enter"
                  className={inputClass}
                />
                <button type="button" onClick={addTag} className="px-4 py-2 bg-surface-100 dark:bg-surface-800 rounded-lg text-sm font-medium hover:bg-surface-200 dark:bg-surface-800">Add</button>
              </div>
            </div>

            {/* Speakers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  <Mic className="w-4 h-4 inline mr-1" /> Speakers
                </label>
                <button type="button" onClick={addSpeaker} className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-300 font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Speaker
                </button>
              </div>
              {form.speakers.map((speaker, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 mb-2 space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={speaker.name} onChange={(e) => updateSpeaker(idx, "name", e.target.value)} placeholder="Speaker name" className="flex-1 px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500" />
                    <input type="text" value={speaker.role} onChange={(e) => updateSpeaker(idx, "role", e.target.value)} placeholder="Role / Title" className="flex-1 px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500" />
                    <button type="button" onClick={() => removeSpeaker(idx)} className="p-2 text-surface-400 dark:text-surface-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                  <input type="text" value={speaker.bio} onChange={(e) => updateSpeaker(idx, "bio", e.target.value)} placeholder="Short bio" className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500" />
                  <input type="url" value={speaker.socialLink} onChange={(e) => updateSpeaker(idx, "socialLink", e.target.value)} placeholder="LinkedIn/Twitter URL" className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500" />
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  <HelpCircle className="w-4 h-4 inline mr-1" /> FAQ
                </label>
                <button type="button" onClick={addFaq} className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-300 font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>
              {form.faqs.map((faq, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 mb-2 space-y-2">
                  <div className="flex gap-2 items-start">
                    <input type="text" value={faq.question} onChange={(e) => updateFaq(idx, "question", e.target.value)} placeholder="Question" className="flex-1 px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500" />
                    <button type="button" onClick={() => removeFaq(idx)} className="p-2 text-surface-400 dark:text-surface-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                  <textarea value={faq.answer} onChange={(e) => updateFaq(idx, "answer", e.target.value)} placeholder="Answer" rows={2} className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 resize-none" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Media & Review */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-surface-950 dark:text-surface-50 mb-4">Media & Review</h2>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Event Image</label>
              <input
                type="file"
                name="imageFile"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
                className="w-full border border-border p-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 dark:bg-brand-500/10 file:text-brand-700 dark:text-brand-300 hover:file:bg-brand-100 dark:bg-brand-500/20 rounded-lg bg-surface-100 dark:bg-surface-900/50"
              />
              {form.imageFile && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Selected: {form.imageFile.name}</p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-surface-100 dark:bg-surface-900/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-surface-950 dark:text-surface-50">Event Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-surface-500">Title:</span> <span className="font-medium">{form.title || "—"}</span></div>
                <div><span className="text-surface-500">Category:</span> <span className="font-medium">{form.category}</span></div>
                <div><span className="text-surface-500">Venue:</span> <span className="font-medium">{form.venueName || "—"}</span></div>
                <div><span className="text-surface-500">Capacity:</span> <span className="font-medium">{form.capacity}</span></div>
                <div><span className="text-surface-500">Price:</span> <span className="font-medium">{form.price > 0 ? `₹${form.price}` : "Free"}</span></div>
                <div><span className="text-surface-500">Tags:</span> <span className="font-medium">{form.tags.length > 0 ? form.tags.join(", ") : "None"}</span></div>
                <div><span className="text-surface-500">Start:</span> <span className="font-medium">{form.startTime ? new Date(form.startTime).toLocaleString() : "—"}</span></div>
                <div><span className="text-surface-500">End:</span> <span className="font-medium">{form.endTime ? new Date(form.endTime).toLocaleString() : "—"}</span></div>
                <div><span className="text-surface-500">Agenda Items:</span> <span className="font-medium">{form.agenda.length}</span></div>
                <div><span className="text-surface-500">Speakers:</span> <span className="font-medium">{form.speakers.length}</span></div>
                <div><span className="text-surface-500">FAQs:</span> <span className="font-medium">{form.faqs.length}</span></div>
                <div><span className="text-surface-500">Image:</span> <span className="font-medium">{form.imageFile ? "Yes" : "No"}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 rounded-xl hover:bg-surface-200 dark:bg-surface-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : (
                <><Check className="w-4 h-4" /> Create Event</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
