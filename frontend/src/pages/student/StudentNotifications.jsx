import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Bell, BellOff, Check, CheckCheck, Trash2, Ticket, Calendar, AlertCircle, ArrowUpCircle } from "lucide-react";
import clsx from "clsx";

const typeIcons = {
  registration: Ticket, waitlist_promotion: ArrowUpCircle, event_update: Calendar,
  event_reminder: Bell, event_cancelled: AlertCircle, system: Bell,
};

const typeColors = {
  registration: "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20",
  waitlist_promotion: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
  event_update: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
  event_reminder: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
  event_cancelled: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
  system: "text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 border-border",
};

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };

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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) { toast.error("Failed to mark as read"); }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch (err) { toast.error("Failed to mark all as read"); }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
    } catch (err) { toast.error("Failed to delete"); }
  };

  const formatTime = (date) => {
    const d = new Date(date); const diffMs = new Date() - d; const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000); const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now"; if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`; if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-semibold text-surface-950 dark:text-surface-50 mb-2">Notifications</h1>
          <p className="text-surface-500">You have {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="inline-flex items-center gap-2 text-sm font-medium bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50 hover:bg-surface-200 dark:hover:bg-surface-700 px-4 py-2 rounded-full transition-colors shadow-sm">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="bg-surface-50 dark:bg-surface-900 h-24 rounded-[2rem] border border-border animate-pulse" />)}
        </div>
      ) : notifications.length > 0 ? (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.map((notif) => {
              const Icon = typeIcons[notif.type] || Bell;
              const colorClass = typeColors[notif.type] || typeColors.system;

              return (
                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={notif._id} className={clsx("bg-surface-50 dark:bg-surface-900 rounded-[1.5rem] border p-5 sm:p-6 flex items-start gap-4 transition-all group", !notif.read ? "border-brand-200 dark:border-brand-500/30 bg-brand-50/30 dark:bg-brand-900/10 shadow-sm" : "border-border hover:border-surface-300 dark:hover:border-surface-600")}>
                  <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border", colorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1.5">
                      <p className={clsx("text-base font-medium transition-colors", !notif.read ? "text-surface-950 dark:text-surface-50" : "text-surface-700 dark:text-surface-300")}>{notif.title}</p>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 whitespace-nowrap">{formatTime(notif.createdAt)}</span>
                    </div>
                    <p className="text-sm text-surface-500 leading-relaxed text-balance mb-4">{notif.message}</p>

                    <div className="flex items-center gap-4">
                      {notif.link && (
                        <Link to={notif.link} className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
                          View details
                        </Link>
                      )}
                      {!notif.read && (
                        <button onClick={() => markAsRead(notif._id)} className="text-sm font-medium text-surface-500 hover:text-surface-900 dark:hover:text-surface-50 flex items-center gap-1.5 transition-colors">
                          <Check className="w-4 h-4" /> Mark read
                        </button>
                      )}
                      <button onClick={() => deleteNotification(notif._id)} className="text-sm font-medium text-surface-400 hover:text-rose-500 flex items-center gap-1.5 ml-auto sm:ml-0 transition-colors sm:opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => fetchNotifications(p)} className={clsx("w-10 h-10 rounded-full text-sm font-medium transition-colors border", p === page ? "bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 border-transparent" : "bg-surface-50 dark:bg-surface-900 border-border text-surface-600 hover:border-surface-400")}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border border-dashed border-border rounded-[2.5rem] bg-surface-50/50 dark:bg-surface-900/50">
          <BellOff className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">All caught up</h3>
          <p className="text-surface-500">You don't have any unread notifications at the moment.</p>
        </motion.div>
      )}
    </div>
  );
}
