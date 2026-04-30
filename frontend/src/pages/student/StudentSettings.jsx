import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Lock, Bell, ArrowRight } from "lucide-react";
import clsx from "clsx";

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function StudentSettings() {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notifPrefs, setNotifPrefs] = useState({ emailReminders: true, emailUpdates: true, emailPromotions: false });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then(res => { if (res.data.notificationPreferences) setNotifPrefs(res.data.notificationPreferences); }).catch(()=>{});
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error("New passwords don't match");
    if (passwordForm.newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setPasswordLoading(true);
    try {
      await api.put("/users/password", { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success("Security credentials updated.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update security credentials"); } finally { setPasswordLoading(false); }
  };

  const handleNotifSave = async () => {
    setNotifLoading(true);
    try {
      await api.put("/users/notification-preferences", { notificationPreferences: notifPrefs });
      toast.success("Preferences synchronized.");
    } catch (err) { toast.error("Failed to sync preferences"); } finally { setNotifLoading(false); }
  };

  return (
    <div className="w-full max-w-3xl">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-10">
        <h1 className="text-3xl font-semibold text-surface-950 dark:text-surface-50 mb-2">Settings</h1>
        <p className="text-surface-500">Manage your security credentials and communication preferences.</p>
      </motion.div>

      <div className="space-y-8">
        {/* Password */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-surface-50 dark:bg-surface-900 border border-border rounded-[2.5rem] p-8 sm:p-12 shadow-surface">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex items-center justify-center">
              <Lock className="w-5 h-5 text-surface-950 dark:text-surface-50" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-surface-950 dark:text-surface-50">Security</h2>
              <p className="text-sm text-surface-500">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-950 dark:text-surface-50">Current Password</label>
              <input type="password" required value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full px-5 py-3.5 bg-surface-100 dark:bg-surface-950 border border-transparent rounded-xl text-sm focus:border-brand-500 focus:bg-surface-50 dark:focus:bg-surface-900 outline-none transition-all placeholder:text-surface-400" />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-950 dark:text-surface-50">New Password</label>
                <input type="password" required minLength={6} value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full px-5 py-3.5 bg-surface-100 dark:bg-surface-950 border border-transparent rounded-xl text-sm focus:border-brand-500 focus:bg-surface-50 dark:focus:bg-surface-900 outline-none transition-all placeholder:text-surface-400" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-950 dark:text-surface-50">Confirm Password</label>
                <input type="password" required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full px-5 py-3.5 bg-surface-100 dark:bg-surface-950 border border-transparent rounded-xl text-sm focus:border-brand-500 focus:bg-surface-50 dark:focus:bg-surface-900 outline-none transition-all placeholder:text-surface-400" />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={passwordLoading} className="group inline-flex items-center justify-center gap-2 bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 hover:bg-surface-800 dark:hover:bg-surface-200 px-6 py-3 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-sm disabled:opacity-50">
                {passwordLoading ? "Updating..." : <>Update Password <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Notifications */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }} className="bg-surface-50 dark:bg-surface-900 border border-border rounded-[2.5rem] p-8 sm:p-12 shadow-surface">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex items-center justify-center">
              <Bell className="w-5 h-5 text-surface-950 dark:text-surface-50" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-surface-950 dark:text-surface-50">Communications</h2>
              <p className="text-sm text-surface-500">Manage what we send to your inbox</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {[
              { key: "emailReminders", label: "Event Reminders", desc: "Receive reminders 24 hours before your events" },
              { key: "emailUpdates", label: "Event Updates", desc: "Get notified when events you're registered for are updated" },
              { key: "emailPromotions", label: "Platform Announcements", desc: "Receive recommendations and featured events" }
            ].map((pref) => (
              <label key={pref.key} className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-surface-100/50 dark:bg-surface-950/50 cursor-pointer group hover:border-surface-300 transition-colors">
                <div className="relative flex items-start pt-1">
                  <input type="checkbox" checked={notifPrefs[pref.key]} onChange={e => setNotifPrefs({ ...notifPrefs, [pref.key]: e.target.checked })} className="sr-only" />
                  <div className={clsx("w-5 h-5 rounded border transition-colors flex items-center justify-center", notifPrefs[pref.key] ? "bg-brand-600 border-brand-600" : "bg-surface-50 dark:bg-surface-900 border-border group-hover:border-surface-400")}>
                    {notifPrefs[pref.key] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-950 dark:text-surface-50 mb-0.5">{pref.label}</p>
                  <p className="text-sm text-surface-500">{pref.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end border-t border-border pt-8">
            <button onClick={handleNotifSave} disabled={notifLoading} className="group inline-flex items-center justify-center gap-2 bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 hover:bg-surface-800 dark:hover:bg-surface-200 px-6 py-3 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-sm disabled:opacity-50">
              {notifLoading ? "Saving..." : <>Save Preferences <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
