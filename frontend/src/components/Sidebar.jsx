import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  LayoutDashboard, CalendarDays, PlusCircle, Users, BarChart3,
  Ticket, Bookmark, Bell, Settings, UserCircle, Calendar,
  ChevronLeft, ChevronRight, Megaphone, Shield, FileText,
  Tags, Compass, Radio
} from "lucide-react";
import clsx from "clsx";

const studentLinks = [
  { name: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
  { name: "Explore", path: "/student/explore", icon: Compass },
  { name: "My Tickets", path: "/student/my-events", icon: Ticket },
  { name: "Live Events", path: "/student/live", icon: Radio },
  { name: "Calendar", path: "/student/calendar", icon: CalendarDays },
  { name: "Saved", path: "/student/saved", icon: Bookmark },
  { name: "Notifications", path: "/student/notifications", icon: Bell },
  { name: "Settings", path: "/student/settings", icon: Settings },
];

const organizerLinks = [
  { name: "Overview", path: "/organizer/dashboard", icon: LayoutDashboard },
  { name: "My Events", path: "/organizer/events", icon: CalendarDays, liveIndicator: true },
  { name: "Create Event", path: "/organizer/events/create", icon: PlusCircle },
  { name: "Explore", path: "/organizer/explore", icon: Compass },
  { name: "Analytics", path: "/organizer/analytics", icon: BarChart3 },
  { name: "Announcements", path: "/organizer/announcements", icon: Megaphone },
  { name: "Settings", path: "/organizer/settings", icon: Settings },
];

const adminLinks = [
  { name: "Overview", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Explore", path: "/admin/explore", icon: Compass },
  { name: "Live Monitoring", path: "/admin/live", icon: Radio },
  { name: "Users", path: "/admin/users", icon: Users },
  { name: "Event Moderation", path: "/admin/events", icon: Shield },
  { name: "Categories", path: "/admin/categories", icon: Tags },
  { name: "Reports", path: "/admin/reports", icon: BarChart3 },
  { name: "Announcements", path: "/admin/announcements", icon: Megaphone },
  { name: "Audit Log", path: "/admin/audit", icon: FileText },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const [hasLiveEvent, setHasLiveEvent] = useState(false);

  useEffect(() => {
    if (user?.role !== "organizer") return;
    const checkLive = async () => {
      try {
        const res = await api.get("/events");
        const now = new Date();
        const mine = res.data.filter(e => e.organizer?._id === user.id || e.organizer === user.id);
        const live = mine.some(e => {
          const isOnline = e.eventMode === "online" || e.eventMode === "hybrid";
          const earlyStart = new Date(new Date(e.startTime).getTime() - 15 * 60000);
          return isOnline && now >= earlyStart && now <= new Date(e.endTime);
        });
        setHasLiveEvent(live);
      } catch {}
    };
    checkLive();
    const interval = setInterval(checkLive, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const links = user?.role === "admin" ? adminLinks : user?.role === "organizer" ? organizerLinks : studentLinks;
  
  const RoleBadge = () => {
    if (collapsed) return null;
    const colors = {
      admin: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
      organizer: "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20",
      student: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
    };
    const c = colors[user?.role] || colors.student;
    
    return (
      <div className="px-4 py-4 mt-2">
        <div className={clsx("px-3 py-1.5 rounded-md border text-[11px] font-semibold tracking-widest uppercase inline-flex items-center", c)}>
          <span className={clsx("w-1.5 h-1.5 rounded-full mr-2", user?.role==="admin"?"bg-rose-500":user?.role==="organizer"?"bg-brand-500":"bg-emerald-500")} />
          {user?.role || "Student"}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={clsx(
        "h-screen bg-surface-50 dark:bg-surface-950 border-r border-border flex flex-col transition-all duration-300 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className={clsx("flex items-center h-16 border-b border-border transition-all", collapsed ? "justify-center" : "justify-between px-4")}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-md bg-surface-950 dark:bg-surface-50 flex items-center justify-center">
              <span className="font-semibold text-lg text-surface-50 dark:text-surface-950 leading-none mt-0.5">E</span>
            </div>
            <span className="font-medium tracking-tight text-surface-950 dark:text-surface-50">Evently</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-md bg-surface-950 dark:bg-surface-50 flex items-center justify-center">
            <span className="font-semibold text-lg text-surface-50 dark:text-surface-950 leading-none mt-0.5">E</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={clsx(
            "p-1.5 rounded-md text-surface-400 hover:text-surface-900 dark:hover:text-surface-50 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors",
            collapsed && "absolute -right-3 top-16 bg-surface-50 dark:bg-surface-950 border border-border shadow-sm rounded-full w-6 h-6 flex items-center justify-center p-0"
          )}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <RoleBadge />

      {/* Nav */}
      <nav className={clsx("flex-1 overflow-y-auto py-2 space-y-0.5", collapsed ? "px-2 pt-6" : "px-3")}>
        {links.map((link) => {
          const Icon = link.icon;
          const exact = location.pathname === link.path;
          const prefix = link.path !== "/explore" && location.pathname.startsWith(link.path + "/");
          const moreSpecific = links.some(
            (o) =>
              o.path !== link.path &&
              o.path.startsWith(link.path + "/") &&
              (location.pathname === o.path || location.pathname.startsWith(o.path + "/"))
          );
          const active = exact || (prefix && !moreSpecific);
          const showLiveDot = link.liveIndicator && hasLiveEvent;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              title={collapsed ? link.name : undefined}
              className={clsx(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group outline-none",
                active ? "text-surface-950 dark:text-surface-50" : "text-surface-500 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-800/50"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-surface-200 dark:bg-surface-800 rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {active && !collapsed && (
                <motion.div layoutId="sidebar-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-surface-950 dark:bg-surface-50 rounded-r-full" />
              )}

              <div className="relative flex-shrink-0">
                <Icon className={clsx("w-4 h-4 transition-colors", active ? "text-surface-950 dark:text-surface-50" : "text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300")} />
                {showLiveDot && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-surface-50 dark:border-surface-950" />}
              </div>
              
              {!collapsed && <span className="flex-1 truncate">{link.name}</span>}
              {!collapsed && showLiveDot && <span className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">LIVE</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className={clsx("p-3 border-t border-border", collapsed ? "flex justify-center" : "")}>
        <div className={clsx("flex items-center gap-3 rounded-xl transition-colors", !collapsed && "px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer")}>
          <div className="w-8 h-8 rounded-lg bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 flex items-center justify-center text-sm font-semibold border border-border flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-surface-950 dark:text-surface-50 truncate leading-none mb-1">{user?.name}</p>
              <p className="text-xs text-surface-500 truncate leading-none">{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
