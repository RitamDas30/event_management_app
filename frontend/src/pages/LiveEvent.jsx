import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import socket from "../utils/socket";
import LiveChat from "../components/LiveChat";
import {
  ArrowLeft, Wifi, Users, MessageSquare, Radio, Clock, Loader2,
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
  const fullscreenRef = useRef(null);

  const rolePrefix = user?.role === "admin" ? "/admin" : user?.role === "organizer" ? "/organizer" : "/student";
  const isOrganizer = event && user && (event.organizer?._id === user.id || event.organizer === user.id || event.organizer?._id === user._id);

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
  };

  useEffect(() => {
    api.get(`/events/${id}`).then((res) => setEvent(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!event || isOrganizer) { setStreamStatus({ isLive: false, checking: false }); return; }
    const check = async () => { try { const r = await api.get(`/events/${id}/stream/status`); setStreamStatus({ isLive: r.data.isLive, checking: false }); } catch { setStreamStatus({ isLive: false, checking: false }); } };
    check();
    pollRef.current = setInterval(check, 5000);
    return () => clearInterval(pollRef.current);
  }, [event, isOrganizer, id]);

  useEffect(() => { if (streamStatus.isLive && pollRef.current) clearInterval(pollRef.current); }, [streamStatus.isLive]);

  useEffect(() => {
    if (!event) return;
    if (!isOrganizer && !streamStatus.isLive) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [event, isOrganizer, streamStatus.isLive]);

  const toggleFullscreen = () => {
    if (!fullscreenRef.current) return;
    if (!isFullscreen) { fullscreenRef.current.requestFullscreen?.(); setIsFullscreen(true); }
    else { document.exitFullscreen?.(); setIsFullscreen(false); }
  };
  useEffect(() => { const h = () => setIsFullscreen(!!document.fullscreenElement); document.addEventListener("fullscreenchange", h); return () => document.removeEventListener("fullscreenchange", h); }, []);

  // Keyboard shortcut: F for fullscreen
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  const toggleAudio = () => { jitsiApiRef.current?.executeCommand("toggleAudio"); setAudioMuted((m) => !m); };
  const toggleVideo = () => { jitsiApiRef.current?.executeCommand("toggleVideo"); setVideoMuted((m) => !m); };
  const toggleScreenShare = () => { jitsiApiRef.current?.executeCommand("toggleShareScreen"); };
  const hangup = () => { jitsiApiRef.current?.executeCommand("hangup"); };

  const startJitsi = useCallback(() => {
    if (!event || !jitsiContainerRef.current || jitsiApiRef.current || !window.JitsiMeetExternalAPI) return;
    const roomId = event.streamConfig?.roomId || `evently-${id}`;
    jitsiContainerRef.current.innerHTML = "";
    try {
      const jitsi = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: roomId, parentNode: jitsiContainerRef.current,
        configOverwrite: { startWithAudioMuted: !isOrganizer, startWithVideoMuted: !isOrganizer, prejoinPageEnabled: false, prejoinConfig: { enabled: false }, disableDeepLinking: true, requireDisplayName: false, disableProfile: true, hideLoginButton: true, disableThirdPartyRequests: true, disableInviteFunctions: true, enableClosePage: false, feedbackPercentage: 0, notifications: [], startSilent: !isOrganizer, toolbarButtons: [] },
        interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false, SHOW_WATERMARK_FOR_GUESTS: false, SHOW_BRAND_WATERMARK: false, SHOW_POWERED_BY: false, SHOW_PROMOTIONAL_CLOSE_PAGE: false, DEFAULT_REMOTE_DISPLAY_NAME: "Attendee", TOOLBAR_ALWAYS_VISIBLE: false, TOOLBAR_TIMEOUT: 0, DISABLE_JOIN_LEAVE_NOTIFICATIONS: true, HIDE_INVITE_MORE_HEADER: true, SETTINGS_SECTIONS: [], VIDEO_LAYOUT_FIT: "both", HIDE_DEEP_LINKING_LOGO: true, JITSI_WATERMARK_LINK: "" },
        userInfo: { displayName: user?.name || "Guest", email: user?.email || "" },
      });
      jitsiApiRef.current = jitsi;
      setAudioMuted(!isOrganizer);
      setVideoMuted(!isOrganizer);

      jitsi.addEventListener("videoConferenceJoined", async () => {
        jitsi.executeCommand("displayName", user?.name || "Guest");
        if (user?.email) jitsi.executeCommand("email", user.email);
        if (isOrganizer) { jitsi.executeCommand("subject", event.title); try { await api.patch(`/events/${id}/stream/start`); } catch {} }
      });
      jitsi.addEventListener("audioMuteStatusChanged", ({ muted }) => setAudioMuted(muted));
      jitsi.addEventListener("videoMuteStatusChanged", ({ muted }) => setVideoMuted(muted));
      jitsi.addEventListener("videoConferenceLeft", async () => {
        if (jitsiApiRef.current) { jitsiApiRef.current.dispose(); jitsiApiRef.current = null; }
        if (isOrganizer) { try { await api.patch(`/events/${id}/stream/end`); } catch {} setStreamEnded(true); clearInterval(timerRef.current); }
        else { navigate(`${rolePrefix}/events/${id}`); }
      });
      jitsi.addEventListener("readyToClose", () => { if (jitsiApiRef.current) { jitsiApiRef.current.dispose(); jitsiApiRef.current = null; } navigate(`${rolePrefix}/events/${id}`); });
    } catch (err) { console.error("Jitsi init failed:", err); }
  }, [event, id, user, isOrganizer, navigate, rolePrefix]);

  useEffect(() => {
    if (!event || (!isOrganizer && !streamStatus.isLive)) return;
    const load = () => { if (window.JitsiMeetExternalAPI) { startJitsi(); return; } const s = document.createElement("script"); s.src = "https://meet.jit.si/external_api.js"; s.async = true; s.onload = () => setTimeout(startJitsi, 300); document.head.appendChild(s); };
    const t = setTimeout(load, 500);
    return () => { clearTimeout(t); if (jitsiApiRef.current) { jitsiApiRef.current.dispose(); jitsiApiRef.current = null; } };
  }, [event, isOrganizer, streamStatus.isLive, startJitsi]);

  useEffect(() => {
    if (!id || !user) return;
    socket.emit("joinEventRoom", { eventId: id, userName: user.name });
    socket.on("eventViewerCount", (count) => setViewerCount(count));
    return () => { socket.emit("leaveEventRoom", { eventId: id }); socket.off("eventViewerCount"); };
  }, [id, user]);

  const handleRecordingUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const fd = new FormData(); fd.append("recording", file); await api.post(`/events/${id}/stream/recording`, fd, { headers: { "Content-Type": "multipart/form-data" } }); setRecordingUploaded(true); } catch {} finally { setUploading(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!event) return <div className="text-center py-20 text-gray-500">Event not found</div>;

  // ===== POST-STREAM =====
  if (streamEnded && isOrganizer) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Stream Completed</h2>
        <p className="text-gray-500 mb-1">Duration: {formatElapsed(elapsed)} · Peak: {viewerCount} viewers</p>
        <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">Upload Recording</h3>
          <p className="text-sm text-gray-500 mb-4">Upload so attendees can watch later.</p>
          {recordingUploaded ? (
            <p className="text-sm text-green-600 font-medium flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Uploaded</p>
          ) : (
            <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition ${uploading ? "bg-gray-100 text-gray-400" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Video className="w-4 h-4" /> Choose File</>}
              <input type="file" accept="video/*" onChange={handleRecordingUpload} disabled={uploading} className="hidden" />
            </label>
          )}
        </div>
        <div className="flex gap-3 justify-center mt-6">
          <Link to={`${rolePrefix}/events/${id}`} className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 transition">View Event</Link>
          <Link to="/organizer/dashboard" className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition">Dashboard</Link>
        </div>
      </div>
    );
  }

  // ===== WAITING ROOM =====
  if (!isOrganizer && !streamStatus.isLive) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {streamStatus.checking ? <Loader2 className="w-7 h-7 text-blue-500 animate-spin" /> : <Clock className="w-7 h-7 text-gray-400" />}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Waiting for host</h2>
          <p className="text-gray-500 text-sm mb-4">You'll be connected once the organizer starts streaming.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div> Checking...
          </div>
        </div>
      </div>
    );
  }

  // ===== LIVE STREAM =====
  return (
    <div ref={fullscreenRef} className={isFullscreen ? "fixed inset-0 z-[100] bg-black" : ""}>
      <div className={`relative bg-black rounded-xl overflow-hidden ${isFullscreen ? "w-full h-full" : "mx-auto"}`}
        style={isFullscreen ? {} : { aspectRatio: "16/9", maxHeight: "80vh", maxWidth: "100%" }}>

        {/* Jitsi Video */}
        <div ref={jitsiContainerRef} className="w-full h-full" />

        {/* === TOP-LEFT: Back + LIVE badge + viewers + timer === */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
          <Link to={`${rolePrefix}/events/${id}`} className="p-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/70 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
            {isOrganizer ? (
              <span className="flex items-center gap-1 text-xs font-bold text-red-400">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                <Wifi className="w-3 h-3" /> Live
              </span>
            )}
            <span className="w-px h-3 bg-white/20"></span>
            <span className="flex items-center gap-1 text-xs text-white/80">
              <Users className="w-3 h-3" /> {viewerCount}
            </span>
            <span className="w-px h-3 bg-white/20"></span>
            <span className="text-xs text-white/60 font-mono">{formatElapsed(elapsed)}</span>
          </div>
        </div>

        {/* === TOP-RIGHT: Chat toggle + Fullscreen === */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
          <button onClick={() => setChatOpen(!chatOpen)}
            className={`p-2 rounded-lg backdrop-blur-sm transition ${chatOpen ? "bg-blue-500/30 text-blue-300" : "bg-black/50 text-white/70 hover:text-white"}`}
            title="Toggle chat">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen}
            className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white/70 hover:text-white transition"
            title="Fullscreen (F)">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* === RIGHT: Glass Chat Overlay === */}
        {chatOpen && (
          <div className="absolute top-12 right-3 bottom-12 w-72 z-20 flex flex-col bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
            <LiveChat eventId={id} user={user} isOrganizer={isOrganizer} isFullscreen={isFullscreen} />
          </div>
        )}

        {/* === BOTTOM CENTER: Controls === */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
          <button onClick={toggleAudio} className={`p-2 rounded-lg transition ${audioMuted ? "bg-red-500/20 text-red-400" : "text-white hover:bg-white/10"}`} title={audioMuted ? "Unmute" : "Mute"}>
            {audioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button onClick={toggleVideo} className={`p-2 rounded-lg transition ${videoMuted ? "bg-red-500/20 text-red-400" : "text-white hover:bg-white/10"}`} title={videoMuted ? "Camera on" : "Camera off"}>
            {videoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>
          <button onClick={toggleScreenShare} className="p-2 rounded-lg text-white hover:bg-white/10 transition" title="Screen share">
            <MonitorUp className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/20 mx-0.5"></div>
          <button onClick={hangup} className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition" title="Leave">
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>

        {/* === BOTTOM LEFT: Watermark === */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 text-white/15 text-[10px] font-semibold pointer-events-none">
          <Calendar className="w-3 h-3" /> Evently
        </div>
      </div>
    </div>
  );
}
