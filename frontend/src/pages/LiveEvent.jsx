import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import socket from "../utils/socket";
import { ArrowLeft, Wifi, Users, Send, MessageSquare, Video } from "lucide-react";

export default function LiveEvent() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewerCount, setViewerCount] = useState(1);
  const [chatOpen, setChatOpen] = useState(true);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const chatEndRef = useRef(null);

  const rolePrefix = user?.role === "admin" ? "/admin" : user?.role === "organizer" ? "/organizer" : "/student";
  const isOrganizer = event?.organizer?._id === user?.id || event?.organizer === user?.id;

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

  // Load Jitsi IFrame API script
  useEffect(() => {
    if (!event || jitsiLoaded) return;

    const existing = document.getElementById("jitsi-api-script");
    if (existing) {
      setJitsiLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "jitsi-api-script";
    script.src = "https://8x8.vc/vpaas-magic-cookie-30location/external_api.js";
    script.async = true;
    script.onload = () => setJitsiLoaded(true);
    script.onerror = () => {
      // Fallback to meet.jit.si API
      const fallback = document.createElement("script");
      fallback.id = "jitsi-api-script";
      fallback.src = "https://meet.jit.si/external_api.js";
      fallback.async = true;
      fallback.onload = () => setJitsiLoaded(true);
      document.head.appendChild(fallback);
    };
    document.head.appendChild(script);
  }, [event]);

  // Initialize Jitsi once script is loaded
  useEffect(() => {
    if (!jitsiLoaded || !event || !jitsiContainerRef.current || jitsiApiRef.current) return;

    const roomId = event.streamConfig?.roomId || `evently-${id}`;

    const domain = "meet.jit.si";
    // Ensure container has dimensions before creating Jitsi
    const container = jitsiContainerRef.current;
    if (!container || container.offsetHeight < 50) {
      // Retry after layout settles
      const timer = setTimeout(() => setJitsiLoaded((v) => v), 200);
      return () => clearTimeout(timer);
    }

    const options = {
      roomName: roomId,
      parentNode: container,
      width: "100%",
      height: container.offsetHeight || 600,
      configOverwrite: {
        startWithAudioMuted: !isOrganizer,
        startWithVideoMuted: !isOrganizer,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        toolbarButtons: [
          "camera", "chat", "closedcaptions", "desktop", "fullscreen",
          "hangup", "microphone", "participants-pane", "raisehand",
          "settings", "tileview", "toggle-camera",
        ],
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        TOOLBAR_ALWAYS_VISIBLE: true,
        DEFAULT_REMOTE_DISPLAY_NAME: "Attendee",
      },
      userInfo: {
        displayName: user?.name || "Guest",
        email: user?.email || "",
      },
    };

    try {
      const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = jitsiApi;

      jitsiApi.addEventListener("videoConferenceJoined", () => {
        console.log("Joined Jitsi conference");
      });

      jitsiApi.addEventListener("readyToClose", () => {
        window.history.back();
      });
    } catch (err) {
      console.error("Failed to initialize Jitsi:", err);
    }

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [jitsiLoaded, event, id, user]);

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
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-[80vh] text-gray-500">
        Event not found
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)", margin: "-1rem -1rem -1rem -1rem" }}>
      {/* Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to={`${rolePrefix}/events/${id}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
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
              <span>{viewerCount} in room</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`p-2 rounded-lg transition ${chatOpen ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className={`flex-1 bg-gray-950 relative ${chatOpen ? "" : "w-full"}`}>
          <div ref={jitsiContainerRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white font-semibold text-sm">Live Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-8">No messages yet</p>
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

            <form onSubmit={sendMessage} className="p-3 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
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
