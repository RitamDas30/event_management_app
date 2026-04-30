import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

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
  const totalBooked = events.reduce(
    (sum, e) => sum + (e.capacity - e.seatsAvailable),
    0
  );

  const statCards = [
    { title: "Total Events", value: events.length, icon: CalendarDays, accent: "brand", link: "/organizer/events" },
    { title: "Upcoming", value: upcomingEvents.length, icon: Calendar, accent: "emerald", link: "/organizer/events" },
    { title: "Total Registrations", value: totalBooked, icon: Users, accent: "violet", link: "/organizer/analytics" },
    {
      title: "Fill Rate",
      value: totalSeats > 0 ? `${Math.round((totalBooked / totalSeats) * 100)}%` : "0%",
      icon: TrendingUp,
      accent: "amber",
      link: "/organizer/analytics",
    },
  ];

  const quickActions = [
    { title: "Create Event", desc: "Start a new event", icon: PlusCircle, to: "/organizer/events/create", accent: "brand" },
    { title: "View Events", desc: "Manage existing events", icon: Eye, to: "/organizer/events", accent: "emerald" },
    { title: "Analytics", desc: "View performance data", icon: BarChart3, to: "/organizer/analytics", accent: "violet" },
  ];

  const accentBg = {
    brand: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-semibold text-surface-950 dark:text-surface-50 mb-2">
            Welcome, {user?.name?.split(" ")[0] || "Organizer"}
          </h1>
          <p className="text-surface-500">Manage your events and track performance.</p>
        </div>
        <Button as={Link} to="/organizer/events/create" variant="primary" size="md">
          <PlusCircle className="w-4 h-4" />
          Create Event
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <motion.div key={i} variants={fadeUp}>
                <StatCard loading />
              </motion.div>
            ))
          : statCards.map((card) => (
              <motion.div key={card.title} variants={fadeUp}>
                <StatCard {...card} />
              </motion.div>
            ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid sm:grid-cols-3 gap-4 mb-10">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.div key={action.title} variants={fadeUp}>
              <Card as={Link} to={action.to} hover className="flex items-center gap-4 p-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentBg[action.accent]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-950 dark:text-surface-50">{action.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{action.desc}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Events */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <Card className="p-6 sm:p-8">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <Link
              to="/organizer/events"
              className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardHeader>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-3">
              {events.slice(0, 5).map((event) => {
                const isUpcoming = new Date(event.startTime) > new Date();
                const eventDate = new Date(event.startTime);
                return (
                  <Link
                    key={event._id}
                    to={`/organizer/events/${event._id}`}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-surface-50 dark:bg-surface-950 hover:border-brand-500/30 dark:hover:border-brand-400/30 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex flex-col items-center justify-center text-center flex-shrink-0">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-brand-600 dark:text-brand-400 leading-none mb-1">
                        {eventDate.toLocaleDateString(undefined, { month: "short" })}
                      </span>
                      <span className="text-lg font-bold text-surface-950 dark:text-surface-50 leading-none">
                        {eventDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-surface-950 dark:text-surface-50 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {event.title}
                      </p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {event.capacity - event.seatsAvailable}/{event.capacity} registered
                      </p>
                    </div>
                    <Badge tone={isUpcoming ? "success" : "neutral"}>
                      {isUpcoming ? "Upcoming" : "Past"}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No events yet"
              description="Create your first event to start tracking registrations."
              action={
                <Button as={Link} to="/organizer/events/create" variant="primary" size="md">
                  Create your first event
                </Button>
              }
            />
          )}
        </Card>
      </motion.div>
    </div>
  );
}
