import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Lock, Bell, Save } from "lucide-react";

const notifLabels = {
  student: [
    { key: "emailReminders", label: "Event Reminders", desc: "Receive reminders 24 hours before your events" },
    { key: "emailUpdates", label: "Event Updates", desc: "Get notified when events you're registered for are updated" },
    { key: "emailPromotions", label: "Promotional Emails", desc: "Receive recommendations and featured events" },
  ],
  organizer: [
    { key: "emailReminders", label: "Event Reminders", desc: "Get notified about your upcoming events" },
    { key: "emailUpdates", label: "Registration Updates", desc: "Notifications when attendees register or cancel" },
    { key: "emailPromotions", label: "Platform Updates", desc: "News and feature announcements" },
  ],
  admin: [
    { key: "emailReminders", label: "System Alerts", desc: "Important platform notifications" },
    { key: "emailUpdates", label: "User Activity", desc: "Notifications about new users and events" },
    { key: "emailPromotions", label: "Platform Updates", desc: "Feature releases and announcements" },
  ],
};

export default function Settings() {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notifPrefs, setNotifPrefs] = useState({ emailReminders: true, emailUpdates: true, emailPromotions: false });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const prefs = notifLabels[user?.role] || notifLabels.student;

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data.notificationPreferences) setNotifPrefs(res.data.notificationPreferences);
      } catch (err) { console.error(err); }
    };
    fetchPrefs();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error("Passwords don't match");
    if (passwordForm.newPassword.length < 6) return toast.error("Min 6 characters");
    setPasswordLoading(true);
    try {
      await api.put("/users/password", { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success("Password changed!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setPasswordLoading(false); }
  };

  const handleNotifSave = async () => {
    setNotifLoading(true);
    try {
      await api.put("/users/notification-preferences", { notificationPreferences: notifPrefs });
      toast.success("Preferences saved!");
    } catch (err) { toast.error("Failed to save"); }
    finally { setNotifLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { key: "currentPassword", label: "Current Password" },
            { key: "newPassword", label: "New Password" },
            { key: "confirmPassword", label: "Confirm New Password" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type="password"
                value={passwordForm[field.key]}
                onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                required
                minLength={field.key !== "currentPassword" ? 6 : undefined}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>
          ))}
          <button type="submit" disabled={passwordLoading} className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:bg-gray-400">
            {passwordLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {prefs.map((pref) => (
            <label key={pref.key} className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={notifPrefs[pref.key]} onChange={(e) => setNotifPrefs({ ...notifPrefs, [pref.key]: e.target.checked })} className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                <p className="text-xs text-gray-500">{pref.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <button onClick={handleNotifSave} disabled={notifLoading} className="mt-4 flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:bg-gray-400">
          <Save className="w-4 h-4" /> {notifLoading ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
