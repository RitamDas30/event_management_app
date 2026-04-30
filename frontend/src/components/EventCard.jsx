import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  CheckCircle, Clock, Share2, Calendar, MapPin, Bookmark, BookmarkCheck,
  Edit, Users, Radio, ArrowRight
} from "lucide-react";
import clsx from "clsx";

const generatePlaceholderUrl = (category, width = 800, height = 500) => {
  const colors = { Technical: "6366f1", Cultural: "f43f5e", Sports: "10b981", Academic: "8b5cf6", Social: "f59e0b" };
  const color = colors[category] || "64748b";
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
  const formattedDate = startTime.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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
    <div className="group relative bg-surface-50 dark:bg-surface-900 rounded-3xl border border-border overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-glow dark:hover:shadow-glow-lg dark:hover:border-brand-500/30 flex flex-col h-full">
      {/* Image Header */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={eventImage}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          onError={(e) => { e.target.src = generatePlaceholderUrl(event.category); }}
        />
        
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isLiveNow && (
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-white bg-red-600/90 backdrop-blur-md px-3 py-1 rounded-full border border-red-500/50">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
            </span>
          )}
          {isOnline && !isLiveNow && (
            <span className="text-xs font-semibold tracking-wide uppercase text-white bg-brand-600/90 backdrop-blur-md px-3 py-1 rounded-full border border-brand-500/50">
              {event.eventMode === "online" ? "Online" : "Hybrid"}
            </span>
          )}
        </div>

        {/* Actions overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isStudent && (
            <button onClick={handleSaveToggle} className="p-2.5 bg-surface-950/40 backdrop-blur-md rounded-full text-white hover:bg-surface-950/60 transition-colors" title={isSaved ? "Unsave" : "Save"}>
              {isSaved ? <BookmarkCheck size={16} className="text-brand-400" /> : <Bookmark size={16} />}
            </button>
          )}
          <button onClick={handleShare} className="p-2.5 bg-surface-950/40 backdrop-blur-md rounded-full text-white hover:bg-surface-950/60 transition-colors" title="Share">
            {copied ? <CheckCircle size={16} className="text-emerald-400" /> : <Share2 size={16} />}
          </button>
        </div>

        {/* Date / Price overlay at bottom of image */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-medium uppercase tracking-wider leading-none text-brand-100">{startTime.toLocaleDateString(undefined, { month: "short" })}</span>
              <span className="text-lg font-bold leading-none mt-0.5">{startTime.getDate()}</span>
            </div>
          </div>
          <div className="text-sm font-semibold bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
            {event.price > 0 ? `₹${event.price}` : "Free"}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-grow bg-surface-50 dark:bg-surface-900">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-brand-600 dark:text-brand-400">
            {event.category}
          </span>
          {event.venueName && event.eventMode !== "online" && (
            <>
              <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-700" />
              <span className="text-xs text-surface-500 truncate max-w-[120px]">{event.venueName}</span>
            </>
          )}
        </div>

        <Link to={getEventPath()} className="group/link outline-none">
          <h3 className="font-semibold text-2xl text-surface-950 dark:text-surface-50 leading-tight mb-2 group-hover/link:text-brand-600 dark:group-hover/link:text-brand-400 transition-colors line-clamp-2">
            {event.title}
          </h3>
        </Link>
        
        {/* Reveal details on hover using a subtle translation */}
        <div className="mt-auto pt-6 flex-grow flex flex-col justify-end">
          
          {/* Organizer specific */}
          {isOwnEvent && (isOrganizer || isAdmin) && (
            <div className="space-y-3 mb-4 border-t border-border pt-4">
              <div className="flex justify-between text-xs text-surface-500 font-medium">
                <span>{booked}/{event.capacity} Filled</span>
                <span>{fillPercent}%</span>
              </div>
              <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-1 overflow-hidden">
                <div className={clsx("h-full transition-all duration-1000", fillPercent >= 80 ? "bg-emerald-500" : fillPercent >= 40 ? "bg-brand-500" : "bg-amber-500")} style={{ width: `${fillPercent}%` }} />
              </div>
              
              <div className="flex gap-2">
                <Link to={`/organizer/events/${event._id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                  <Edit size={14} /> Edit
                </Link>
                <Link to={getEventPath()} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                  <Users size={14} /> View
                </Link>
              </div>
            </div>
          )}

          {/* Student Actions */}
          {isStudent && (
            <div className="transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
              {registrationStatus === "registered" || registrationStatus === "waitlisted" ? (
                <div className={clsx("flex items-center justify-between p-3 rounded-xl border", registrationStatus === "registered" ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20")}>
                  <div className="flex items-center gap-2">
                    {registrationStatus === "registered" ? <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" /> : <Clock size={16} className="text-amber-600 dark:text-amber-400" />}
                    <span className={clsx("text-sm font-semibold", registrationStatus === "registered" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
                      {registrationStatus === "registered" ? "Confirmed" : `Waitlisted #${localWaitlistCount}`}
                    </span>
                  </div>
                  <Link to="/student/my-events" className="text-xs font-medium underline underline-offset-2">Ticket</Link>
                </div>
              ) : (
                <button
                  disabled={loading}
                  onClick={handleRegister}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all active:scale-95",
                    loading ? "bg-surface-200 dark:bg-surface-800 text-surface-500 cursor-wait"
                      : isWaitlistActive ? "bg-surface-950 text-surface-50 hover:bg-surface-800 dark:bg-surface-50 dark:text-surface-950 dark:hover:bg-surface-200"
                      : "bg-brand-600 text-white hover:bg-brand-500 shadow-glow"
                  )}
                >
                  {loading ? "Processing..." : isWaitlistActive ? "Join Waitlist" : "Register Now"}
                </button>
              )}
            </div>
          )}

          {/* Guest Actions */}
          {!user && (
            <Link to="/login" className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-500 transition-all active:scale-95 shadow-glow">
              Register to Attend
            </Link>
          )}

        </div>
      </div>
    </div>
  );
}
