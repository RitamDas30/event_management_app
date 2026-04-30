import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";
import EventDeleteModal from "../../components/EventDeleteModal";
import {
  PlusCircle, Edit, Trash2, Calendar, Clock, Users, Eye, Search,
  Radio, Video, Wifi, BarChart3, Upload,
} from "lucide-react";

export default function OrganizerEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletionTarget, setDeletionTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | upcoming | live | past

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/events");
      const mine = res.data.filter(
        (e) => e.organizer?._id === user?.id || e.organizer === user?.id || e.organizer?._id === user?._id
      );
      setEvents(mine);
    } catch (err) {
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [user]);

  const now = new Date();
  const isLiveNow = (e) => {
    const isOnline = e.eventMode === "online" || e.eventMode === "hybrid";
    return isOnline && new Date(e.startTime) <= now && new Date(e.endTime) >= now;
  };
  const isUpcoming = (e) => new Date(e.startTime) > now;
  const isPast = (e) => new Date(e.endTime) < now;
  const canGoLive = (e) => {
    const isOnline = e.eventMode === "online" || e.eventMode === "hybrid";
    const earlyStart = new Date(new Date(e.startTime).getTime() - 15 * 60000);
    return isOnline && now >= earlyStart && now <= new Date(e.endTime);
  };

  const liveEvents = events.filter(isLiveNow);
  const upcomingEvents = events.filter((e) => isUpcoming(e) && !isLiveNow(e));
  const pastEvents = events.filter(isPast);

  let filtered = events;
  if (filter === "live") filtered = liveEvents;
  else if (filter === "upcoming") filtered = upcomingEvents;
  else if (filter === "past") filtered = pastEvents;

  if (search) {
    filtered = filtered.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));
  }

  // Group: live first, then upcoming, then past
  const grouped = filter === "all"
    ? [...liveEvents, ...upcomingEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)), ...pastEvents.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))]
    : filtered;

  if (loading) return <Loader />;

  const EventRow = ({ event }) => {
    const booked = event.capacity - event.seatsAvailable;
    const fillPct = event.capacity > 0 ? Math.round((booked / event.capacity) * 100) : 0;
    const live = isLiveNow(event);
    const upcoming = isUpcoming(event);
    const goLive = canGoLive(event);
    const past = isPast(event);
    const isOnline = event.eventMode === "online" || event.eventMode === "hybrid";
    const hasRecording = !!event.streamConfig?.recordingUrl;

    return (
      <div className={`bg-surface-50 dark:bg-surface-900 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
        live ? "border-red-200 bg-red-50/30 shadow-sm" : "border-border hover:shadow-sm"
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {live && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE
              </span>
            )}
            {isOnline && !live && (
              <span className="text-[11px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full">
                {event.eventMode === "online" ? "Online" : "Hybrid"}
              </span>
            )}
            {hasRecording && past && (
              <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Video className="w-3 h-3" /> Recording
              </span>
            )}
          </div>

          <Link to={`/organizer/events/${event._id}`} className="text-base font-semibold text-surface-950 dark:text-surface-50 hover:text-brand-600 dark:text-brand-400 transition-colors">
            {event.title}
          </Link>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-surface-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(event.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {booked}/{event.capacity}
            </span>
            {/* Inline fill bar */}
            <div className="flex items-center gap-1.5">
              <div className="w-16 bg-surface-200 dark:bg-surface-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${fillPct >= 80 ? "bg-green-500" : fillPct >= 40 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${fillPct}%` }} />
              </div>
              <span className="text-xs">{fillPct}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Go Live — most prominent action */}
          {goLive && (
            <Link to={`/organizer/events/${event._id}/live`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-sm">
              <Radio className="w-3.5 h-3.5" /> {live ? "Rejoin" : "Go Live"}
            </Link>
          )}

          {/* Upcoming online but can't go live yet */}
          {isOnline && upcoming && !goLive && (
            <span className="text-[11px] text-surface-400 dark:text-surface-500 px-2 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-900/50 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Live in {Math.ceil((new Date(event.startTime).getTime() - 15 * 60000 - now.getTime()) / 60000)}m
            </span>
          )}

          <Link to={`/organizer/events/${event._id}`} className="p-2 text-surface-400 dark:text-surface-500 hover:text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:bg-brand-500/10 rounded-lg transition" title="View">
            <Eye className="w-4 h-4" />
          </Link>
          <Link to={`/organizer/analytics?event=${event._id}`} className="p-2 text-surface-400 dark:text-surface-500 hover:text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:bg-violet-500/10 rounded-lg transition" title="Analytics">
            <BarChart3 className="w-4 h-4" />
          </Link>
          <Link to={`/organizer/events/${event._id}/edit`} className="p-2 text-surface-400 dark:text-surface-500 hover:text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:bg-amber-500/10 rounded-lg transition" title="Edit">
            <Edit className="w-4 h-4" />
          </Link>
          <button onClick={() => setDeletionTarget(event)} className="p-2 text-surface-400 dark:text-surface-500 hover:text-rose-600 dark:text-rose-400 hover:bg-red-50 rounded-lg transition" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50">My Events</h1>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            {events.length} events · {liveEvents.length > 0 && <span className="text-rose-600 dark:text-rose-400 font-semibold">{liveEvents.length} live now</span>}
            {liveEvents.length === 0 && `${upcomingEvents.length} upcoming`}
          </p>
        </div>
        <Link to="/organizer/events/create" className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition shadow-sm">
          <PlusCircle className="w-4 h-4" /> Create Event
        </Link>
      </div>

      {/* Filter tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
          {[
            { id: "all", label: "All" },
            { id: "live", label: "Live", count: liveEvents.length },
            { id: "upcoming", label: "Upcoming", count: upcomingEvents.length },
            { id: "past", label: "Past", count: pastEvents.length },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                filter === tab.id ? "bg-surface-50 dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm" : "text-surface-600 dark:text-surface-400 hover:text-surface-950 dark:text-surface-50"
              }`}>
              {tab.id === "live" && tab.count > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab.id === "live" ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400" : "bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {events.length > 3 && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500" />
            <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:outline-none" />
          </div>
        )}
      </div>

      {/* Events */}
      {grouped.length > 0 ? (
        <div className="space-y-2">
          {grouped.map((event) => <EventRow key={event._id} event={event} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            {search ? "No events match your search" : filter !== "all" ? `No ${filter} events` : "No events yet"}
          </h3>
          <p className="text-surface-500 mt-2">Create your first event to get started</p>
          <Link to="/organizer/events/create" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400">
            <PlusCircle className="w-4 h-4" /> Create Event
          </Link>
        </div>
      )}

      {deletionTarget && (
        <EventDeleteModal event={deletionTarget} onClose={() => setDeletionTarget(null)} onDeleteSuccess={() => { setDeletionTarget(null); fetchEvents(); }} />
      )}
    </div>
  );
}
