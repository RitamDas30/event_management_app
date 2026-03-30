import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  Video,
  VideoOff,
  Radio,
  Clock,
  Calendar,
  MapPin,
  Users,
  Play,
  ExternalLink,
  Wifi,
} from "lucide-react";

export default function LiveEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOrganizer = user?.role === "organizer" || user?.role === "admin";
  const rolePrefix = user?.role === "admin" ? "/admin" : user?.role === "organizer" ? "/organizer" : "/student";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, regsRes] = await Promise.all([
          api.get("/events"),
          user?.role === "student"
            ? api.get("/registrations/me").catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ]);

        // Filter online/hybrid events only
        const onlineEvents = eventsRes.data.filter(
          (e) => e.eventMode === "online" || e.eventMode === "hybrid"
        );

        if (isOrganizer) {
          // Organizer sees their own online events
          const mine = onlineEvents.filter(
            (e) => e.organizer?._id === user?.id || e.organizer === user?.id || e.organizer?._id === user?._id
          );
          setEvents(mine);
        } else {
          // Student sees all online events
          setEvents(onlineEvents);

          // Also get registered online events
          const regEventIds = new Set(
            regsRes.data
              .filter((r) => r.status === "registered" && r.event)
              .map((r) => r.event._id)
          );
          setRegisteredEvents(
            onlineEvents.filter((e) => regEventIds.has(e._id))
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const isLiveNow = (event) => {
    const now = new Date();
    return new Date(event.startTime) <= now && new Date(event.endTime) >= now;
  };

  const isUpcoming = (event) => new Date(event.startTime) > new Date();
  const isPast = (event) => new Date(event.endTime) < new Date();

  const canGoLive = (event) => {
    // Can go live 15 minutes before start until end time
    const now = new Date();
    const earlyStart = new Date(new Date(event.startTime).getTime() - 15 * 60000);
    return now >= earlyStart && now <= new Date(event.endTime);
  };

  const liveNow = events.filter(isLiveNow);
  const upcoming = events.filter(isUpcoming);
  const past = events.filter(isPast);

  const EventCard = ({ event, showGoLive = false }) => {
    const live = isLiveNow(event);
    const goLive = canGoLive(event);
    const ended = isPast(event);

    return (
      <div className={`bg-white rounded-xl border p-4 transition ${live ? "border-green-300 bg-green-50/30" : "border-gray-200"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {live && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  <Wifi className="w-3 h-3" /> LIVE
                </span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                event.eventMode === "online" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
              }`}>
                {event.eventMode === "online" ? "Online" : "Hybrid"}
              </span>
            </div>

            <Link
              to={`${rolePrefix}/events/${event._id}`}
              className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {event.title}
            </Link>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(event.startTime).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {" - "}
                {new Date(event.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {event.capacity - event.seatsAvailable} registered
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            {showGoLive && goLive && (
              <Link
                to={`${rolePrefix}/events/${event._id}/live`}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm"
              >
                <Radio className="w-4 h-4" />
                Go Live
              </Link>
            )}

            {showGoLive && !goLive && !ended && (
              <div className="text-xs text-gray-500 text-right">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Available 15m before start
              </div>
            )}

            {!showGoLive && (live || goLive) && (
              <Link
                to={`${rolePrefix}/events/${event._id}/live`}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
              >
                <Play className="w-4 h-4" />
                Join
              </Link>
            )}

            {ended && event.streamConfig?.recordingUrl && (
              <a
                href={event.streamConfig.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                <Video className="w-4 h-4" /> Recording
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isOrganizer ? "Live & Streaming" : "Live Events"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isOrganizer
            ? "Manage your online and hybrid events"
            : "Online events you can join"}
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20">
          <VideoOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No online events</h3>
          <p className="text-gray-500 mt-2">
            {isOrganizer
              ? "Create an event with Online or Hybrid mode to use streaming"
              : "No online events available right now"}
          </p>
          {isOrganizer && (
            <Link
              to="/organizer/events/create"
              className="mt-4 inline-block text-sm font-medium text-blue-600"
            >
              Create Event
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live Now */}
          {liveNow.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live Now
              </h2>
              <div className="space-y-3">
                {liveNow.map((e) => (
                  <EventCard key={e._id} event={e} showGoLive={isOrganizer} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((e) => (
                  <EventCard key={e._id} event={e} showGoLive={isOrganizer} />
                ))}
              </div>
            </div>
          )}

          {/* Past (with recordings) */}
          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Past Events</h2>
              <div className="space-y-3">
                {past.map((e) => (
                  <EventCard key={e._id} event={e} showGoLive={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
