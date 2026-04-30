import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import EventCard from "../components/EventCard";
import socket from "../utils/socket";
import { Search, SlidersHorizontal, X, LayoutGrid, List } from "lucide-react";
import clsx from "clsx";

const CATEGORIES = ["Technical", "Cultural", "Sports", "Academic", "Social"];

export default function Explore() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regMap, setRegMap] = useState({});
  const [savedSet, setSavedSet] = useState(new Set());
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get("/events", { params });
      setEvents(res.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const [regsRes, savedRes] = await Promise.all([
          api.get("/registrations/me").catch(() => ({ data: [] })),
          api.get("/saved-events").catch(() => ({ data: [] })),
        ]);
        const map = {};
        regsRes.data.forEach((r) => {
          if (r.event?._id) map[r.event._id] = r.status;
        });
        setRegMap(map);
        setSavedSet(new Set(savedRes.data.map((e) => e._id)));
      } catch (err) {
        // Non-critical
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    const handleUpdate = () => fetchEvents();
    socket.on("eventUpdated", handleUpdate);
    socket.on("registrationCreated", handleUpdate);
    socket.on("promotion", handleUpdate);
    return () => {
      socket.off("eventUpdated", handleUpdate);
      socket.off("registrationCreated", handleUpdate);
      socket.off("promotion", handleUpdate);
    };
  }, [search, category]);

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    setSearchParams(params, { replace: true });
  }, [search, category, setSearchParams]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
  };

  const activeFilterCount = [search, category].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24 transition-colors">
      
      {/* Header */}
      <div className="mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-semibold text-5xl lg:text-6xl text-surface-950 dark:text-surface-50 tracking-tight"
        >
          Explore <span className="italic text-brand-600 dark:text-brand-400">Events</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-lg text-surface-500 max-w-xl"
        >
          Discover experiences crafted for the curious and the creative.
        </motion.p>
      </div>

      {/* Control Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, description, or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-surface-50 dark:bg-surface-900 border border-border rounded-2xl text-base text-surface-900 dark:text-surface-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition-all shadow-sm"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-200 dark:bg-surface-700 rounded-full flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-surface-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "flex items-center gap-2 px-6 py-4 rounded-2xl border transition-all text-sm font-medium shadow-sm active:scale-95",
              showFilters || category
                ? "bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20 text-brand-700 dark:text-brand-300"
                : "bg-surface-50 dark:bg-surface-900 border-border text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {category && <span className="w-2 h-2 rounded-full bg-brand-500 ml-1" />}
          </button>
        </div>
      </motion.div>

      {/* Expandable Filter Area */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-surface-50 dark:bg-surface-900 border border-border rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold tracking-wider uppercase text-surface-900 dark:text-surface-50">Filter by Category</span>
                {(search || category) && (
                  <button onClick={clearFilters} className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700">
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setCategory("")}
                  className={clsx(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 border",
                    !category
                      ? "bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 border-transparent"
                      : "bg-transparent border-border text-surface-600 dark:text-surface-400 hover:border-surface-400"
                  )}
                >
                  All
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(category === cat ? "" : cat)}
                    className={clsx(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 border",
                      category === cat
                        ? "bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 border-transparent"
                        : "bg-transparent border-border text-surface-600 dark:text-surface-400 hover:border-surface-400"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4"></div>
          <p className="text-surface-500 font-medium">Curating events...</p>
        </div>
      ) : events.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {events.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              refresh={fetchEvents}
              initialRegStatus={regMap[event._id] || null}
              initialSaved={savedSet.has(event._id)}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 px-4 border border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-2xl font-semibold text-surface-900 dark:text-surface-50 mb-2">No matching events</h3>
          <p className="text-surface-500 max-w-sm mx-auto mb-6">We couldn't find anything matching your current filters. Try adjusting your search criteria.</p>
          {(search || category) && (
            <button onClick={clearFilters} className="px-6 py-3 bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 rounded-full font-medium hover:scale-105 active:scale-95 transition-all">
              Clear filters
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
