import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import socket from "../utils/socket";
import { ArrowLeft, Wifi, Users, Send, MessageSquare, Radio, Clock, Loader2 } from "lucide-react";

export default function LiveEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamStatus, setStreamStatus] = useState({ isLive: false, checking: true });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewerCount, setViewerCount] = useState(1);
  const [chatOpen, setChatOpen] = useState(true);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const chatEndRef = useRef(null);
  const pollRef = useRef(null);

  const rolePrefix = user?.role === "admin" ? "/admin" : user?.role === "organizer" ? "/organizer" : "/student";
  const isOrganizer = event && user && (event.organizer?._id === user.id || event.organizer === user.id || event.organizer?._id === user._id);

  // Fetch event
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

  // Check stream status (for non-organizers)
  useEffect(() => {
    if (!event || isOrganizer) {
      setStreamStatus({ isLive: false, checking: false });
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await api.get(`/events/${id}/stream/status`);
        setStreamStatus({ isLive: res.data.isLive, checking: false });
      } catch {
        setStreamStatus({ isLive: false, checking: false });
      }
    };

    checkStatus();

    // Poll every 5 seconds until stream is live
    pollRef.current = setInterval(checkStatus, 5000);
    return () => clearInterval(pollRef.current);
  }, [event, isOrganizer, id]);

  // Stop polling once live
  useEffect(() => {
    if (streamStatus.isLive && pollRef.current) {
      clearInterval(pollRef.current);
    }
  }, [streamStatus.isLive]);

  // Start Jitsi (for organizer immediately, for others only when stream is live)
  const startJitsi = useCallback(() => {
    if (!event || !jitsiContainerRef.current || jitsiApiRef.current) return;
    if (!window.JitsiMeetExternalAPI) return;

    const roomId = event.streamConfig?.roomId || `evently-${id}`;
    jitsiContainerRef.current.innerHTML = "";

    try {
      const jitsi = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: roomId,
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: !isOrganizer,
          startWithVideoMuted: !isOrganizer,
          prejoinPageEnabled: false,
          prejoinConfig: { enabled: false },
          disableDeepLinking: true,
          requireDisplayName: false,
          disableProfile: true,
          hideLoginButton: true,
          disableThirdPartyRequests: true,
          disableInviteFunctions: true,
          enableClosePage: false,
          feedbackPercentage: 0,
          notifications: [],
          startSilent: !isOrganizer,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_REMOTE_DISPLAY_NAME: "Attendee",
          TOOLBAR_ALWAYS_VISIBLE: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          HIDE_INVITE_MORE_HEADER: true,
          SETTINGS_SECTIONS: ["devices"],
        },
        userInfo: {
          displayName: user?.name || "Guest",
          email: user?.email || "",
        },
      });

      jitsiApiRef.current = jitsi;

      const iframe = jitsiContainerRef.current.querySelector("iframe");
      if (iframe) {
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.style.position = "absolute";
        iframe.style.top = "0";
        iframe.style.left = "0";
      }

      jitsi.addEventListener("videoConferenceJoined", async () => {
        jitsi.executeCommand("displayName", user?.name || "Guest");
        if (user?.email) jitsi.executeCommand("email", user.email);
        if (isOrganizer) {
          jitsi.executeCommand("subject", event.title);
          try {
            await api.patch(`/events/${id}/stream/start`);
          } catch (err) {
            console.error("Failed to mark stream as live:", err);
          }
        }
      });

      // Intercept hangup — dispose immediately to prevent Jitsi close/promo page
      jitsi.addEventListener("videoConferenceLeft", async () => {
        if (isOrganizer) {
          try { await api.patch(`/events/${id}/stream/end`); } catch {}
        }
        // Dispose IMMEDIATELY before Jitsi can render its close page
        if (jitsiApiRef.current) {
          jitsiApiRef.current.dispose();
          jitsiApiRef.current = null;
        }
        navigate(`${rolePrefix}/events/${id}`);
      });

      // Fallback — if readyToClose fires (shouldn't after videoConferenceLeft)
      jitsi.addEventListener("readyToClose", () => {
        if (jitsiApiRef.current) {
          jitsiApiRef.current.dispose();
          jitsiApiRef.current = null;
        }
        navigate(`${rolePrefix}/events/${id}`);
      });
    } catch (err) {
      console.error("Jitsi init failed:", err);
    }
  }, [event, id, user, isOrganizer]);

  // Load Jitsi script
  useEffect(() => {
    if (!event) return;

    // Organizer: load immediately. Others: only when stream is live.
    if (!isOrganizer && !streamStatus.isLive) return;

    const loadAndStart = () => {
      if (window.JitsiMeetExternalAPI) {
        startJitsi();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => setTimeout(startJitsi, 300);
      document.head.appendChild(script);
    };

    const timer = setTimeout(loadAndStart, 500);
    return () => {
      clearTimeout(timer);
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [event, isOrganizer, streamStatus.isLive, startJitsi]);

  // Socket.io chat
  useEffect(() => {
    if (!id || !user) return;
    socket.emit("joinEventRoom", { eventId: id, userName: user.name });
    socket.on("eventChatMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("eventViewerCount", (count) => setViewerCount(count));
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
    socket.emit("sendEventChatMessage", { eventId: id, userName: user.name, message: newMessage.trim() });
    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return <div className="flex items-center justify-center h-[60vh] text-gray-500">Event not found</div>;
  }

  // ===== WAITING ROOM (non-organizer, stream not live yet) =====
  if (!isOrganizer && !streamStatus.isLive) {
    return (
      <div style={{ margin: "-1rem", height: "calc(100vh - 4.5rem)" }} className="flex flex-col">
        {/* Top bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <Link to={`${rolePrefix}/events/${id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white font-semibold text-sm">{event.title}</h1>
        </div>

        {/* Waiting room */}
        <div className="flex-1 bg-gray-950 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              {streamStatus.checking ? (
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              ) : (
                <Clock className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Waiting for host</h2>
            <p className="text-gray-400 text-sm mb-6">
              The organizer hasn't started the stream yet. You'll be connected automatically once they go live.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              Checking every 5 seconds...
            </div>

            {/* Chat while waiting */}
            <div className="mt-8 bg-gray-900 rounded-xl border border-gray-800 max-h-64 flex flex-col">
              <div className="px-4 py-2 border-b border-gray-800">
                <h3 className="text-white text-xs font-semibold">Chat while you wait</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-32">
                {messages.length === 0 ? (
                  <p className="text-gray-600 text-xs text-center">No messages yet</p>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-[10px] font-medium text-blue-400">{msg.userName}:</span>
                      <span className="text-xs text-gray-300">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={sendMessage} className="p-2 border-t border-gray-800 flex gap-1.5">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Say something..." className="flex-1 bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg placeholder-gray-600 focus:outline-none" />
                <button type="submit" className="p-1.5 bg-blue-600 text-white rounded-lg"><Send className="w-3.5 h-3.5" /></button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== LIVE STREAM VIEW (organizer always, students after stream starts) =====
  return (
    <div style={{ margin: "-1rem", height: "calc(100vh - 4.5rem)" }} className="flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to={`${rolePrefix}/events/${id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-white font-semibold text-sm">{event.title}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {isOrganizer ? (
                <span className="flex items-center gap-1 text-red-400 font-semibold">
                  <Radio className="w-3 h-3" /> Broadcasting
                </span>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span>Connected</span>
                </>
              )}
              <span>-</span>
              <Users className="w-3 h-3" />
              <span>{viewerCount} in room</span>
            </div>
          </div>
        </div>
        <button onClick={() => setChatOpen(!chatOpen)} className={`p-2 rounded-lg transition ${chatOpen ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Video + Chat */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 bg-black relative">
          <div ref={jitsiContainerRef} className="absolute inset-0" />
        </div>

        {chatOpen && (
          <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0">
            <div className="px-3 py-2.5 border-b border-gray-800">
              <h3 className="text-white font-semibold text-sm">Live Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-xs text-center mt-8">No messages yet</p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                      {msg.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-blue-400">{msg.userName}</span>
                      <p className="text-xs text-gray-300">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-2 border-t border-gray-800">
              <div className="flex gap-1.5">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <button type="submit" className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
