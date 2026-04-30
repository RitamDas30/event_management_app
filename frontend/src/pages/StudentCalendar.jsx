import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, addMonths, subMonths,
  startOfWeek, endOfWeek, isToday
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, X, CalendarDays, ArrowRight } from "lucide-react";
import clsx from "clsx";

const categoryColors = {
  Technical: { bg: "bg-brand-100 dark:bg-brand-500/20", text: "text-brand-700 dark:text-brand-300", dot: "bg-brand-500" },
  Cultural: { bg: "bg-rose-100 dark:bg-rose-500/20", text: "text-rose-700 dark:text-rose-300", dot: "bg-rose-500" },
  Sports: { bg: "bg-emerald-100 dark:bg-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  Academic: { bg: "bg-indigo-100 dark:bg-indigo-500/20", text: "text-indigo-700 dark:text-indigo-300", dot: "bg-indigo-500" },
  Social: { bg: "bg-amber-100 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
};

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function StudentCalendar() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [view, setView] = useState("month");

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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day) => registrations.filter((e) => isSameDay(e.date, day));

  const getEventPath = (eventId) => {
    if (!user) return `/events/${eventId}`;
    return user.role === "organizer" ? `/organizer/events/${eventId}` : `/student/events/${eventId}`;
  };

  const upcomingEvents = registrations
    .filter((e) => new Date(e.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="w-full">
      
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-semibold text-surface-950 dark:text-surface-50 mb-2">Calendar</h1>
          <p className="text-surface-500">
            {registrations.length} event{registrations.length !== 1 ? "s" : ""} on your schedule
          </p>
        </div>
        <div className="flex p-1 bg-surface-100 dark:bg-surface-900 rounded-xl border border-border inline-flex">
          <button
            onClick={() => setView("month")}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === "month" ? "bg-surface-50 dark:bg-surface-950 text-surface-950 dark:text-surface-50 shadow-sm" : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-50"
            )}
          >
            Month
          </button>
          <button
            onClick={() => setView("list")}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === "list" ? "bg-surface-50 dark:bg-surface-950 text-surface-950 dark:text-surface-50 shadow-sm" : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-50"
            )}
          >
            List
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4"></div>
        </div>
      ) : view === "month" ? (
        
        /* ============ MONTH VIEW ============ */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6 bg-surface-50 dark:bg-surface-900 border border-border p-4 rounded-2xl">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl border border-border bg-surface-100 dark:bg-surface-800 text-surface-600 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-surface-950 dark:text-surface-50">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <button onClick={() => setCurrentMonth(new Date())} className="text-xs font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400 hover:text-brand-700 mt-1">
                Today
              </button>
            </div>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl border border-border bg-surface-100 dark:bg-surface-800 text-surface-600 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Grid */}
            <div className="flex-1 bg-surface-50 dark:bg-surface-900 rounded-[2rem] border border-border overflow-hidden shadow-surface">
              <div className="grid grid-cols-7 border-b border-border bg-surface-100/50 dark:bg-surface-950/50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-4 text-center text-xs font-medium tracking-wider uppercase text-surface-500">
                    {d}
                  </div>
                ))}
              </div>

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
                      className={clsx(
                        "min-h-[120px] p-3 border-b border-r border-border/50 text-left transition-all relative group",
                        !inMonth ? "bg-surface-100/50 dark:bg-surface-950/50" : "bg-surface-50 dark:bg-surface-900",
                        isSelected ? "bg-brand-50/50 dark:bg-brand-500/10 ring-2 ring-brand-500 ring-inset z-10" : "hover:bg-surface-100 dark:hover:bg-surface-800"
                      )}
                    >
                      <div className={clsx(
                        "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium mb-2 transition-colors",
                        today ? "bg-brand-600 text-white shadow-glow" : inMonth ? "text-surface-900 dark:text-surface-100" : "text-surface-400"
                      )}>
                        {format(day, "d")}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => {
                          const cat = categoryColors[event.category] || categoryColors.Technical;
                          return (
                            <div key={event._id} className={clsx("text-[10px] font-medium truncate px-2 py-1 rounded-md transition-colors", cat.bg, cat.text)}>
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] font-medium text-surface-500 px-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Panel */}
            <div className="lg:w-80 shrink-0">
              <div className="sticky top-24 bg-surface-50 dark:bg-surface-900 rounded-[2rem] border border-border p-6 shadow-surface min-h-[300px]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                  <h3 className="font-semibold text-xl text-surface-950 dark:text-surface-50">
                    {selectedDay ? format(selectedDay, "MMMM d") : "Agenda"}
                  </h3>
                  {selectedDay && (
                    <button onClick={() => setSelectedDay(null)} className="p-1.5 bg-surface-100 dark:bg-surface-800 rounded-full text-surface-400 hover:text-surface-900 dark:hover:text-surface-50 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {!selectedDay ? (
                  <div className="text-center py-12">
                    <Calendar className="w-8 h-8 text-surface-300 mx-auto mb-3" />
                    <p className="text-sm text-surface-500">Select a date to view its itinerary.</p>
                  </div>
                ) : selectedDayEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDayEvents.map((event) => {
                      const cat = categoryColors[event.category] || categoryColors.Technical;
                      return (
                        <Link key={event._id} to={getEventPath(event._id)} className="block p-4 rounded-2xl bg-surface-100 dark:bg-surface-950 border border-border hover:border-brand-500/30 transition-colors group">
                          <div className="flex items-start gap-3 mb-2">
                            <div className={clsx("w-2 h-2 rounded-full mt-1.5 shrink-0", cat.dot)} />
                            <div>
                              <p className="text-sm font-semibold text-surface-900 dark:text-surface-50 group-hover:text-brand-600 transition-colors">{event.title}</p>
                              <div className="flex flex-col gap-1 mt-2 text-xs text-surface-500">
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{format(event.date, "h:mm a")}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{event.venueName || "Online"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <span className={clsx("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full", event.registrationStatus === "registered" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
                              {event.registrationStatus === "registered" ? "Confirmed" : "Waitlisted"}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-surface-500 text-center py-12">No events scheduled.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ============ LIST VIEW ============ */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl">
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event, idx) => {
                const cat = categoryColors[event.category] || categoryColors.Technical;
                const showDateHeader = idx === 0 || format(event.date, "yyyy-MM-dd") !== format(upcomingEvents[idx - 1].date, "yyyy-MM-dd");

                return (
                  <div key={event._id}>
                    {showDateHeader && (
                      <div className="flex items-center gap-3 mb-3 mt-8 first:mt-0 px-2">
                        <CalendarDays className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500">
                          {isToday(event.date) ? "Today" : format(event.date, "EEEE, MMMM d")}
                        </h3>
                      </div>
                    )}
                    <Link to={getEventPath(event._id)} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-border p-5 hover:shadow-surface hover:border-brand-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={clsx("w-1.5 h-12 rounded-full", cat.dot)} />
                        <div className="w-14 text-center">
                          <div className="text-2xl font-semibold text-surface-950 dark:text-surface-50 leading-none mb-1">{format(event.date, "d")}</div>
                          <div className="text-[10px] font-medium text-surface-500 uppercase tracking-widest leading-none">{format(event.date, "MMM")}</div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6 mt-2 sm:mt-0">
                        <p className="text-base font-medium text-surface-950 dark:text-surface-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors mb-1.5">{event.title}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-surface-500">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{format(event.date, "h:mm a")}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{event.venueName || "Online"}</span>
                          <span className={clsx("px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider", cat.bg, cat.text)}>
                            {event.category}
                          </span>
                        </div>
                      </div>
                      <div className="hidden sm:flex shrink-0">
                        <span className={clsx("text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider", event.registrationStatus === "registered" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
                          {event.registrationStatus === "registered" ? "Confirmed" : "Waitlisted"}
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-32 border border-dashed border-border rounded-[2.5rem] bg-surface-50/50 dark:bg-surface-900/50">
              <Calendar className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">Schedule is clear</h3>
              <p className="text-surface-500 mb-6">You don't have any upcoming events in your itinerary.</p>
              <Link to={user?.role === "student" ? "/student/explore" : "/explore"} className="inline-flex items-center justify-center gap-2 bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 px-6 py-3 rounded-full text-sm font-medium hover:scale-105 transition-transform shadow-sm">
                Discover Events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
