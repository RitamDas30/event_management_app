import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import socket from "../utils/socket";
import LiveChat from "../components/LiveChat";
import {
  ArrowLeft, Wifi, Users, Send, MessageSquare, Radio, Clock, Loader2,
  Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Calendar,
} from "lucide-react";

export default function LiveEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamStatus, setStreamStatus] = useState({ isLive: false, checking: true });
  const [viewerCount, setViewerCount] = useState(1);
  const [chatOpen, setChatOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [streamEnded, setStreamEnded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recordingUploaded, setRecordingUploaded] = useState(false);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  const rolePrefix = user?.role === "admin" ? "/admin" : user?.role === "organizer" ? "/organizer" : "/student";
  const isOrganizer = event && user && (event.organizer?._id === user.id || event.organizer === user.id || event.organizer?._id === user._id);

  // Format elapsed time
  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${m}:${String(sec).padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchEvent();
  }, [id]);

  // Check stream status (non-organizers)
  useEffect(() => {
    if (!event || isOrganizer) { setStreamStatus({ isLive: false, checking: false }); return; }
    const check = async () => {
      try {
        const res = await api.get(`/events/${id}/stream/status`);
        setStreamStatus({ isLive: res.data.isLive, checking: false });
      } catch { setStreamStatus({ isLive: false, checking: false }); }
    };
    check();
    pollRef.current = setInterval(check, 5000);
    return () => clearInterval(pollRef.current);
  }, [event, isOrganizer, id]);

  useEffect(() => {
    if (streamStatus.isLive && pollRef.current) clearInterval(pollRef.current);
  }, [streamStatus.isLive]);

  // Elapsed timer
  useEffect(() => {
    if (!event) return;
    const shouldRun = isOrganizer || streamStatus.isLive;
    if (!shouldRun) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [event, isOrganizer, streamStatus.isLive]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.() || containerRef.current.webkitRequestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Our control commands → Jitsi
  const toggleAudio = () => {
    jitsiApiRef.current?.executeCommand("toggleAudio");
    setAudioMuted((m) => !m);
  };
  const toggleVideo = () => {
    jitsiApiRef.current?.executeCommand("toggleVideo");
    setVideoMuted((m) => !m);
  };
  const toggleScreenShare = () => {
    jitsiApiRef.current?.executeCommand("toggleShareScreen");
  };
  const hangup = () => {
    jitsiApiRef.current?.executeCommand("hangup");
  };

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
          // Hide Jitsi's own toolbar — we use our custom one
          toolbarButtons: [],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_REMOTE_DISPLAY_NAME: "Attendee",
          TOOLBAR_ALWAYS_VISIBLE: false,
          TOOLBAR_TIMEOUT: 0,
          FILM_STRIP_MAX_HEIGHT: 100,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          HIDE_INVITE_MORE_HEADER: true,
          SETTINGS_SECTIONS: [],
          VIDEO_LAYOUT_FIT: "both",
        },
        userInfo: {
          displayName: user?.name || "Guest",
          email: user?.email || "",
        },
      });

      jitsiApiRef.current = jitsi;
      setAudioMuted(!isOrganizer);
      setVideoMuted(!isOrganizer);

      const iframe = jitsiContainerRef.current.querySelector("iframe");
      if (iframe) {
        Object.assign(iframe.style, {
          width: "100%", height: "100%", border: "none",
          position: "absolute", top: "0", left: "0", borderRadius: "0",
        });
      }

      jitsi.addEventListener("videoConferenceJoined", async () => {
        jitsi.executeCommand("displayName", user?.name || "Guest");
        if (user?.email) jitsi.executeCommand("email", user.email);
        if (isOrganizer) {
          jitsi.executeCommand("subject", event.title);
          try { await api.patch(`/events/${id}/stream/start`); } catch {}
        }
      });

      jitsi.addEventListener("audioMuteStatusChanged", ({ muted }) => setAudioMuted(muted));
      jitsi.addEventListener("videoMuteStatusChanged", ({ muted }) => setVideoMuted(muted));

      jitsi.addEventListener("videoConferenceLeft", async () => {
        if (jitsiApiRef.current) { jitsiApiRef.current.dispose(); jitsiApiRef.current = null; }
        if (isOrganizer) {
          try { await api.patch(`/events/${id}/stream/end`); } catch {}
          // Show post-stream screen instead of navigating away
          setStreamEnded(true);
          clearInterval(timerRef.current);
        } else {
          navigate(`${rolePrefix}/events/${id}`);
        }
      });

      jitsi.addEventListener("readyToClose", () => {
        if (jitsiApiRef.current) { jitsiApiRef.current.dispose(); jitsiApiRef.current = null; }
        navigate(`${rolePrefix}/events/${id}`);
      });
    } catch (err) {
      console.error("Jitsi init failed:", err);
    }
  }, [event, id, user, isOrganizer, navigate, rolePrefix]);

  useEffect(() => {
    if (!event) return;
    if (!isOrganizer && !streamStatus.isLive) return;
    const loadAndStart = () => {
      if (window.JitsiMeetExternalAPI) { startJitsi(); return; }
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => setTimeout(startJitsi, 300);
      document.head.appendChild(script);
    };
    const timer = setTimeout(loadAndStart, 500);
    return () => {
      clearTimeout(timer);
      if (jitsiApiRef.current) { jitsiApiRef.current.dispose(); jitsiApiRef.current = null; }
    };
  }, [event, isOrganizer, streamStatus.isLive, startJitsi]);

  // Socket — viewer count only (chat handled by LiveChat component)
  useEffect(() => {
    if (!id || !user) return;
    socket.emit("joinEventRoom", { eventId: id, userName: user.name });
    socket.on("eventViewerCount", (count) => setViewerCount(count));
    return () => { socket.emit("leaveEventRoom", { eventId: id }); socket.off("eventViewerCount"); };
  }, [id, user]);

  const handleRecordingUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("recording", file);
      const res = await api.post(`/events/${id}/stream/recording`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRecordingUploaded(true);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!event) return <div className="flex items-center justify-center h-[60vh] text-gray-500">Event not found</div>;

  // ===== POST-STREAM SCREEN (organizer only) =====
  if (streamEnded && isOrganizer) {
    return (
      <div className="flex flex-col bg-gray-950 h-screen">
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <h1 className="text-white font-semibold text-sm">{event.title}</h1>
          <span className="text-xs text-gray-500">Stream ended</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-lg px-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Stream Completed</h2>
            <p className="text-gray-400 mb-1">Duration: {formatElapsed(elapsed)}</p>
            <p className="text-gray-500 text-sm mb-8">Peak viewers: {viewerCount}</p>

            {/* Upload Recording */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 text-left">
              <h3 className="text-white font-semibold mb-2">Upload Recording</h3>
              <p className="text-gray-500 text-sm mb-4">
                Upload your screen recording so attendees can watch it later. Supports MP4, WebM, MOV.
              </p>
              {recordingUploaded ? (
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Recording uploaded — attendees can now watch it
                </div>
              ) : (
                <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm cursor-pointer transition ${
                  uploading ? "bg-gray-700 text-gray-400 cursor-wait" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}>
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Video className="w-4 h-4" /> Choose Recording File</>
                  )}
                  <input type="file" accept="video/*" onChange={handleRecordingUpload} disabled={uploading} className="hidden" />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Link to={`${rolePrefix}/events/${id}`} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 text-white hover:bg-gray-700 transition">
                View Event
              </Link>
              <Link to="/organizer/analytics" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 text-white hover:bg-gray-700 transition">
                View Analytics
              </Link>
              <Link to="/organizer/dashboard" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== WAITING ROOM =====
  if (!isOrganizer && !streamStatus.isLive) {
    return (
      <div className="flex flex-col h-screen">
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <Link to={`${rolePrefix}/events/${id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-white font-semibold text-sm">{event.title}</h1>
            <p className="text-xs text-gray-500">{event.category} · {new Date(event.startTime).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex-1 bg-gray-950 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              {streamStatus.checking ? <Loader2 className="w-8 h-8 text-blue-400 animate-spin" /> : <Clock className="w-8 h-8 text-gray-500" />}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Waiting for host</h2>
            <p className="text-gray-400 text-sm mb-6">You'll be connected automatically once the organizer goes live.</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              Checking...
            </div>
            <div className="mt-8 bg-gray-900 rounded-xl border border-gray-800 flex flex-col max-h-64">
              <div className="px-4 py-2 border-b border-gray-800"><h3 className="text-white text-xs font-semibold">Chat while you wait</h3></div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-32">
                {messages.length === 0 ? <p className="text-gray-600 text-xs text-center">No messages yet</p> : messages.map((msg, i) => (
                  <div key={i} className="flex gap-2"><span className="text-[10px] font-medium text-blue-400">{msg.userName}:</span><span className="text-xs text-gray-300">{msg.message}</span></div>
                ))}
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

  // ===== LIVE STREAM =====
  return (
    <div ref={containerRef} style={isFullscreen ? {} : { margin: "-1rem", height: "calc(100vh - 4.5rem)" }} className={`flex flex-col bg-gray-950 ${isFullscreen ? "fixed inset-0 z-[100]" : ""}`}>
      {/* Top Bar — our branded bar */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-1.5 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link to={`${rolePrefix}/events/${id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-white font-semibold text-sm leading-tight">{event.title}</h1>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                {isOrganizer ? (
                  <span className="flex items-center gap-1 text-red-400 font-semibold"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE</span>
                ) : (
                  <span className="flex items-center gap-1 text-green-400"><Wifi className="w-3 h-3" /> Connected</span>
                )}
                <span className="text-gray-600">|</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {viewerCount}</span>
                <span className="text-gray-600">|</span>
                <span className="font-mono">{formatElapsed(elapsed)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setChatOpen(!chatOpen)} className={`p-2 rounded-lg transition ${chatOpen ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}`} title="Toggle chat">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition" title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main: Video + Chat */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Video */}
        <div className="flex-1 bg-black relative">
          <div ref={jitsiContainerRef} className="absolute inset-0" />

          {/* Our floating control bar at bottom center */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-gray-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-700/50 shadow-2xl">
            <button onClick={toggleAudio} className={`p-2.5 rounded-xl transition ${audioMuted ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-gray-700/50 text-white hover:bg-gray-700"}`} title={audioMuted ? "Unmute" : "Mute"}>
              {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button onClick={toggleVideo} className={`p-2.5 rounded-xl transition ${videoMuted ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-gray-700/50 text-white hover:bg-gray-700"}`} title={videoMuted ? "Start camera" : "Stop camera"}>
              {videoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            <button onClick={toggleScreenShare} className="p-2.5 rounded-xl bg-gray-700/50 text-white hover:bg-gray-700 transition" title="Share screen">
              <MonitorUp className="w-5 h-5" />
            </button>
            <div className="w-px h-8 bg-gray-700 mx-1"></div>
            <button onClick={hangup} className="p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition" title="Leave">
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          {/* Evently watermark */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 text-white/30 text-xs font-semibold pointer-events-none">
            <Calendar className="w-3.5 h-3.5" /> Evently
          </div>
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <LiveChat eventId={id} user={user} isOrganizer={isOrganizer} isFullscreen={isFullscreen} />
        )}
      </div>
    </div>
  );
}
