import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Lock, Bell, Save } from "lucide-react";

export default function StudentSettings() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notifPrefs, setNotifPrefs] = useState({
    emailReminders: true,
    emailUpdates: true,
    emailPromotions: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data.notificationPreferences) {
          setNotifPrefs(res.data.notificationPreferences);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPrefs();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put("/users/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNotifSave = async () => {
    setNotifLoading(true);
    try {
      await api.put("/users/notification-preferences", { notificationPreferences: notifPrefs });
      toast.success("Preferences saved!");
    } catch (err) {
      toast.error("Failed to save preferences");
    } finally {
      setNotifLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {passwordLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "emailReminders", label: "Event Reminders", desc: "Receive reminders 24 hours before your events" },
            { key: "emailUpdates", label: "Event Updates", desc: "Get notified when events you're registered for are updated" },
            { key: "emailPromotions", label: "Promotional Emails", desc: "Receive recommendations and featured events" },
          ].map((pref) => (
            <label key={pref.key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifPrefs[pref.key]}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, [pref.key]: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                <p className="text-xs text-gray-500">{pref.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={handleNotifSave}
          disabled={notifLoading}
          className="mt-4 flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          <Save className="w-4 h-4" />
          {notifLoading ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
