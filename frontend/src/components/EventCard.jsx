import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useState } from "react";

export default function EventCard({ event, refresh }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    if (!user) {
      setMessage("Please login to register");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/registrations/${event._id}`);
      setMessage(res.data.message);
      if (refresh) refresh(); // refresh parent after registration
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between border">
      <div>
        <img
          src={event.imageUrl || "https://via.placeholder.com/400x200"}
          alt={event.title}
          className="rounded-md w-full h-40 object-cover mb-3"
        />
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-1">
          {new Date(event.startTime).toLocaleString()} –{" "}
          {new Date(event.endTime).toLocaleTimeString()}
        </p>
        <p className="text-gray-500 text-sm mb-2">📍 {event.venue}</p>
        <p className="text-sm text-gray-700 mb-2">
          Category: <span className="font-medium">{event.category}</span>
        </p>
        <p className="text-sm">
          Seats left: <span className="font-semibold">{event.seatsAvailable}</span>
        </p>
      </div>

      {user && user.role === "student" && (
        <button
          disabled={loading}
          onClick={handleRegister}
          className="mt-3 bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      )}

      {message && (
        <p className="text-sm text-center mt-2 text-green-600">{message}</p>
      )}
    </div>
  );
}
