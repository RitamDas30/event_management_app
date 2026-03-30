import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import EventCard from "../components/EventCard";
import socket from "../utils/socket";
import { Search, SlidersHorizontal, X, Calendar, LayoutGrid, List } from "lucide-react";

const categories = ["Technical", "Cultural", "Sports", "Academic", "Social"];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Socket.io listeners
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
    fetchEvents();
  }, [search, category]);

  // Sync URL params
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    setSearchParams(params, { replace: true });
  }, [search, category]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
  };

  const activeFilterCount = [search, category].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explore Events</h1>
        <p className="mt-2 text-gray-600">Discover events happening around you</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="hidden sm:flex border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 transition-colors ${
                viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 transition-colors ${
                viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Category</span>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                !category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? "" : cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  category === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : events.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {events.length} event{events.length !== 1 ? "s" : ""} found
          </p>
          <div
            className={
              viewMode === "grid"
                ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {events.map((event) => (
              <EventCard key={event._id} event={event} refresh={fetchEvents} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No events found</h3>
          <p className="text-gray-500 mt-2">
            Try adjusting your search or filters
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
