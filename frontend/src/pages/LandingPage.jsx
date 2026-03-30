import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

const categories = [
  { name: "Technical", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "💻" },
  { name: "Cultural", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "🎭" },
  { name: "Sports", color: "bg-red-100 text-red-700 border-red-200", icon: "🏆" },
  { name: "Academic", color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "📚" },
  { name: "Social", color: "bg-pink-100 text-pink-700 border-pink-200", icon: "🎉" },
];

const features = [
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Get instant notifications when events are updated or seats become available.",
    color: "text-yellow-500 bg-yellow-50",
  },
  {
    icon: Shield,
    title: "Secure Registration",
    description: "QR-code based tickets with anti-abuse protections and waitlist management.",
    color: "text-blue-500 bg-blue-50",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Organizers get powerful insights into registrations, attendance, and engagement.",
    color: "text-purple-500 bg-purple-50",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Conflict detection prevents double-booking. Calendar sync keeps you on track.",
    color: "text-green-500 bg-green-50",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [stats, setStats] = useState({ events: 0, users: 0, registrations: 0 });
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get("/events");
        // Show up to 6 upcoming events sorted by date
        const upcoming = res.data
          .filter((e) => new Date(e.startTime) > new Date())
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 6);
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
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-blue-100 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              Your Campus Event Hub
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Discover & Manage
              <span className="block mt-2 text-blue-200">Events Effortlessly</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
              From tech workshops to cultural fests — find, register, and manage campus events
              in one place. Real-time updates, smart scheduling, and QR-coded tickets.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/explore"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
              >
                <Search className="w-5 h-5" />
                Explore Events
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-blue-500/30 backdrop-blur-sm text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-500/40 transition-all border border-white/20"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              {user && (
                <Link
                  to={
                    user.role === "organizer"
                      ? "/organizer/dashboard"
                      : user.role === "admin"
                      ? "/admin/dashboard"
                      : "/student/dashboard"
                  }
                  className="inline-flex items-center justify-center gap-2 bg-blue-500/30 backdrop-blur-sm text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-500/40 transition-all border border-white/20"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white">
                {stats.events}+
              </p>
              <p className="text-sm text-blue-200 mt-1">Events</p>
            </div>
            <div className="text-center border-x border-white/20">
              <p className="text-3xl sm:text-4xl font-bold text-white">500+</p>
              <p className="text-sm text-blue-200 mt-1">Students</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white">50+</p>
              <p className="text-sm text-blue-200 mt-1">Organizers</p>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#F9FAFB"
            />
          </svg>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
            <p className="mt-3 text-gray-600 max-w-lg mx-auto">
              Find events that match your interests
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/explore?category=${cat.name}`}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 ${cat.color} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-semibold">{cat.name}</span>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
              <p className="mt-2 text-gray-600">Don't miss out on these</p>
            </div>
            <Link
              to="/explore"
              className="hidden sm:inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
            >
              View all events
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingEvents ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No upcoming events</h3>
              <p className="text-gray-500 mt-2">Check back soon for new events!</p>
            </div>
          )}

          <div className="sm:hidden text-center mt-8">
            <Link
              to="/explore"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              View all events
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Evently?</h2>
            <p className="mt-3 text-gray-600 max-w-lg mx-auto">
              Built for students, organizers, and administrators
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Join hundreds of students and organizers already using Evently to discover
            and manage campus events.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/explore"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  Browse Events
                </Link>
              </>
            ) : (
              <Link
                to="/explore"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
              >
                Explore Events
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
