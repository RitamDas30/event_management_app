import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Users,
  BarChart3,
  Ticket,
  Bookmark,
  Bell,
  Settings,
  UserCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Shield,
  FileText,
  Tags,
  ClipboardList,
  Compass,
  DollarSign,
} from "lucide-react";

const studentLinks = [
  { name: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
  { name: "Explore Events", path: "/student/explore", icon: Compass },
  { name: "My Events", path: "/student/my-events", icon: Ticket },
  { name: "Calendar", path: "/student/calendar", icon: CalendarDays },
  { name: "Saved Events", path: "/student/saved", icon: Bookmark },
  { name: "Notifications", path: "/student/notifications", icon: Bell },
  { name: "Profile", path: "/student/profile", icon: UserCircle },
  { name: "Settings", path: "/student/settings", icon: Settings },
];

const organizerLinks = [
  { name: "Dashboard", path: "/organizer/dashboard", icon: LayoutDashboard },
  { name: "Explore Events", path: "/organizer/explore", icon: Compass },
  { name: "My Events", path: "/organizer/events", icon: CalendarDays },
  { name: "Create Event", path: "/organizer/events/create", icon: PlusCircle },
  { name: "Analytics", path: "/organizer/analytics", icon: BarChart3 },
  { name: "Revenue", path: "/organizer/revenue", icon: DollarSign },
  { name: "Announcements", path: "/organizer/announcements", icon: Megaphone },
  { name: "Profile", path: "/organizer/profile", icon: UserCircle },
  { name: "Settings", path: "/organizer/settings", icon: Settings },
];

const adminLinks = [
  { name: "Overview", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Explore Events", path: "/admin/explore", icon: Compass },
  { name: "User Management", path: "/admin/users", icon: Users },
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

  const getLinks = () => {
    switch (user?.role) {
      case "admin":
        return adminLinks;
      case "organizer":
        return organizerLinks;
      default:
        return studentLinks;
    }
  };

  const links = getLinks();

  const getRoleLabel = () => {
    switch (user?.role) {
      case "admin":
        return "Admin Panel";
      case "organizer":
        return "Organizer";
      default:
        return "Student";
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "organizer":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 flex flex-col transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <span className="text-lg font-bold text-gray-900">Evently</span>
          </div>
        )}
        {collapsed && <Calendar className="w-6 h-6 text-blue-600 mx-auto" />}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${
            collapsed ? "mx-auto mt-0" : ""
          }`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 py-3">
          <span
            className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor()}`}
          >
            {getRoleLabel()}
          </span>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            location.pathname === link.path ||
            (link.path !== "/explore" && location.pathname.startsWith(link.path + "/"));

          return (
            <NavLink
              key={link.path}
              to={link.path}
              title={collapsed ? link.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              {!collapsed && <span>{link.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info at Bottom */}
      <div className="border-t border-gray-200 p-3">
        <div
          className={`flex items-center gap-3 px-2 py-2 rounded-lg ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
