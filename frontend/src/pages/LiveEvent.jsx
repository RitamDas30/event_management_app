import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import socket from "../utils/socket";
import LiveChat from "../components/LiveChat";
import {
  ArrowLeft, Wifi, Users, MessageSquare, Clock, Loader2,
  Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Calendar,
} from "lucide-react";
import clsx from "clsx";

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

  useEffect(() => {
    const h = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) setChatOpen(true); 
    };
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  useEffect(() => {
    const wrap = fullscreenRef.current;
    if (!wrap) return;
    const reclaim = () => {
      if (document.activeElement?.tagName === "IFRAME") {
        try { document.activeElement.blur(); } catch {}
        window.focus();
      }
    };
    wrap.addEventListener("mousemove", reclaim);
    wrap.addEventListener("mousedown", reclaim);
    return () => {
      wrap.removeEventListener("mousemove", reclaim);
      wrap.removeEventListener("mousedown", reclaim);
    };
  }, []);

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
        roomName: roomId,
        parentNode: jitsiContainerRef.current,
        userInfo: { displayName: user?.name || "Guest", email: user?.email || "" },
        configOverwrite: {
          startWithAudioMuted: !isOrganizer,
          startWithVideoMuted: !isOrganizer,
          startSilent: !isOrganizer,
          prejoinPageEnabled: false,
          disableProfile: true,
          hideLoginButton: true,
          disableInviteFunctions: true,
          enableLobbyChat: false,
          hideConferenceSubject: true,
          hideConferenceTimer: true,
          hideParticipantsStats: true,
          hideRecordingLabel: true,
          disablePolls: true,
          disableReactions: true,
          toolbarButtons: [],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DEFAULT_REMOTE_DISPLAY_NAME: "Attendee",
          TOOLBAR_ALWAYS_VISIBLE: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          VIDEO_LAYOUT_FIT: "both",
        },
      });
      jitsiApiRef.current = jitsi;
      setAudioMuted(!isOrganizer);
      setVideoMuted(!isOrganizer);

      jitsi.addEventListener("videoConferenceJoined", async () => {
        jitsi.executeCommand("displayName", user?.name || "Guest");
        if (isOrganizer) { jitsi.executeCommand("subject", event.title); try { await api.patch(`/events/${id}/stream/start`); } catch {} }
        setTimeout(() => { try { jitsi.getIFrame()?.blur(); } catch {} window.focus(); }, 250);
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

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div></div>;
  if (!event) return <div className="text-center py-32 text-surface-500">Event not found</div>;

  // ===== POST-STREAM =====
  if (streamEnded && isOrganizer) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-200 dark:border-emerald-500/20">
          <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="font-semibold text-4xl text-surface-950 dark:text-surface-50 mb-3">Broadcast Concluded</h2>
        <p className="text-surface-500 text-lg mb-10">Duration: {formatElapsed(elapsed)} <span className="mx-2">·</span> Peak: {viewerCount} viewers</p>
        
        <div className="bg-surface-50 dark:bg-surface-900 border border-border rounded-3xl p-8 text-left mb-8 shadow-surface">
          <h3 className="font-medium text-surface-950 dark:text-surface-50 mb-2">Preserve Recording</h3>
          <p className="text-sm text-surface-500 mb-6">Upload the recording archive for attendees who missed the live session.</p>
          {recordingUploaded ? (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Archive Uploaded Successfully
            </div>
          ) : (
            <label className={clsx("flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-medium cursor-pointer transition-colors border", uploading ? "bg-surface-100 dark:bg-surface-800 text-surface-400 border-transparent" : "bg-surface-50 dark:bg-surface-950 text-surface-950 dark:text-surface-50 border-border hover:border-surface-400")}>
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Video className="w-4 h-4" /> Select Video File</>}
              <input type="file" accept="video/*" onChange={handleRecordingUpload} disabled={uploading} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={`${rolePrefix}/events/${id}`} className="px-6 py-3 rounded-full text-sm font-medium bg-surface-50 dark:bg-surface-900 border border-border text-surface-900 dark:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">Event Details</Link>
          <Link to="/organizer/dashboard" className="px-6 py-3 rounded-full text-sm font-medium bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-glow">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  // ===== WAITING ROOM =====
  if (!isOrganizer && !streamStatus.isLive) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md bg-surface-50 dark:bg-surface-900 border border-border p-12 rounded-[2.5rem] shadow-surface">
          <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 border border-border rounded-full flex items-center justify-center mx-auto mb-8">
            {streamStatus.checking ? <Loader2 className="w-8 h-8 text-brand-500 animate-spin" /> : <Clock className="w-8 h-8 text-surface-400" />}
          </div>
          <h2 className="font-semibold text-3xl text-surface-950 dark:text-surface-50 mb-3">Awaiting Broadcast</h2>
          <p className="text-surface-500 text-sm mb-8 leading-relaxed">The event stream will commence shortly. You will be connected automatically once the organizer initiates the broadcast.</p>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase text-surface-400">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div> Polling status
          </div>
        </div>
      </div>
    );
  }

  // ===== LIVE STREAM =====
  const VideoOverlays = ({ insideFullscreen }) => (
    <>
      <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
        <Link to={`${rolePrefix}/events/${id}`} className="w-10 h-10 flex items-center justify-center bg-surface-950/60 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white hover:bg-surface-950/80 transition-colors shadow-lg">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3 bg-surface-950/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-lg">
          {isOrganizer ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              <Wifi className="w-3 h-3" /> Connected
            </span>
          )}
          <span className="w-1 h-1 rounded-full bg-white/20"></span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80"><Users className="w-3.5 h-3.5" /> {viewerCount}</span>
          <span className="w-1 h-1 rounded-full bg-white/20"></span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-mono">{formatElapsed(elapsed)}</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        {insideFullscreen && (
          <button onClick={() => setChatOpen(!chatOpen)}
            className={clsx("w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border transition-colors shadow-lg", chatOpen ? "bg-brand-500/20 border-brand-500/30 text-brand-300" : "bg-surface-950/60 border-white/10 text-white/70 hover:text-white")}
            title="Toggle chat">
            <MessageSquare className="w-4 h-4" />
          </button>
        )}
        <button onClick={toggleFullscreen}
          className="w-10 h-10 flex items-center justify-center bg-surface-950/60 backdrop-blur-md border border-white/10 rounded-full text-white/70 hover:text-white hover:bg-surface-950/80 transition-colors shadow-lg"
          title="Fullscreen (F)">
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-surface-950/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
        <button onClick={toggleAudio} className={clsx("w-10 h-10 flex items-center justify-center rounded-xl transition-colors", audioMuted ? "bg-red-500/20 text-red-400" : "text-white hover:bg-white/10")} title={audioMuted ? "Unmute" : "Mute"}>
          {audioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button onClick={toggleVideo} className={clsx("w-10 h-10 flex items-center justify-center rounded-xl transition-colors", videoMuted ? "bg-red-500/20 text-red-400" : "text-white hover:bg-white/10")} title={videoMuted ? "Camera on" : "Camera off"}>
          {videoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>
        <button onClick={toggleScreenShare} className="w-10 h-10 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition-colors" title="Screen share">
          <MonitorUp className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-white/20 mx-1"></div>
        <button onClick={hangup} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors shadow-glow" title="Leave">
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-4 left-6 z-10 flex items-center gap-1.5 text-white/20 text-[10px] font-bold uppercase tracking-widest pointer-events-none">
        <Calendar className="w-3 h-3" /> Evently Broadcast
      </div>
    </>
  );

  return (
    <div
      ref={fullscreenRef}
      className={clsx(
        isFullscreen ? "fixed inset-0 z-[100] bg-surface-950" : "w-full h-[calc(100vh-8rem)]"
      )}
    >
      <div className={clsx("flex gap-6 w-full h-full", isFullscreen ? "relative" : "")}>
        
        {/* Video Player */}
        <div className={clsx(
          "relative bg-surface-950 overflow-hidden shadow-2xl",
          isFullscreen ? "absolute inset-0" : "flex-1 rounded-[2.5rem] ring-1 ring-border"
        )}>
          <div ref={jitsiContainerRef} className="absolute inset-0" />
          <VideoOverlays insideFullscreen={isFullscreen} />
        </div>

        {/* Live Chat */}
        <div className={clsx(
          "flex flex-col bg-surface-50 dark:bg-surface-900 border border-border shadow-surface overflow-hidden transition-opacity duration-300",
          isFullscreen ? "absolute top-6 right-6 bottom-6 w-80 z-20 bg-surface-950/80 backdrop-blur-xl border-white/10 rounded-3xl" : "w-80 lg:w-96 rounded-[2.5rem] shrink-0",
          (!chatOpen && isFullscreen) && "opacity-0 pointer-events-none"
        )}>
          <LiveChat eventId={id} user={user} isOrganizer={isOrganizer} isFullscreen={isFullscreen} />
        </div>

      </div>
    </div>
  );
}
