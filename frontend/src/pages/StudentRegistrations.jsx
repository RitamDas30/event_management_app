// src/pages/StudentRegistrations.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function StudentRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    try {
      const res = await api.get("/registrations/me");
      // 🛑 FIX: Access data directly from res.data, not res.data.registrations
      setRegistrations(res.data || []); 
      
    }  catch (err) {
      console.error(err);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading...</div>;

  if (registrations.length === 0)
    return <div className="text-center mt-10 text-gray-500">You have not registered for any events yet.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">My Event Registrations</h1>

      <div className="space-y-6">
        {registrations.map((r) => (
          <div
            key={r._id}
            className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium">{r.event?.title || "Untitled Event"}</h2>
                <p className="text-sm text-gray-500">
                  Status:{" "}
                  <span
                    className={`font-medium ${
                      r.status === "registered"
                        ? "text-green-600"
                        : r.status === "waitlisted"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  Venue: {r.event?.venue || "N/A"} | {new Date(r.event?.startTime).toLocaleString()}
                </p>
              </div>

              {r.qrCode && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={r.qrCode}
                    alt="QR Code"
                    className="w-28 h-28 border border-gray-300 rounded-lg"
                  />
                  <a
                    href={r.qrCode}
                    download={`event-${r.event?._id || "registration"}.png`}
                    className="text-blue-600 text-sm underline"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
