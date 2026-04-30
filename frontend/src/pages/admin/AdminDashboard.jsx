import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  Users,
  CalendarDays,
  Shield,
  TrendingUp,
  ArrowRight,
  Activity,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => new Date(e.startTime) > new Date()).length;
  const totalRegistrations = events.reduce((sum, e) => sum + (e.capacity - e.seatsAvailable), 0);

  const statCards = [
    {
      title: "Total Events",
      value: totalEvents,
      icon: CalendarDays,
      color: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400",
      link: "/admin/events",
    },
    {
      title: "Upcoming",
      value: upcomingEvents,
      icon: Activity,
      color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      link: "/admin/events",
    },
    {
      title: "Total Registrations",
      value: totalRegistrations,
      icon: Users,
      color: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
      link: "/admin/reports",
    },
    {
      title: "Platform Health",
      value: "Good",
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
      link: "/admin/reports",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50">Admin Dashboard</h1>
        </div>
        <p className="text-surface-600 dark:text-surface-400">
          Welcome, {user?.name}. Platform overview and management tools.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-surface-600 dark:text-surface-400">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-surface-950 dark:text-surface-50">{loading ? "..." : card.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link
          to="/admin/users"
          className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-5 hover:shadow-md transition-all"
        >
          <Users className="w-6 h-6 text-brand-600 dark:text-brand-400 mb-3" />
          <h3 className="font-semibold text-surface-950 dark:text-surface-50">User Management</h3>
          <p className="text-sm text-surface-500 mt-1">Manage users, roles, and permissions</p>
        </Link>
        <Link
          to="/admin/events"
          className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-5 hover:shadow-md transition-all"
        >
          <Shield className="w-6 h-6 text-violet-600 dark:text-violet-400 mb-3" />
          <h3 className="font-semibold text-surface-950 dark:text-surface-50">Event Moderation</h3>
          <p className="text-sm text-surface-500 mt-1">Review and moderate platform events</p>
        </Link>
        <Link
          to="/admin/reports"
          className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-5 hover:shadow-md transition-all"
        >
          <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-3" />
          <h3 className="font-semibold text-surface-950 dark:text-surface-50">Reports</h3>
          <p className="text-sm text-surface-500 mt-1">View platform-wide analytics</p>
        </Link>
      </div>

      {/* Recent Events */}
      <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-950 dark:text-surface-50">Recent Events</h2>
          <Link
            to="/admin/events"
            className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-300 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">Event</th>
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">Category</th>
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">Registrations</th>
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 10).map((event) => (
                  <tr key={event._id} className="border-b border-border hover:bg-surface-100 dark:bg-surface-900/50">
                    <td className="py-3 px-3 font-medium text-surface-950 dark:text-surface-50">{event.title}</td>
                    <td className="py-3 px-3 text-surface-600 dark:text-surface-400">{event.category}</td>
                    <td className="py-3 px-3 text-surface-600 dark:text-surface-400">
                      {new Date(event.startTime).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-surface-600 dark:text-surface-400">
                      {event.capacity - event.seatsAvailable}/{event.capacity}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          new Date(event.startTime) > new Date()
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                            : "text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800"
                        }`}
                      >
                        {new Date(event.startTime) > new Date() ? "Upcoming" : "Completed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-surface-500">No events on the platform yet.</p>
        )}
      </div>
    </div>
  );
}
