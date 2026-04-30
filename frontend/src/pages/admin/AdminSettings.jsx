import { useState } from "react";
import toast from "react-hot-toast";
import { Settings, Save, Globe, Shield, Mail, Database } from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: "Evently",
    siteDescription: "Campus Event Management Platform",
    maintenanceMode: false,
    registrationEnabled: true,
    maxEventsPerOrganizer: 50,
    maxCapacityPerEvent: 1000,
    emailNotificationsEnabled: true,
    autoApproveOrganizers: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved (local only — connect to backend for persistence)");
    }, 500);
  };

  const Toggle = ({ checked, onChange, label, description }) => (
    <label className="flex items-start justify-between cursor-pointer py-3">
      <div className="pr-4">
        <p className="text-sm font-medium text-surface-950 dark:text-surface-50">{label}</p>
        <p className="text-xs text-surface-500 mt-0.5">{description}</p>
      </div>
      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-brand-600" : "bg-surface-200 dark:bg-surface-800"}`} onClick={onChange}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-surface-50 dark:bg-surface-900 transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </div>
    </label>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50">Platform Settings</h1>

      {/* General */}
      <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-surface-950 dark:text-surface-50 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-brand-600 dark:text-brand-400" /> General
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Site Name</label>
            <input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Site Description</label>
            <input type="text" value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-surface-950 dark:text-surface-50 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-600 dark:text-rose-400" /> Security & Access
        </h2>
        <div className="divide-y divide-gray-100">
          <Toggle checked={settings.maintenanceMode} onChange={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })} label="Maintenance Mode" description="Disable public access temporarily for upgrades" />
          <Toggle checked={settings.registrationEnabled} onChange={() => setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })} label="User Registration" description="Allow new users to sign up" />
          <Toggle checked={settings.autoApproveOrganizers} onChange={() => setSettings({ ...settings, autoApproveOrganizers: !settings.autoApproveOrganizers })} label="Auto-Approve Organizers" description="Skip admin review for new organizer accounts" />
        </div>
      </div>

      {/* Limits */}
      <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-surface-950 dark:text-surface-50 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-violet-600 dark:text-violet-400" /> Limits
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Max Events per Organizer</label>
            <input type="number" value={settings.maxEventsPerOrganizer} onChange={(e) => setSettings({ ...settings, maxEventsPerOrganizer: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Max Capacity per Event</label>
            <input type="number" value={settings.maxCapacityPerEvent} onChange={(e) => setSettings({ ...settings, maxCapacityPerEvent: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-surface-950 dark:text-surface-50 mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Notifications
        </h2>
        <Toggle checked={settings.emailNotificationsEnabled} onChange={() => setSettings({ ...settings, emailNotificationsEnabled: !settings.emailNotificationsEnabled })} label="Email Notifications" description="Enable/disable all platform email notifications" />
      </div>

      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-brand-700 transition disabled:bg-gray-400">
        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save All Settings"}
      </button>
    </div>
  );
}
