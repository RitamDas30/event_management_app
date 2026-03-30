import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  CalendarDays,
  Ticket,
  Clock,
  ArrowRight,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await api.get("/registrations/me");
        setRegistrations(res.data);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  const activeRegs = registrations.filter((r) => r.status === "registered");
  const waitlisted = registrations.filter((r) => r.status === "waitlisted");
  const upcomingEvents = activeRegs.filter(
    (r) => r.event && new Date(r.event.startTime) > new Date()
  );

  const statCards = [
    {
      title: "Registered Events",
      value: activeRegs.length,
      icon: Ticket,
      color: "bg-blue-50 text-blue-600",
      link: "/student/registrations",
    },
    {
      title: "Upcoming",
      value: upcomingEvents.length,
      icon: CalendarDays,
      color: "bg-green-50 text-green-600",
      link: "/student/calendar",
    },
    {
      title: "Waitlisted",
      value: waitlisted.length,
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      link: "/student/registrations",
    },
    {
      title: "Total Attended",
      value: activeRegs.length - upcomingEvents.length,
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
      link: "/student/registrations",
    },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your events</p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">{card.title}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </Link>
            );
          })}
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          <Link
            to="/student/registrations"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map((reg) => (
              <Link
                key={reg._id}
                to={`/events/${reg.event._id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex flex-col items-center justify-center text-xs font-semibold">
                  <span>
                    {new Date(reg.event.startTime).toLocaleDateString(undefined, { day: "numeric" })}
                  </span>
                  <span className="text-[10px] uppercase">
                    {new Date(reg.event.startTime).toLocaleDateString(undefined, { month: "short" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{reg.event.title}</p>
                  <p className="text-xs text-gray-500">{reg.event.venueName}</p>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  Confirmed
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No upcoming events</p>
            <Link
              to="/explore"
              className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
