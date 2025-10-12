import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import UnenrollmentModal from "../components/UnenrollmentModal"; 

export default function StudentRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellationTarget, setCancellationTarget] = useState(null); 

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      // Endpoint is '/api/registrations/me' via global axios config
      const res = await api.get("/registrations/me"); 
      // Access data directly from res.data
      setRegistrations(res.data || []); 
    } catch (err) {
      console.error(err);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleUnenrollmentSuccess = () => {
    fetchRegistrations(); // Refresh the list to reflect the seat swap/cancellation
  };


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
              <div className="flex-1">
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
              
              <div className="flex flex-col items-end gap-2">
                {/* QR Code Display Logic */}
                {r.qrCode && (
                  <div className="flex flex-col items-center gap-2">
                    {/* 🛑 QR CODE DISPLAY WITH CANCELLATION WATERMARK */}
                    {r.status === "cancelled" ? (
                        <div className="relative">
                            <img
                                src={r.qrCode}
                                alt="Expired QR Code"
                                // Apply grayscale and opacity for 'Expired' look
                                className="w-28 h-28 border border-gray-300 rounded-lg grayscale opacity-50"
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-red-600 font-bold text-xs bg-black bg-opacity-40 rounded-lg">
                                EXPIRED
                            </span>
                        </div>
                    ) : (
                        // Normal QR display
                        <img
                            src={r.qrCode}
                            alt="QR Code"
                            className="w-28 h-28 border border-gray-300 rounded-lg"
                        />
                    )}
                    
                    {/* 🛑 DOWNLOAD LINK DISABLING */}
                    {r.status !== "cancelled" ? (
                        <a
                            href={r.qrCode}
                            download={`ticket-${r.event?._id || "registration"}.png`}
                            className="text-blue-600 text-sm underline hover:text-blue-800"
                        >
                            Download Ticket
                        </a>
                    ) : (
                        <span className="text-sm text-red-500">Ticket Expired</span>
                    )}
                  </div>
                )}
                
                {/* UNREGISTER BUTTON (Only available if status is active) */}
                {(r.status === "registered" || r.status === "waitlisted") && (
                    <button
                        onClick={() => setCancellationTarget(r.event)} // Open modal, passing event data
                        className="mt-2 text-sm text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1 rounded transition duration-150"
                    >
                        Unregister
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* UNENROLLMENT MODAL (Conditionally Rendered) */}
      {cancellationTarget && (
        <UnenrollmentModal
          event={cancellationTarget}
          onClose={() => setCancellationTarget(null)}
          onUnenrollSuccess={handleUnenrollmentSuccess}
        />
      )}
    </div>
  );
}