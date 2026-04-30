import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { Ticket, Download, Calendar, MapPin, QrCode } from "lucide-react";

export default function StudentTickets() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/registrations/me");
        setRegistrations(res.data.filter((r) => r.status === "registered" && r.event));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const downloadQR = (qrCode, eventTitle) => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `ticket-${eventTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50">My Tickets</h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">Your digital tickets with QR codes</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-50 dark:bg-surface-900 rounded-xl border p-6 animate-pulse">
              <div className="h-5 bg-surface-200 dark:bg-surface-800 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-surface-200 dark:bg-surface-800 rounded mb-4"></div>
              <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : registrations.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {registrations.map((reg) => (
            <div key={reg._id} className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border overflow-hidden">
              {/* Ticket Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <h3 className="font-bold text-lg">{reg.event.title}</h3>
                <span className="text-xs bg-surface-50 dark:bg-surface-900/20 px-2 py-0.5 rounded-full">{reg.event.category}</span>
              </div>

              <div className="p-4">
                {/* Event Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>{new Date(reg.event.startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>{reg.event.venueName || "Venue TBD"}</span>
                  </div>
                </div>

                {/* QR Code */}
                {reg.qrCode ? (
                  <div className="flex flex-col items-center py-4 border-t border-dashed border-border">
                    <img src={reg.qrCode} alt="Ticket QR Code" className="w-36 h-36 mb-3" />
                    <p className="text-xs text-surface-500 mb-2">Scan at event entrance</p>
                    <button
                      onClick={() => downloadQR(reg.qrCode, reg.event.title)}
                      className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-300 font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download QR
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 border-t border-dashed border-border">
                    <QrCode className="w-12 h-12 text-surface-300 dark:text-surface-700 mb-2" />
                    <p className="text-sm text-surface-500">QR code not available</p>
                  </div>
                )}

                {/* Ticket Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-surface-500">
                  <span>ID: {reg._id.slice(-8).toUpperCase()}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">CONFIRMED</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Ticket className="w-16 h-16 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No tickets yet</h3>
          <p className="text-surface-500 mt-2">Register for events to get your digital tickets</p>
          <Link to="/explore" className="mt-4 inline-block text-sm font-medium text-brand-600 dark:text-brand-400">
            Browse Events
          </Link>
        </div>
      )}
    </div>
  );
}
