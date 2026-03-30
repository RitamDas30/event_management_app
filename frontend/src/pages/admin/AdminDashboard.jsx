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
      color: "bg-blue-50 text-blue-600",
      link: "/admin/events",
    },
    {
      title: "Upcoming",
      value: upcomingEvents,
      icon: Activity,
      color: "bg-green-50 text-green-600",
      link: "/admin/events",
    },
    {
      title: "Total Registrations",
      value: totalRegistrations,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
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
          <Shield className="w-6 h-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-gray-600">
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
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? "..." : card.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link
          to="/admin/users"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
        >
          <Users className="w-6 h-6 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-500 mt-1">Manage users, roles, and permissions</p>
        </Link>
        <Link
          to="/admin/events"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
        >
          <Shield className="w-6 h-6 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Event Moderation</h3>
          <p className="text-sm text-gray-500 mt-1">Review and moderate platform events</p>
        </Link>
        <Link
          to="/admin/reports"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
        >
          <TrendingUp className="w-6 h-6 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Reports</h3>
          <p className="text-sm text-gray-500 mt-1">View platform-wide analytics</p>
        </Link>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
          <Link
            to="/admin/events"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Event</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Category</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Registrations</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 10).map((event) => (
                  <tr key={event._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{event.title}</td>
                    <td className="py-3 px-3 text-gray-600">{event.category}</td>
                    <td className="py-3 px-3 text-gray-600">
                      {new Date(event.startTime).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {event.capacity - event.seatsAvailable}/{event.capacity}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          new Date(event.startTime) > new Date()
                            ? "text-green-600 bg-green-50"
                            : "text-gray-600 bg-gray-100"
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
          <p className="text-center py-8 text-gray-500">No events on the platform yet.</p>
        )}
      </div>
    </div>
  );
}
