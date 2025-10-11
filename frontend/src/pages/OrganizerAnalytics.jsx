// src/pages/OrganizerAnalytics.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function OrganizerAnalytics() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/events"); // fetch all events created by organizer
      const formatted = res.data.map((event) => ({
        name: event.title,
        registered: event.capacity - event.seatsAvailable,
        seatsAvailable: event.seatsAvailable,
      }));
      setAnalytics(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading analytics...</div>;

  if (analytics.length === 0)
    return <div className="text-center mt-10 text-gray-500">No event data found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Organizer Analytics</h1>

      <div className="bg-white p-4 rounded-xl shadow">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analytics}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="registered" fill="#4F46E5" name="Registered" />
            <Bar dataKey="seatsAvailable" fill="#10B981" name="Available Seats" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
