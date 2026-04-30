import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { CalendarDays, Ticket, Clock, ArrowRight, TrendingUp, Search } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

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
  const upcomingEvents = activeRegs.filter((r) => r.event && new Date(r.event.startTime) > new Date()).sort((a, b) => new Date(a.event.startTime) - new Date(b.event.startTime));
  const pastEvents = activeRegs.filter((r) => r.event && new Date(r.event.startTime) <= new Date());

  const stats = [
    { title: "Confirmed Tickets", value: activeRegs.length, icon: Ticket, link: "/student/my-events" },
    { title: "Upcoming Events", value: upcomingEvents.length, icon: CalendarDays, link: "/student/calendar" },
    { title: "Waitlisted", value: waitlisted.length, icon: Clock, link: "/student/my-events" },
    { title: "Events Attended", value: pastEvents.length, icon: TrendingUp, link: "/student/my-events" },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-10">
        <h1 className="text-3xl font-semibold text-surface-950 dark:text-surface-50 mb-2">
          Dashboard
        </h1>
        <p className="text-surface-500">Welcome back, {user?.name?.split(" ")[0]}. Here's your event itinerary.</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-50 dark:bg-surface-900 border border-border rounded-2xl p-6 h-32 animate-pulse" />
          ))
        ) : (
          stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div key={idx} variants={fadeUp}>
                <Link to={stat.link} className="block bg-surface-50 dark:bg-surface-900 border border-border rounded-2xl p-6 hover:shadow-surface hover:-translate-y-1 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-surface-500 group-hover:text-surface-900 dark:group-hover:text-surface-50 transition-colors">{stat.title}</span>
                    <Icon className="w-4 h-4 text-surface-400 group-hover:text-brand-500 transition-colors" />
                  </div>
                  <p className="text-3xl font-semibold text-surface-950 dark:text-surface-50">{stat.value}</p>
                </Link>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Upcoming Schedule */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="lg:col-span-2">
          <div className="bg-surface-50 dark:bg-surface-900 border border-border rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <h2 className="text-lg font-medium text-surface-950 dark:text-surface-50">Upcoming Schedule</h2>
              <Link to="/student/my-events" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 group">
                All Tickets <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-100 dark:bg-surface-800 rounded-2xl animate-pulse" />)}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((reg) => {
                  const eventDate = new Date(reg.event.startTime);
                  const isOnline = reg.event.eventMode === "online" || reg.event.eventMode === "hybrid";
                  
                  return (
                    <Link key={reg._id} to={`/events/${reg.event._id}`} className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-border bg-surface-50 dark:bg-surface-950 hover:border-brand-500/30 transition-colors">
                      <div className="w-14 h-14 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex flex-col items-center justify-center text-center flex-shrink-0 group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10 group-hover:border-brand-200 dark:group-hover:border-brand-500/20 transition-colors">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-brand-600 dark:text-brand-400 leading-none mb-1">
                          {eventDate.toLocaleDateString(undefined, { month: "short" })}
                        </span>
                        <span className="text-lg font-bold text-surface-950 dark:text-surface-50 leading-none">
                          {eventDate.getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-medium text-surface-950 dark:text-surface-50 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{reg.event.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-surface-500">{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-700" />
                          <span className="text-xs text-surface-500 truncate max-w-[200px]">{reg.event.venueName}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-500/20">Confirmed</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-6 bg-surface-100/50 dark:bg-surface-950/50 rounded-2xl border border-dashed border-border">
                <Search className="w-8 h-8 text-surface-400 mx-auto mb-3" />
                <p className="text-surface-900 dark:text-surface-50 font-medium mb-1">Schedule is clear</p>
                <p className="text-sm text-surface-500 mb-4">You have no upcoming events registered.</p>
                <Link to="/explore" className="inline-flex items-center justify-center gap-2 bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 px-5 py-2.5 rounded-full text-sm font-medium hover:scale-105 transition-transform shadow-sm">
                  Discover Events
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions / Recent Activity side panel */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="lg:col-span-1 space-y-8">
          
          <div className="bg-brand-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-glow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="font-semibold text-2xl mb-2 relative z-10">Discover</h3>
            <p className="text-brand-100 text-sm mb-6 relative z-10 text-balance">Expand your horizons. Find technical workshops, cultural fests, and more.</p>
            <Link to="/explore" className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 w-full py-3 rounded-xl text-sm font-semibold hover:bg-brand-50 transition-colors relative z-10 shadow-sm">
              Browse Catalog
            </Link>
          </div>

          <div className="bg-surface-50 dark:bg-surface-900 border border-border rounded-3xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 mb-4">Waitlist Status</h3>
            {waitlisted.length > 0 ? (
              <div className="space-y-3">
                {waitlisted.slice(0,3).map(w => (
                  <div key={w._id} className="flex items-center justify-between text-sm p-3 bg-surface-100 dark:bg-surface-950 border border-border rounded-xl">
                    <span className="truncate flex-1 font-medium text-surface-900 dark:text-surface-100">{w.event?.title || "Unknown Event"}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded">Pending</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-500 text-center py-4">No active waitlists.</p>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  );
}
