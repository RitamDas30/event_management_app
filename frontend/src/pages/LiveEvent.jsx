import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import socket from "../utils/socket";
import { Video, MessageSquare, Users, Send, ArrowLeft, Wifi } from "lucide-react";

export default function LiveEvent() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  // Socket.io live chat
  useEffect(() => {
    if (!id || !user) return;

    socket.emit("joinEventRoom", { eventId: id, userName: user.name });

    socket.on("eventChatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("eventViewerCount", (count) => {
      setViewerCount(count);
    });

    return () => {
      socket.emit("leaveEventRoom", { eventId: id });
      socket.off("eventChatMessage");
      socket.off("eventViewerCount");
    };
  }, [id, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit("sendEventChatMessage", {
      eventId: id,
      userName: user.name,
      message: newMessage.trim(),
    });
    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Event not found</p>
      </div>
    );
  }

  const roomId = event.streamConfig?.roomId || `evently-${id}`;
  const jitsiDomain = "meet.jit.si";
  const jitsiUrl = `https://${jitsiDomain}/${roomId}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=${user?.id !== event.organizer?._id}&userInfo.displayName=${encodeURIComponent(user?.name || "Guest")}`;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/events/${id}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-white font-semibold text-sm">{event.title}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Wifi className="w-3 h-3 text-green-400" />
              <span>Live</span>
              <span className="mx-1">-</span>
              <Users className="w-3 h-3" />
              <span>{viewerCount} watching</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`p-2 rounded-lg transition ${
            chatOpen ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className={`flex-1 ${chatOpen ? "" : "w-full"}`}>
          <iframe
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
            style={{ minHeight: "calc(100vh - 56px)" }}
          />
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-semibold text-sm">Live Chat</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-8">
                  No messages yet. Say hi!
                </p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                      {msg.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-medium text-blue-400">{msg.userName}</span>
                      <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
