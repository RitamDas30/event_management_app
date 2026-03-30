import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";
import EventDeleteModal from "../../components/EventDeleteModal";
import { PlusCircle, Edit, Trash2, Calendar, Clock, Users, Eye, Search } from "lucide-react";

export default function OrganizerEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletionTarget, setDeletionTarget] = useState(null);
  const [search, setSearch] = useState("");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/events");
      const mine = res.data.filter(
        (e) => e.organizer?._id === user?.id || e.organizer === user?.id || e.organizer?._id === user?._id
      );
      setEvents(mine);
    } catch (err) {
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const filtered = search
    ? events.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    : events;

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="text-sm text-gray-600 mt-1">{events.length} total events</p>
        </div>
        <Link
          to="/organizer/events/create"
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Create Event
        </Link>
      </div>

      {/* Search */}
      {events.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search your events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((event) => {
            const booked = event.capacity - event.seatsAvailable;
            const isUpcoming = new Date(event.startTime) > new Date();
            return (
              <div key={event._id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition">
                <div className="flex-1 min-w-0">
                  <Link to={`/organizer/events/${event._id}`} className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    {event.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(event.startTime).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {booked}/{event.capacity} registered
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isUpcoming ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                      {isUpcoming ? "Upcoming" : "Past"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/organizer/events/${event._id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link to={`/organizer/events/${event._id}/edit`} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button onClick={() => setDeletionTarget(event)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            {search ? "No events match your search" : "No events yet"}
          </h3>
          <p className="text-gray-500 mt-2">Create your first event to get started</p>
          <Link to="/organizer/events/create" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600">
            <PlusCircle className="w-4 h-4" /> Create Event
          </Link>
        </div>
      )}

      {deletionTarget && (
        <EventDeleteModal
          event={deletionTarget}
          onClose={() => setDeletionTarget(null)}
          onDeleteSuccess={() => { setDeletionTarget(null); fetchEvents(); }}
        />
      )}
    </div>
  );
}
