import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Megaphone, Send, Calendar, Users } from "lucide-react";

export default function OrganizerAnnouncements() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [sentHistory, setSentHistory] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        const mine = res.data.filter(
          (e) => e.organizer === user?._id || e.organizer?._id === user?._id || e.organizer?.toString() === user?.id
        );
        setEvents(mine);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, [user]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!selectedEvent || !subject || !message) {
      return toast.error("Please fill in all fields");
    }
    setSending(true);
    // Simulate sending (in real app, would call backend endpoint)
    setTimeout(() => {
      const event = events.find((e) => e._id === selectedEvent);
      setSentHistory((prev) => [
        {
          id: Date.now(),
          eventTitle: event?.title,
          subject,
          message,
          sentAt: new Date().toISOString(),
          recipients: event ? event.capacity - event.seatsAvailable : 0,
        },
        ...prev,
      ]);
      setSubject("");
      setMessage("");
      setSelectedEvent("");
      setSending(false);
      toast.success("Announcement sent to all attendees!");
    }, 1000);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50 mb-6">Announcements</h1>

      {/* Send Form */}
      <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6 mb-8">
        <h2 className="text-lg font-semibold text-surface-950 dark:text-surface-50 mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          Send Announcement
        </h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Select Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:outline-none bg-surface-50 dark:bg-surface-900"
            >
              <option value="">Choose an event...</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title} ({event.capacity - event.seatsAvailable} attendees)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Venue Change, Schedule Update"
              required
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              required
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-lg text-sm text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:border-brand-500/50 focus:outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition disabled:bg-gray-400"
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending..." : "Send to All Attendees"}
          </button>
        </form>
      </div>

      {/* Sent History */}
      {sentHistory.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-surface-950 dark:text-surface-50 mb-4">Sent Announcements</h2>
          <div className="space-y-3">
            {sentHistory.map((item) => (
              <div key={item.id} className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-surface-950 dark:text-surface-50">{item.subject}</h3>
                  <span className="text-xs text-surface-500">{new Date(item.sentAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">{item.message}</p>
                <div className="flex items-center gap-4 text-xs text-surface-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.eventTitle}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {item.recipients} recipients</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
