import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Search, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const categories = ["Technical", "Cultural", "Sports", "Academic", "Social"];

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEvents = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get("/admin/events", { params });
      setEvents(res.data.events);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
      setPage(p);
    } catch (err) {
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1);
  }, [search, category]);

  const handleDelete = async (eventId, title) => {
    if (!confirm(`Delete event "${title}"? This will remove all registrations too.`)) return;
    try {
      await api.delete(`/admin/events/${eventId}`);
      toast.success("Event deleted");
      fetchEvents(page);
    } catch (err) {
      toast.error("Failed to delete event");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Moderation</h1>
          <p className="text-sm text-gray-600 mt-1">{total} total events</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Event</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Organizer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Registrations</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td colSpan={7} className="py-4 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td>
                  </tr>
                ))
              ) : events.length > 0 ? (
                events.map((event) => (
                  <tr key={event._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link to={`/events/${event._id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {event.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{event.organizer?.name || "Unknown"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{event.category}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{new Date(event.startTime).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-600">{event.capacity - event.seatsAvailable}/{event.capacity}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        new Date(event.startTime) > new Date() ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"
                      }`}>
                        {new Date(event.startTime) > new Date() ? "Upcoming" : "Completed"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/events/${event._id}`} className="p-1.5 text-gray-400 hover:text-blue-600" title="View">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(event._id, event.title)} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500">No events found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <button onClick={() => fetchEvents(page - 1)} disabled={page <= 1} className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button onClick={() => fetchEvents(page + 1)} disabled={page >= totalPages} className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-50">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
