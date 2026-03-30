import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  isPast,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  X,
  CalendarDays,
} from "lucide-react";

const categoryColors = {
  Technical: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  Cultural: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  Sports: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  Academic: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  Social: { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
};

export default function StudentCalendar() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [view, setView] = useState("month"); // month | list

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/registrations/me");
        const events = res.data
          .filter((r) => r.event && r.status !== "cancelled")
          .map((r) => ({
            ...r.event,
            registrationStatus: r.status,
            date: new Date(r.event.startTime),
          }));
        setRegistrations(events);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calendar grid: fill start/end with neighboring month days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day) =>
    registrations.filter((e) => isSameDay(e.date, day));

  const getEventPath = (eventId) => {
    if (!user) return `/events/${eventId}`;
    return user.role === "organizer"
      ? `/organizer/events/${eventId}`
      : `/student/events/${eventId}`;
  };

  // Upcoming events for list view
  const upcomingEvents = registrations
    .filter((e) => new Date(e.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">
            {registrations.length} event{registrations.length !== 1 ? "s" : ""} on your schedule
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              view === "month" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              view === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : view === "month" ? (
        /* ============ MONTH VIEW ============ */
        <div>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Today
              </button>
            </div>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                    className={`min-h-[90px] p-2 border-b border-r border-gray-100 text-left transition hover:bg-blue-50/50 ${
                      !inMonth ? "bg-gray-50/50" : ""
                    } ${isSelected ? "bg-blue-50 ring-2 ring-blue-500 ring-inset z-10" : ""}`}
                  >
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                        today
                          ? "bg-blue-600 text-white"
                          : inMonth
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {format(day, "d")}
                    </div>

                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((event) => {
                        const cat = categoryColors[event.category] || categoryColors.Technical;
                        return (
                          <div
                            key={event._id}
                            className={`text-[10px] font-medium truncate px-1.5 py-0.5 rounded ${cat.bg} ${cat.text}`}
                          >
                            {event.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-gray-500 px-1.5">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Detail Panel */}
          {selectedDay && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">
                  {format(selectedDay, "EEEE, MMMM d, yyyy")}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedDayEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayEvents.map((event) => {
                    const cat = categoryColors[event.category] || categoryColors.Technical;
                    return (
                      <Link
                        key={event._id}
                        to={getEventPath(event._id)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${cat.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(event.date, "h:mm a")}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.venueName || "TBD"}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          event.registrationStatus === "registered"
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600"
                        }`}>
                          {event.registrationStatus === "registered" ? "Confirmed" : "Waitlisted"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No events on this day</p>
              )}
            </div>
          )}

          {/* Category Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(categoryColors).map(([name, colors]) => (
              <div key={name} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <span className="text-xs text-gray-600">{name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ============ LIST VIEW ============ */
        <div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event, idx) => {
                const cat = categoryColors[event.category] || categoryColors.Technical;
                const showDateHeader =
                  idx === 0 ||
                  format(event.date, "yyyy-MM-dd") !==
                    format(upcomingEvents[idx - 1].date, "yyyy-MM-dd");

                return (
                  <div key={event._id}>
                    {showDateHeader && (
                      <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-700">
                          {isToday(event.date)
                            ? "Today"
                            : format(event.date, "EEEE, MMMM d")}
                        </h3>
                      </div>
                    )}
                    <Link
                      to={getEventPath(event._id)}
                      className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition"
                    >
                      <div className={`w-1 h-14 rounded-full flex-shrink-0 ${cat.dot}`} />
                      <div className="w-14 text-center flex-shrink-0">
                        <div className="text-2xl font-bold text-gray-900">{format(event.date, "d")}</div>
                        <div className="text-xs text-gray-500 uppercase">{format(event.date, "MMM")}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(event.date, "h:mm a")}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.venueName || "TBD"}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cat.bg} ${cat.text}`}>
                            {event.category}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                        event.registrationStatus === "registered"
                          ? "bg-green-50 text-green-600"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {event.registrationStatus === "registered" ? "Confirmed" : "Waitlisted"}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No upcoming events</h3>
              <p className="text-gray-500 mt-2">Register for events to see them here</p>
              <Link
                to={user?.role === "student" ? "/student/explore" : "/explore"}
                className="mt-4 inline-block text-sm font-medium text-blue-600"
              >
                Browse Events
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
