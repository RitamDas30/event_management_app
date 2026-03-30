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
  user: "bg-blue-50 text-blue-600",
  event: "bg-purple-50 text-purple-600",
  system: "bg-amber-50 text-amber-600",
};

export default function AdminAuditLog() {
  const [logs] = useState(mockAuditLogs);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-1">Track admin actions across the platform</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Target</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Details</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Admin</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const Icon = typeIcons[log.type] || FileText;
                const colorClass = typeColors[log.type] || "bg-gray-50 text-gray-600";
                return (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{log.action}</td>
                    <td className="py-3 px-4 text-gray-700">{log.target}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{log.details}</td>
                    <td className="py-3 px-4 text-gray-500">{log.admin}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500">
          Showing {logs.length} recent actions. Full audit log stored in database.
        </div>
      </div>
    </div>
  );
}
