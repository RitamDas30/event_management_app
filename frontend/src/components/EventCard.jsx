import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  CheckCircle, Clock, Share2, Calendar, MapPin, Bookmark, BookmarkCheck,
  Edit, Users, Radio, BarChart3, Eye,
} from "lucide-react";

const generatePlaceholderUrl = (category, width = 400, height = 200) => {
  const colors = { Technical: "10B981", Cultural: "F59E0B", Sports: "EF4444", Academic: "6366F1", Social: "EC4899" };
  const color = colors[category] || "4B5563";
  return `https://placehold.co/${width}x${height}/${color}/FFFFFF?text=${encodeURIComponent((category || "EVENT").toUpperCase())}`;
};

export default function EventCard({ event, refresh, initialRegStatus, initialSaved }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(initialRegStatus || null);
  const [localWaitlistCount, setLocalWaitlistCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved || false);

  const isStudent = user?.role === "student";
  const isOrganizer = user?.role === "organizer";
  const isAdmin = user?.role === "admin";
  const isOwnEvent = user && (event.organizer?._id === user.id || event.organizer === user.id || event.organizer?._id === user._id);
  const isWaitlistActive = event.seatsAvailable <= 0;
  const booked = event.capacity - event.seatsAvailable;
  const fillPercent = event.capacity > 0 ? Math.round((booked / event.capacity) * 100) : 0;

  // Can go live: online/hybrid, within 15 min of start to end time
  const isOnline = event.eventMode === "online" || event.eventMode === "hybrid";
  const now = new Date();
  const canGoLive = isOnline && isOwnEvent && now >= new Date(new Date(event.startTime).getTime() - 15 * 60000) && now <= new Date(event.endTime);
  const isLiveNow = isOnline && now >= new Date(event.startTime) && now <= new Date(event.endTime);

  const getEventPath = () => {
    if (!user) return `/events/${event._id}`;
    switch (user.role) {
      case "organizer": return `/organizer/events/${event._id}`;
      case "admin": return `/admin/events/${event._id}`;
      default: return `/student/events/${event._id}`;
    }
  };

  const getLivePath = () => {
    if (!user) return `/events/${event._id}`;
    switch (user.role) {
      case "organizer": return `/organizer/events/${event._id}/live`;
      case "admin": return `/admin/events/${event._id}/live`;
      default: return `/student/events/${event._id}/live`;
    }
  };

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const formattedDate = startTime.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const formattedTime = `${startTime.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} – ${endTime.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  const eventImage = event.imageUrl || generatePlaceholderUrl(event.category);

  const handleRegister = async () => {
    if (!user) return toast.error("Please log in to register.");
    try {
      setLoading(true);
      const res = await api.post(`/registrations/${event._id}`);
      const msg = res.data.message || "Registered!";
      const isWaitlisted = msg.toLowerCase().includes("waitlisted");
      setRegistrationStatus(isWaitlisted ? "waitlisted" : "registered");
      if (isWaitlisted && res.data.waitlistCount) setLocalWaitlistCount(res.data.waitlistCount);
      toast.success(msg);
      if (refresh) refresh();
    } catch (err) {
      const backendMsg = err.response?.data?.message || "Registration failed.";
      if (backendMsg.toLowerCase().includes("already waitlisted")) setRegistrationStatus("waitlisted");
      else if (backendMsg.toLowerCase().includes("already registered")) setRegistrationStatus("registered");
      toast.error(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/events/${event._id}`;
    if (navigator.share) {
      await navigator.share({ title: event.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToggle = async () => {
    try {
      if (isSaved) {
        await api.delete(`/saved-events/${event._id}`);
        setIsSaved(false);
        toast.success("Removed from saved");
      } else {
        await api.post(`/saved-events/${event._id}`);
        setIsSaved(true);
        toast.success("Event saved!");
      }
    } catch (err) {
      toast.error("Failed to update saved status");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Image + Overlay Buttons */}
        <div className="relative">
          <img src={eventImage} alt={event.title} className="rounded-lg w-full h-40 object-cover mb-3" onError={(e) => { e.target.src = generatePlaceholderUrl(event.category); }} />

          {/* Live badge */}
          {isLiveNow && (
            <span className="absolute top-2 left-2 flex items-center gap-1 text-xs font-semibold text-white bg-red-600 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
            </span>
          )}

          {/* Online/Hybrid badge */}
          {isOnline && !isLiveNow && (
            <span className="absolute top-2 left-2 text-xs font-medium text-white bg-purple-600 px-2 py-0.5 rounded-full">
              {event.eventMode === "online" ? "Online" : "Hybrid"}
            </span>
          )}

          <div className="absolute top-2 right-2 flex gap-1.5">
            {/* Save — students only */}
            {isStudent && (
              <button onClick={handleSaveToggle} className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition" title={isSaved ? "Unsave" : "Save"}>
                {isSaved ? <BookmarkCheck size={18} className="text-blue-400" /> : <Bookmark size={18} />}
              </button>
            )}
            {/* Share — everyone */}
            <button onClick={handleShare} className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition" title="Share">
              {copied ? <CheckCircle size={18} className="text-green-400" /> : <Share2 size={18} />}
            </button>
          </div>
        </div>

        {/* Title */}
        <Link to={getEventPath()} className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
          {event.title}
        </Link>

        {/* Meta */}
        <div className="space-y-1 mt-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-blue-500 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-blue-500 flex-shrink-0" />
            <span>{formattedTime}</span>
          </div>
          {event.venueName && event.eventMode !== "online" && (
            <div className="flex items-center gap-1">
              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{event.venueName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{event.category}</span>
            <span className="font-semibold text-gray-900">{event.price > 0 ? `₹${event.price}` : "Free"}</span>
          </div>
        </div>

        {/* ====== ORGANIZER VIEW (own event) ====== */}
        {isOwnEvent && (isOrganizer || isAdmin) && (
          <div className="mt-3 space-y-2">
            {/* Fill bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{booked}/{event.capacity} registered</span>
                <span>{fillPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${fillPercent >= 80 ? "bg-green-500" : fillPercent >= 40 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${fillPercent}%` }} />
              </div>
            </div>

            {/* Organizer actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to={`/organizer/events/${event._id}/edit`} className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition">
                <Edit size={13} /> Edit
              </Link>
              <Link to={getEventPath()} className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition">
                <Users size={13} /> Attendees
              </Link>
              {canGoLive && (
                <Link to={getLivePath()} className="flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-2.5 py-1.5 rounded-lg transition">
                  <Radio size={13} /> Go Live
                </Link>
              )}
              {isLiveNow && !canGoLive && (
                <Link to={getLivePath()} className="flex items-center gap-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1.5 rounded-lg transition">
                  <Radio size={13} /> Live Now
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ====== ORGANIZER VIEW (other's event) ====== */}
        {!isOwnEvent && (isOrganizer || isAdmin) && (
          <div className="mt-3">
            <p className="text-xs text-gray-500">{event.seatsAvailable} seats left</p>
            {isLiveNow && (
              <Link to={getLivePath()} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                <Radio size={13} /> Watch Live
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ====== STUDENT VIEW ====== */}
      {isStudent && (
        <div className="mt-3">
          {registrationStatus === "registered" || registrationStatus === "waitlisted" ? (
            <div className={`p-3 rounded-lg flex flex-col items-center border ${registrationStatus === "registered" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2">
                {registrationStatus === "registered" ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <Clock size={18} className="text-amber-600" />
                )}
                <p className={`text-sm font-semibold ${registrationStatus === "registered" ? "text-green-700" : "text-amber-700"}`}>
                  {registrationStatus === "registered" ? "Confirmed" : `Waitlisted #${localWaitlistCount}`}
                </p>
              </div>
              <Link to="/student/my-events" className="mt-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                View Ticket
              </Link>
            </div>
          ) : (
            <button disabled={loading} onClick={handleRegister}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                loading ? "bg-gray-300 text-gray-500 cursor-wait"
                  : isWaitlistActive ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}>
              {loading ? "Processing..." : isWaitlistActive ? "Join Waitlist" : "Register Now"}
            </button>
          )}

          {/* Join live stream for registered students */}
          {isLiveNow && registrationStatus === "registered" && (
            <Link to={getLivePath()} className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition">
              <Radio size={14} /> Join Live Stream
            </Link>
          )}
        </div>
      )}

      {/* Guest — no user */}
      {!user && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">{event.seatsAvailable} seats left</p>
          <Link to="/login" className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition">
            Log in to Register
          </Link>
        </div>
      )}
    </div>
  );
}
