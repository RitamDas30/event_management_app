import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import UnenrollmentModal from "../../components/UnenrollmentModal";
import {
  Ticket,
  ClipboardList,
  Download,
  Calendar,
  MapPin,
  QrCode,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

const tabs = [
  { id: "all", label: "All", icon: ClipboardList },
  { id: "tickets", label: "Tickets", icon: Ticket },
];

const statusConfig = {
  registered: { label: "Confirmed", color: "text-green-600 bg-green-50", icon: CheckCircle },
  waitlisted: { label: "Waitlisted", color: "text-amber-600 bg-amber-50", icon: Clock },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-50", icon: XCircle },
};

export default function MyEvents() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [cancellationTarget, setCancellationTarget] = useState(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/registrations/me");
      setRegistrations(res.data || []);
    } catch (err) {
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const downloadQR = (qrCode, title) => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `ticket-${title.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  };

  const filtered =
    activeTab === "tickets"
      ? registrations.filter((r) => r.status === "registered" && r.event)
      : registrations.filter((r) => r.event);

  const getEventPath = (eventId) => {
    if (!user) return `/events/${eventId}`;
    return user.role === "organizer" ? `/organizer/events/${eventId}` : `/student/events/${eventId}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <p className="text-gray-600 mt-1">Your registrations and digital tickets</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "tickets" && (
                <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                  {registrations.filter((r) => r.status === "registered" && r.event).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        activeTab === "tickets" ? (
          /* Ticket Card View */
          <div className="grid sm:grid-cols-2 gap-6">
            {filtered.map((reg) => (
              <div key={reg._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                  <Link to={getEventPath(reg.event._id)} className="font-bold text-lg hover:underline">
                    {reg.event.title}
                  </Link>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-2">{reg.event.category}</span>
                </div>
                <div className="p-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {new Date(reg.event.startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      {reg.event.venueName || "Venue TBD"}
                    </div>
                  </div>
                  {reg.qrCode ? (
                    <div className="flex flex-col items-center py-4 border-t border-dashed border-gray-200">
                      <img src={reg.qrCode} alt="QR" className="w-32 h-32 mb-2" />
                      <p className="text-xs text-gray-500 mb-2">Scan at entrance</p>
                      <button onClick={() => downloadQR(reg.qrCode, reg.event.title)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 border-t border-dashed border-gray-200">
                      <QrCode className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">QR not available</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span>ID: {reg._id.slice(-8).toUpperCase()}</span>
                    <span className="text-green-600 font-semibold">CONFIRMED</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filtered.map((reg) => {
              const config = statusConfig[reg.status] || statusConfig.registered;
              const StatusIcon = config.icon;
              return (
                <div key={reg._id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Link to={getEventPath(reg.event._id)} className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {reg.event.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(reg.event.startTime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {reg.event.venueName || "N/A"}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {reg.qrCode && reg.status === "registered" && (
                      <img src={reg.qrCode} alt="QR" className="w-16 h-16 rounded border border-gray-200" />
                    )}
                    {(reg.status === "registered" || reg.status === "waitlisted") && (
                      <button
                        onClick={() => setCancellationTarget(reg.event)}
                        className="text-sm text-red-500 hover:text-white hover:bg-red-500 border border-red-300 px-3 py-1.5 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="text-center py-20">
          <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            {activeTab === "tickets" ? "No confirmed tickets" : "No registrations yet"}
          </h3>
          <p className="text-gray-500 mt-2">Browse events and register to see them here</p>
          <Link to={user?.role === "student" ? "/student/explore" : "/explore"} className="mt-4 inline-block text-sm font-medium text-blue-600">
            Explore Events
          </Link>
        </div>
      )}

      {cancellationTarget && (
        <UnenrollmentModal
          event={cancellationTarget}
          onClose={() => setCancellationTarget(null)}
          onUnenrollSuccess={() => { setCancellationTarget(null); fetchRegistrations(); }}
        />
      )}
    </div>
  );
}
