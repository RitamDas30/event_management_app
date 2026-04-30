import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import EventCard from "../components/EventCard";
import {
  Calendar,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  Search,
  Zap,
  Shield,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const CATEGORIES = [
  { name: "Technical", icon: "💻" },
  { name: "Cultural", icon: "🎭" },
  { name: "Sports", icon: "🏆" },
  { name: "Academic", icon: "📚" },
  { name: "Social", icon: "🎉" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Instant notifications for seat availability and schedule shifts.",
  },
  {
    icon: Shield,
    title: "Secure Access",
    description: "QR-code tickets with automated waitlist management.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Insights into registrations, attendance, and audience engagement.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Zero conflict double-bookings with seamless calendar sync.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function LandingPage() {
  const { user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [stats, setStats] = useState({ events: 0, users: 0, registrations: 0 });
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Mouse spotlight effect on hero
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get("/events");
        const upcoming = res.data
          .filter((e) => new Date(e.startTime) > new Date())
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 3);
        setFeaturedEvents(upcoming);
        setStats((prev) => ({ ...prev, events: res.data.length }));
      } catch (err) {
        console.error("Failed to fetch events:", err.message);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-20 px-6 lg:px-12 bg-aurora overflow-hidden">
        {/* Spotlight */}
        <div
          className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`,
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 w-full max-w-5xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-soft bg-surface-50/50 dark:bg-surface-900/50 backdrop-blur-md text-xs font-medium uppercase tracking-widest text-surface-600 dark:text-surface-300">
              <Sparkles className="w-3.5 h-3.5" /> Event Management, Redefined
            </span>
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="font-semibold text-6xl sm:text-7xl lg:text-8xl text-surface-950 dark:text-surface-50 leading-[1.1] tracking-tight mb-8 text-balance mx-auto">
            Design your <span className="italic font-light text-brand-600 dark:text-brand-400">experiences</span> with intention.
          </motion.h1>
          
          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto leading-relaxed mb-12 text-balance">
            A premium platform to discover, orchestrate, and manage events. Built for forward-thinking campuses and creative communities.
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/explore"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-950 text-surface-50 hover:bg-surface-800 dark:bg-surface-50 dark:text-surface-950 dark:hover:bg-surface-200 px-8 py-4 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
            >
              Explore Events <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-50 text-surface-900 border-soft hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-50 dark:hover:bg-surface-800 px-8 py-4 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95"
              >
                Create Account
              </Link>
            )}
            {user && (
              <Link
                to={user.role === "organizer" ? "/organizer/dashboard" : user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-50 text-surface-900 border-soft hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-50 dark:hover:bg-surface-800 px-8 py-4 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95"
              >
                Enter Dashboard
              </Link>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <motion.div variants={fadeUp} className="max-w-2xl">
              <h2 className="font-semibold text-4xl lg:text-5xl text-surface-950 dark:text-surface-50 mb-4">Curated Events</h2>
              <p className="text-surface-500 text-lg">Hand-picked gatherings happening around you.</p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors group">
                View catalog <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {loadingEvents ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event) => (
                <motion.div variants={fadeUp} key={event._id}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-surface-100/50 dark:bg-surface-900/50 rounded-3xl border-soft">
              <Calendar className="w-8 h-8 text-surface-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">Quiet right now</h3>
              <p className="text-surface-500 mt-2">No upcoming events found. Check back later.</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Philosophy / Features */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-surface-100/50 dark:bg-surface-900/50 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mb-20 text-center max-w-3xl mx-auto"
          >
            <motion.h2 variants={fadeUp} className="font-semibold text-4xl lg:text-5xl text-surface-950 dark:text-surface-50 mb-6 text-balance">
              Engineered for absolute clarity.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-surface-500 text-lg leading-relaxed">
              We removed the friction from event management, leaving only what matters: the experience.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  className="group relative"
                >
                  <div className="mb-6 inline-flex w-12 h-12 rounded-2xl items-center justify-center bg-surface-50 dark:bg-surface-800 border-soft shadow-surface group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <Icon className="w-5 h-5 text-surface-950 dark:text-surface-50" />
                  </div>
                  <h3 className="text-xl font-medium text-surface-950 dark:text-surface-50 mb-3">{feature.title}</h3>
                  <p className="text-surface-500 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeUp} className="font-semibold text-3xl lg:text-4xl text-center text-surface-950 dark:text-surface-50 mb-16">
            Find your crowd
          </motion.h2>
          
          <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
            {CATEGORIES.map((cat, idx) => (
              <motion.div variants={fadeUp} key={cat.name}>
                <Link
                  to={`/explore?category=${cat.name}`}
                  className="flex items-center gap-3 px-6 py-4 rounded-full border-soft bg-surface-50 dark:bg-surface-900 hover:border-surface-300 dark:hover:border-surface-600 transition-all duration-300 hover:shadow-md"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium text-surface-900 dark:text-surface-50 text-sm tracking-wide">{cat.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Footer */}
      <section className="py-32 px-6 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-2xl mx-auto"
        >
          <motion.h2 variants={fadeUp} className="font-semibold text-5xl lg:text-6xl text-surface-950 dark:text-surface-50 mb-8">
            Ready to shape the culture?
          </motion.h2>
          <motion.div variants={fadeUp}>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white hover:bg-brand-500 px-10 py-5 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-glow-lg text-lg"
            >
              Start for free
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
