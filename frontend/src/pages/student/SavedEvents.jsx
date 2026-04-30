import { useState, useEffect } from "react";
import api from "../../api/axios";
import EventCard from "../../components/EventCard";
import { Bookmark, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export default function SavedEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const res = await api.get("/saved-events");
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50">Saved Events</h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">Events you've bookmarked for later</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-4 animate-pulse">
              <div className="h-40 bg-surface-200 dark:bg-surface-800 rounded-lg mb-3"></div>
              <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-surface-200 dark:bg-surface-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event._id} event={event} refresh={fetchSaved} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Bookmark className="w-16 h-16 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No saved events</h3>
          <p className="text-surface-500 mt-2">
            Browse events and bookmark the ones you're interested in
          </p>
          <Link
            to="/explore"
            className="mt-4 inline-block text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-300"
          >
            Explore Events
          </Link>
        </div>
      )}
    </div>
  );
}
