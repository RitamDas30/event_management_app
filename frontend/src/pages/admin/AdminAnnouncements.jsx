import { useState } from "react";
import toast from "react-hot-toast";
import { Megaphone, Send, Trash2, AlertCircle, Info, CheckCircle } from "lucide-react";

const typeConfig = {
  info: { icon: Info, color: "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border-blue-200", label: "Info" },
  warning: { icon: AlertCircle, color: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200", label: "Warning" },
  success: { icon: CheckCircle, color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-green-200", label: "Success" },
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: "", message: "", type: "info" });
  const [sending, setSending] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error("Fill in all fields");
    setSending(true);
    setTimeout(() => {
      setAnnouncements((prev) => [
        { id: Date.now(), ...form, createdAt: new Date().toISOString(), active: true },
        ...prev,
      ]);
      setForm({ title: "", message: "", type: "info" });
      setSending(false);
      toast.success("Announcement published!");
    }, 500);
  };

  const toggleActive = (id) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  };

  const remove = (id) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast.success("Announcement removed");
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50 mb-6">Platform Announcements</h1>

      {/* Create */}
      <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6 mb-8">
        <h2 className="text-lg font-semibold text-surface-950 dark:text-surface-50 mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-brand-600 dark:text-brand-400" /> New Announcement
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-2">
            {Object.entries(typeConfig).map(([key, config]) => (
              <button key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize ${form.type === key ? config.color : "border-border text-surface-500"}`}>
                {config.label}
              </button>
            ))}
          </div>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" required className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:outline-none" />
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Announcement message..." rows={3} required className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:outline-none resize-none" />
          <button type="submit" disabled={sending} className="flex items-center gap-2 bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition disabled:bg-gray-400">
            <Send className="w-4 h-4" /> {sending ? "Publishing..." : "Publish"}
          </button>
        </form>
      </div>

      {/* List */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((a) => {
            const config = typeConfig[a.type] || typeConfig.info;
            const Icon = config.icon;
            return (
              <div key={a.id} className={`rounded-xl border p-4 ${a.active ? config.color : "bg-surface-100 dark:bg-surface-900/50 text-surface-500 border-border"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-sm mt-1 opacity-80">{a.message}</p>
                      <p className="text-xs mt-2 opacity-60">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(a.id)} className="px-2 py-1 text-xs rounded font-medium bg-surface-50 dark:bg-surface-900/50 hover:bg-surface-50 dark:bg-surface-900/80">
                      {a.active ? "Hide" : "Show"}
                    </button>
                    <button onClick={() => remove(a.id)} className="p-1 hover:text-rose-600 dark:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
