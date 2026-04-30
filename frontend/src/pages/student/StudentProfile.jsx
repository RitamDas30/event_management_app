import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Save, ArrowRight, UserCircle } from "lucide-react";
import clsx from "clsx";

const availableInterests = ["Technical", "Cultural", "Sports", "Academic", "Social", "Workshops", "Hackathons", "Music", "Art", "Networking"];

export default function StudentProfile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", interests: [], socialLinks: { website: "", github: "", linkedin: "", twitter: "" } });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data;
        setForm({
          name: u.name || "", bio: u.bio || "", interests: u.interests || [],
          socialLinks: { website: u.socialLinks?.website || "", github: u.socialLinks?.github || "", linkedin: u.socialLinks?.linkedin || "", twitter: u.socialLinks?.twitter || "" },
        });
      } catch (err) {}
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/users/profile", form);
      login({ ...user, ...res.data.user }, localStorage.getItem("token"));
      toast.success("Profile updated successfully.");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update profile"); } finally { setLoading(false); }
  };

  const toggleInterest = (interest) => {
    setForm(p => ({ ...p, interests: p.interests.includes(interest) ? p.interests.filter(i => i !== interest) : [...p.interests, interest] }));
  };

  return (
    <div className="w-full max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-semibold text-surface-950 dark:text-surface-50 mb-2">Profile</h1>
        <p className="text-surface-500">Manage your public persona and interests.</p>
      </motion.div>

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSubmit} className="bg-surface-50 dark:bg-surface-900 border border-border rounded-[2.5rem] p-8 sm:p-12 shadow-surface space-y-10">
        
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-surface-200 dark:bg-surface-800 text-surface-900 dark:text-surface-50 flex items-center justify-center font-semibold text-4xl border border-border shadow-sm">
            {form.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="text-xl font-medium text-surface-950 dark:text-surface-50">{form.name || "Your Name"}</h3>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400 mt-1">{user?.role}</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid gap-6 sm:grid-cols-2 border-t border-border pt-10">
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-surface-950 dark:text-surface-50">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-5 py-3.5 bg-surface-100 dark:bg-surface-950 border border-transparent rounded-xl text-sm focus:border-brand-500 focus:bg-surface-50 dark:focus:bg-surface-900 outline-none transition-all placeholder:text-surface-400" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-surface-950 dark:text-surface-50">Biography</label>
              <span className="text-xs font-medium text-surface-400">{form.bio.length}/500</span>
            </div>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} maxLength={500} placeholder="A brief overview of who you are..." className="w-full px-5 py-3.5 bg-surface-100 dark:bg-surface-950 border border-transparent rounded-xl text-sm focus:border-brand-500 focus:bg-surface-50 dark:focus:bg-surface-900 outline-none resize-none transition-all placeholder:text-surface-400" />
          </div>
        </div>

        {/* Interests */}
        <div className="border-t border-border pt-10">
          <label className="block text-sm font-medium text-surface-950 dark:text-surface-50 mb-4">Interests & Tags</label>
          <div className="flex flex-wrap gap-2.5">
            {availableInterests.map((interest) => {
              const active = form.interests.includes(interest);
              return (
                <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={clsx("px-4 py-2 rounded-full text-sm font-medium transition-all border", active ? "bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 border-transparent shadow-sm" : "bg-transparent text-surface-600 dark:text-surface-400 border-border hover:border-surface-400")}>
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Links */}
        <div className="border-t border-border pt-10">
          <label className="block text-sm font-medium text-surface-950 dark:text-surface-50 mb-6">Digital Presence</label>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "website", label: "Personal Site", p: "https://" }, { key: "github", label: "GitHub", p: "github.com/" },
              { key: "linkedin", label: "LinkedIn", p: "linkedin.com/in/" }, { key: "twitter", label: "X / Twitter", p: "x.com/" }
            ].map((f) => (
              <div key={f.key} className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500">{f.label}</label>
                <input type="url" value={form.socialLinks[f.key]} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, [f.key]: e.target.value } })} placeholder={f.p} className="w-full px-5 py-3 bg-surface-100 dark:bg-surface-950 border border-transparent rounded-xl text-sm focus:border-brand-500 focus:bg-surface-50 dark:focus:bg-surface-900 outline-none transition-all placeholder:text-surface-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-8 flex justify-end">
          <button type="submit" disabled={loading} className="group inline-flex items-center justify-center gap-2 bg-brand-600 text-white hover:bg-brand-500 px-8 py-3.5 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-glow disabled:opacity-50">
            {loading ? "Saving..." : <>Save Profile <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
