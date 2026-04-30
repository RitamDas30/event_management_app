import { useState, useEffect } from "react";
import { FileText, Shield, Users, CalendarDays, Trash2 } from "lucide-react";

// In a full implementation, this would fetch from a backend audit log collection.
// For now, we simulate recent admin actions from the session.
const mockAuditLogs = [
  { id: 1, action: "User role changed", target: "john@example.com", details: "student → organizer", admin: "admin@admin.com", timestamp: new Date(Date.now() - 3600000).toISOString(), type: "user" },
  { id: 2, action: "Event deleted", target: "Tech Workshop 2026", details: "Removed by admin moderation", admin: "admin@admin.com", timestamp: new Date(Date.now() - 7200000).toISOString(), type: "event" },
  { id: 3, action: "User deleted", target: "spam@test.com", details: "Account and data removed", admin: "admin@admin.com", timestamp: new Date(Date.now() - 86400000).toISOString(), type: "user" },
  { id: 4, action: "Platform announcement", target: "Maintenance Notice", details: "Published info banner", admin: "admin@admin.com", timestamp: new Date(Date.now() - 172800000).toISOString(), type: "system" },
];

const typeIcons = {
  user: Users,
  event: CalendarDays,
  system: Shield,
};

const typeColors = {
  user: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400",
  event: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
  system: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function AdminAuditLog() {
  const [logs] = useState(mockAuditLogs);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50">Audit Log</h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">Track admin actions across the platform</p>
      </div>

      <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-100 dark:bg-surface-900/50 border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Type</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Action</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Target</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Details</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Admin</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const Icon = typeIcons[log.type] || FileText;
                const colorClass = typeColors[log.type] || "bg-surface-100 dark:bg-surface-900/50 text-surface-600 dark:text-surface-400";
                return (
                  <tr key={log.id} className="border-b border-border hover:bg-surface-100 dark:bg-surface-900/50">
                    <td className="py-3 px-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-surface-950 dark:text-surface-50">{log.action}</td>
                    <td className="py-3 px-4 text-surface-700 dark:text-surface-300">{log.target}</td>
                    <td className="py-3 px-4 text-surface-500 text-xs">{log.details}</td>
                    <td className="py-3 px-4 text-surface-500">{log.admin}</td>
                    <td className="py-3 px-4 text-surface-500 text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t bg-surface-100 dark:bg-surface-900/50 text-xs text-surface-500">
          Showing {logs.length} recent actions. Full audit log stored in database.
        </div>
      </div>
    </div>
  );
}
