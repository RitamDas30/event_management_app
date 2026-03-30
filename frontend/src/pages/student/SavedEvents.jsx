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
        <h1 className="text-2xl font-bold text-gray-900">Saved Events</h1>
        <p className="text-gray-600 mt-1">Events you've bookmarked for later</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No saved events</h3>
          <p className="text-gray-500 mt-2">
            Browse events and bookmark the ones you're interested in
          </p>
          <Link
            to="/explore"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Explore Events
          </Link>
        </div>
      )}
    </div>
  );
}
