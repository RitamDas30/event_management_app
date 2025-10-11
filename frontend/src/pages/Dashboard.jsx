import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import EventCard from "../components/EventCard";
import Loader from "../components/Loader";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);

      if (user.role === "organizer") {
        const res = await api.get("/events"); // fetch all, filter client-side
        const mine = res.data.filter((e) => e.organizer._id === user.id);
        setMyEvents(mine);
      } else if (user.role === "student") {
        const res = await api.get("/registrations/me");
        const mapped = res.data.map((r) => r.event);
        setMyEvents(mapped);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      fetchMyEvents();
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold text-center mb-6">
        {user.role === "organizer" ? "My Organized Events" : "My Registered Events"}
      </h2>

      {user.role === "organizer" && (
        <div className="text-center mb-6">
          <Link
            to="/create-event"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Create New Event
          </Link>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : myEvents.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {myEvents.map((event) => (
            <div key={event._id} className="relative">
              <EventCard event={event} />
              {user.role === "organizer" && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <Link
                    to={`/edit-event/${event._id}`}
                    className="bg-yellow-400 text-black px-2 py-1 rounded text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center mt-10 text-gray-500">
          No events yet.
        </p>
      )}
    </div>
  );
}
