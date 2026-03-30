import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Ticket,
  Calendar,
  AlertCircle,
  ArrowUpCircle,
} from "lucide-react";

const typeIcons = {
  registration: Ticket,
  waitlist_promotion: ArrowUpCircle,
  event_update: Calendar,
  event_reminder: Bell,
  event_cancelled: AlertCircle,
  system: Bell,
};

const typeColors = {
  registration: "text-blue-600 bg-blue-50",
  waitlist_promotion: "text-green-600 bg-green-50",
  event_update: "text-purple-600 bg-purple-50",
  event_reminder: "text-amber-600 bg-amber-50",
  event_cancelled: "text-red-600 bg-red-50",
  system: "text-gray-600 bg-gray-50",
};

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async (p = 1) => {
    try {
      const res = await api.get(`/notifications?page=${p}&limit=15`);
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
      setTotalPages(res.data.pagination.pages);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            const colorClass = typeColors[notif.type] || "text-gray-600 bg-gray-50";

            return (
              <div
                key={notif._id}
                className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-all ${
                  !notif.read ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-medium ${!notif.read ? "text-gray-900" : "text-gray-700"}`}>
                        {notif.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    {notif.link && (
                      <Link
                        to={notif.link}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    )}
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif._id)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif._id)}
                      className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchNotifications(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${
                    p === page ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20">
          <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No notifications</h3>
          <p className="text-gray-500 mt-2">
            You'll receive notifications when you register for events or get updates.
          </p>
        </div>
      )}
    </div>
  );
}
