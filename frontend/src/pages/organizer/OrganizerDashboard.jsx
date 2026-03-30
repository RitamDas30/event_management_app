import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  CalendarDays,
  Users,
  PlusCircle,
  BarChart3,
  ArrowRight,
  Calendar,
  TrendingUp,
  Eye,
} from "lucide-react";

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        const myEvents = res.data.filter(
          (e) => e.organizer === user?._id || e.organizer?._id === user?._id
        );
        setEvents(myEvents);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  const upcomingEvents = events.filter((e) => new Date(e.startTime) > new Date());
  const totalSeats = events.reduce((sum, e) => sum + e.capacity, 0);
  const totalBooked = events.reduce((sum, e) => sum + (e.capacity - e.seatsAvailable), 0);

  const statCards = [
    {
      title: "Total Events",
      value: events.length,
      icon: CalendarDays,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Upcoming",
      value: upcomingEvents.length,
      icon: Calendar,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Total Registrations",
      value: totalBooked,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Fill Rate",
      value: totalSeats > 0 ? `${Math.round((totalBooked / totalSeats) * 100)}%` : "0%",
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-600 mt-1">Manage your events and track performance</p>
        </div>
        <Link
          to="/organizer/events/create"
          className="hidden sm:inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {/* Stats */}
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
              <div
                key={card.title}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">{card.title}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link
          to="/organizer/events/create"
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Create Event</p>
            <p className="text-xs text-gray-500">Start a new event</p>
          </div>
        </Link>
        <Link
          to="/organizer/events"
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">View Events</p>
            <p className="text-xs text-gray-500">Manage existing events</p>
          </div>
        </Link>
        <Link
          to="/organizer/analytics"
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Analytics</p>
            <p className="text-xs text-gray-500">View performance data</p>
          </div>
        </Link>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
          <Link
            to="/organizer/events"
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
        ) : events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <Link
                key={event._id}
                to={`/events/${event._id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex flex-col items-center justify-center text-xs font-semibold">
                  <span>
                    {new Date(event.startTime).toLocaleDateString(undefined, { day: "numeric" })}
                  </span>
                  <span className="text-[10px] uppercase">
                    {new Date(event.startTime).toLocaleDateString(undefined, { month: "short" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {event.capacity - event.seatsAvailable}/{event.capacity} registered
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    new Date(event.startTime) > new Date()
                      ? "text-green-600 bg-green-50"
                      : "text-gray-600 bg-gray-100"
                  }`}
                >
                  {new Date(event.startTime) > new Date() ? "Upcoming" : "Past"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No events yet</p>
            <Link
              to="/organizer/events/create"
              className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
