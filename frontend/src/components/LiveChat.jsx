import { useState, useEffect, useRef } from "react";
import socket from "../utils/socket";
import api from "../api/axios";
import {
  Send, Pin, PinOff, BarChart3, X, ThumbsUp, Heart, Laugh,
  PartyPopper, Flame, Check, ChevronDown, Crown, Plus,
  Paperclip, FileText, Image, File, Download, ExternalLink,
} from "lucide-react";

const quickReactions = ["ok", "okay", "yes", "no", "nice", "great", "thanks", "thank you", "lol", "haha", "👍", "❤️", "🔥", "👏", "💯"];
const reactionEmojis = [
  { emoji: "👍", icon: ThumbsUp },
  { emoji: "❤️", icon: Heart },
  { emoji: "😂", icon: Laugh },
  { emoji: "🎉", icon: PartyPopper },
  { emoji: "🔥", icon: Flame },
];

export default function LiveChat({ eventId, user, isOrganizer, isFullscreen }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [activePoll, setActivePoll] = useState(null);
  const [pollForm, setPollForm] = useState({ question: "", options: ["", ""] });
  const [showPollForm, setShowPollForm] = useState(false);
  const [myVote, setMyVote] = useState(null);
  const [stackedReactions, setStackedReactions] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const chatEndRef = useRef(null);
  const reactionTimerRef = useRef({});

  useEffect(() => {
    if (!eventId || !user) return;

    socket.on("eventChatMessage", (msg) => {
      // Check if it's a quick reaction that should be stacked
      const normalized = msg.message.toLowerCase().trim();
      if (quickReactions.includes(normalized)) {
        setStackedReactions((prev) => {
          const key = normalized;
          const existing = prev[key] || { count: 0, lastUser: "", timestamp: Date.now() };
          return { ...prev, [key]: { count: existing.count + 1, lastUser: msg.userName, timestamp: Date.now() } };
        });
        // Auto-clear stacked reactions after 30 seconds of no new ones
        if (reactionTimerRef.current[normalized]) clearTimeout(reactionTimerRef.current[normalized]);
        reactionTimerRef.current[normalized] = setTimeout(() => {
          setStackedReactions((prev) => { const n = { ...prev }; delete n[normalized]; return n; });
        }, 30000);
        return; // Don't add to main chat
      }
      setMessages((prev) => [...prev, { ...msg, id: Date.now() + Math.random(), reactions: {} }]);
    });

    socket.on("eventPinnedMessage", (msg) => setPinnedMessage(msg));
    socket.on("eventUnpinMessage", () => setPinnedMessage(null));

    socket.on("eventPoll", (poll) => {
      setActivePoll(poll);
      setMyVote(null);
    });
    socket.on("eventPollUpdate", (poll) => setActivePoll(poll));
    socket.on("eventPollEnd", () => { setActivePoll(null); setMyVote(null); });

    socket.on("eventMessageReaction", ({ messageId, emoji, userName }) => {
      setMessages((prev) => prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...m.reactions };
        if (!reactions[emoji]) reactions[emoji] = [];
        if (!reactions[emoji].includes(userName)) reactions[emoji] = [...reactions[emoji], userName];
        return { ...m, reactions };
      }));
    });

    return () => {
      socket.off("eventChatMessage");
      socket.off("eventPinnedMessage");
      socket.off("eventUnpinMessage");
      socket.off("eventPoll");
      socket.off("eventPollUpdate");
      socket.off("eventPollEnd");
      socket.off("eventMessageReaction");
    };
  }, [eventId, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stackedReactions]);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Link detection regex
  const urlRegex = /(https?:\/\/[^\s<]+)/g;

  // Only render clickable links for host messages
  const renderMessageText = (text, msgIsHost) => {
    if (!msgIsHost || !urlRegex.test(text)) return text;
    urlRegex.lastIndex = 0;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        urlRegex.lastIndex = 0;
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all inline-flex items-center gap-0.5">
            {part.length > 40 ? part.slice(0, 40) + "…" : part}
            <ExternalLink className="w-3 h-3 inline flex-shrink-0" />
          </a>
        );
      }
      return part;
    });
  };

  const getFileIcon = (type) => {
    if (type?.startsWith("image/")) return Image;
    if (type?.includes("pdf")) return FileText;
    return File;
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    // /poll command
    if (text.startsWith("/poll ") && isOrganizer) {
      const pollText = text.slice(6).trim();
      // Format: /poll Question? Option1, Option2, Option3
      const qMarkIdx = pollText.indexOf("?");
      if (qMarkIdx > 0) {
        const question = pollText.slice(0, qMarkIdx + 1).trim();
        const options = pollText.slice(qMarkIdx + 1).split(",").map((o) => o.trim()).filter(Boolean);
        if (options.length >= 2) {
          const poll = {
            question,
            options: options.map((o) => ({ text: o, votes: 0 })),
            totalVotes: 0,
            id: Date.now(),
          };
          socket.emit("createEventPoll", { eventId, poll });
          setActivePoll(poll);
          setNewMessage("");
          return;
        }
      }
      // If format is wrong, show help
      setNewMessage("");
      setMessages((prev) => [...prev, {
        id: Date.now(), userName: "System", message: "Poll format: /poll Question? Option1, Option2, Option3",
        isHost: false, isSystem: true, reactions: {},
      }]);
      return;
    }

    socket.emit("sendEventChatMessage", { eventId, userName: user.name, message: text, isHost: isOrganizer });
    setNewMessage("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setMessages((prev) => [...prev, {
        id: Date.now(), userName: "System", message: "File too large. Max 10MB.",
        isHost: false, isSystem: true, reactions: {},
      }]);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file); // using existing Cloudinary upload middleware
      const res = await api.put("/users/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      // Use the returned URL — we're reusing avatar endpoint for file upload
      const fileUrl = res.data.avatar;

      socket.emit("sendEventChatMessage", {
        eventId,
        userName: user.name,
        message: fileUrl,
        isHost: isOrganizer,
        attachment: {
          url: fileUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      });
    } catch (err) {
      // Fallback: send file name as text if upload fails
      socket.emit("sendEventChatMessage", {
        eventId, userName: user.name,
        message: `📎 Shared file: ${file.name} (upload failed)`,
        isHost: isOrganizer,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const pinMessage = (msg) => {
    socket.emit("pinEventMessage", { eventId, message: msg });
    setPinnedMessage(msg);
  };

  const unpinMessage = () => {
    socket.emit("unpinEventMessage", { eventId });
    setPinnedMessage(null);
  };

  const createPoll = (e) => {
    e.preventDefault();
    if (!pollForm.question.trim() || pollForm.options.filter((o) => o.trim()).length < 2) return;
    const poll = {
      question: pollForm.question.trim(),
      options: pollForm.options.filter((o) => o.trim()).map((o) => ({ text: o.trim(), votes: 0 })),
      totalVotes: 0,
      id: Date.now(),
    };
    socket.emit("createEventPoll", { eventId, poll });
    setActivePoll(poll);
    setShowPollForm(false);
    setPollForm({ question: "", options: ["", ""] });
  };

  const votePoll = (optionIndex) => {
    if (myVote !== null) return;
    setMyVote(optionIndex);
    socket.emit("voteEventPoll", { eventId, optionIndex, userName: user.name });
  };

  const endPoll = () => {
    socket.emit("endEventPoll", { eventId });
    setActivePoll(null);
  };

  const reactToMessage = (messageId, emoji) => {
    socket.emit("reactToEventMessage", { eventId, messageId, emoji, userName: user.name });
    setShowReactionPicker(null);
  };

  const activeStackedKeys = Object.entries(stackedReactions).filter(([, v]) => v.count > 0);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm drop-shadow">Live Chat</h3>
        <span className="text-[10px] text-white/50">{messages.length}</span>
      </div>

      {/* Pinned Message */}
      {pinnedMessage && (
        <div className="px-3 py-2 bg-amber-900/30 border-b border-amber-800/30 flex items-start gap-2">
          <Pin className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-amber-400">{pinnedMessage.userName}</p>
            <p className="text-xs text-amber-200 truncate">{pinnedMessage.message}</p>
          </div>
          {isOrganizer && (
            <button onClick={unpinMessage} className="text-amber-500 hover:text-amber-300 flex-shrink-0"><X className="w-3 h-3" /></button>
          )}
        </div>
      )}

      {/* Active Poll */}
      {activePoll && (
        <div className="px-3 py-2 bg-purple-900/30 border-b border-purple-800/30">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-purple-300">{activePoll.question}</p>
            {isOrganizer && <button onClick={endPoll} className="text-[9px] text-purple-400 hover:text-purple-200">End</button>}
          </div>
          <div className="space-y-1">
            {activePoll.options.map((opt, idx) => {
              const pct = activePoll.totalVotes > 0 ? Math.round((opt.votes / activePoll.totalVotes) * 100) : 0;
              const voted = myVote === idx;
              return (
                <button key={idx} onClick={() => votePoll(idx)} disabled={myVote !== null}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs relative overflow-hidden transition ${
                    voted ? "ring-1 ring-purple-400" : myVote !== null ? "opacity-80" : "hover:bg-purple-800/30"
                  }`}>
                  <div className="absolute inset-0 bg-purple-600/20 rounded" style={{ width: `${pct}%` }} />
                  <div className="relative flex items-center justify-between">
                    <span className={`${voted ? "text-purple-200 font-semibold" : "text-gray-300"}`}>
                      {voted && <Check className="w-3 h-3 inline mr-1" />}{opt.text}
                    </span>
                    <span className="text-[10px] text-purple-400 font-medium">{pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-purple-500 mt-1">{activePoll.totalVotes} vote{activePoll.totalVotes !== 1 ? "s" : ""}</p>
        </div>
      )}

      {/* Poll Creation Form */}
      {showPollForm && isOrganizer && (
        <div className="px-3 py-2 bg-white/5 border-b border-white/10">
          <form onSubmit={createPoll} className="space-y-1.5">
            <input type="text" value={pollForm.question} onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })} placeholder="Poll question..." className="w-full bg-white/10 text-white text-xs px-2 py-1.5 rounded placeholder-gray-500 focus:outline-none" />
            {pollForm.options.map((opt, idx) => (
              <div key={idx} className="flex gap-1">
                <input type="text" value={opt} onChange={(e) => { const o = [...pollForm.options]; o[idx] = e.target.value; setPollForm({ ...pollForm, options: o }); }}
                  placeholder={`Option ${idx + 1}`} className="flex-1 bg-white/10 text-white text-xs px-2 py-1 rounded placeholder-gray-500 focus:outline-none" />
                {pollForm.options.length > 2 && <button type="button" onClick={() => setPollForm({ ...pollForm, options: pollForm.options.filter((_, i) => i !== idx) })} className="text-gray-500 hover:text-red-400"><X className="w-3 h-3" /></button>}
              </div>
            ))}
            <div className="flex gap-1.5">
              {pollForm.options.length < 5 && <button type="button" onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ""] })} className="text-[10px] text-blue-400 hover:text-blue-300">+ Option</button>}
              <div className="flex-1" />
              <button type="button" onClick={() => setShowPollForm(false)} className="text-[10px] text-gray-400 px-2 py-1">Cancel</button>
              <button type="submit" className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded font-medium hover:bg-purple-700">Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 && activeStackedKeys.length === 0 ? (
          <p className="text-gray-500 text-xs text-center mt-8">No messages yet. Say hi!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="group relative">
              <div className="flex gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                  msg.isHost ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                }`}>
                  {msg.isHost ? <Crown className="w-3 h-3" /> : msg.userName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold ${msg.isHost ? "text-amber-400" : "text-blue-400"}`}>
                      {msg.userName}
                    </span>
                    {msg.isHost && (
                      <span className="text-[8px] font-bold bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded uppercase tracking-wider">Host</span>
                    )}
                  </div>
                  {/* File attachment */}
                  {msg.attachment ? (
                    <div className="mt-1">
                      {msg.attachment.type?.startsWith("image/") ? (
                        <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={msg.attachment.url} alt={msg.attachment.name} className="max-w-[200px] max-h-[150px] rounded-lg border border-gray-700 hover:opacity-90 transition" />
                        </a>
                      ) : (
                        <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 hover:bg-gray-750 transition max-w-[220px]">
                          {(() => { const FIcon = getFileIcon(msg.attachment.type); return <FIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />; })()}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-200 font-medium truncate">{msg.attachment.name}</p>
                            <p className="text-[10px] text-gray-500">{(msg.attachment.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <Download className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className={`text-sm break-words leading-relaxed ${msg.isSystem ? "text-gray-500 italic" : "text-gray-200"}`}>
                      {renderMessageText(msg.message, msg.isHost)}
                    </p>
                  )}

                  {/* Reactions on this message */}
                  {Object.keys(msg.reactions || {}).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(msg.reactions).map(([emoji, users]) => (
                        <span key={emoji} className="inline-flex items-center gap-0.5 bg-gray-800 rounded-full px-1.5 py-0.5 text-[10px]">
                          {emoji} <span className="text-gray-400">{users.length}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover actions */}
                <div className="hidden group-hover:flex items-center gap-0.5 absolute -top-1 right-0 bg-gray-800 rounded-lg border border-gray-700 p-0.5">
                  {reactionEmojis.map((r) => (
                    <button key={r.emoji} onClick={() => reactToMessage(msg.id, r.emoji)} className="p-1 hover:bg-gray-700 rounded text-xs" title={r.emoji}>
                      {r.emoji}
                    </button>
                  ))}
                  {isOrganizer && (
                    <button onClick={() => pinMessage(msg)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-amber-400" title="Pin"><Pin className="w-3 h-3" /></button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Stacked Quick Reactions (floating above input) */}
      {activeStackedKeys.length > 0 && (
        <div className="px-3 py-1.5 border-t border-white/10 flex flex-wrap gap-1.5">
          {activeStackedKeys.map(([key, data]) => (
            <span key={key} className="inline-flex items-center gap-1 bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full animate-pulse">
              {key} <span className="text-blue-400 font-bold">×{data.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Plus Menu (organizer only — pops up above input) */}
      {showPlusMenu && isOrganizer && (
        <div className="px-2 pb-1 pt-2 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 space-y-1">
            <button onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-gray-700 transition">
              <Paperclip className="w-4 h-4 text-blue-400" /> Send File
            </button>
            <button onClick={() => { setShowPollForm(!showPollForm); setShowPlusMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-gray-700 transition">
              <BarChart3 className="w-4 h-4 text-purple-400" /> Create Poll
            </button>
            {pinnedMessage && (
              <button onClick={() => { unpinMessage(); setShowPlusMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-gray-700 transition">
                <PinOff className="w-4 h-4 text-amber-400" /> Unpin Message
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input (organizer only) */}
      {isOrganizer && (
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt" />
      )}

      {/* Upload indicator */}
      {uploading && (
        <div className="px-3 py-1.5 border-t border-white/10 flex items-center gap-2 text-xs text-blue-400">
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          Uploading file...
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="p-2 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          {isOrganizer && (
            <button type="button" onClick={() => setShowPlusMenu(!showPlusMenu)}
              className={`p-2 rounded-lg transition flex-shrink-0 ${showPlusMenu ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
              <Plus className={`w-5 h-5 transition-transform duration-200 ${showPlusMenu ? "rotate-45" : ""}`} />
            </button>
          )}
          <input type="text" value={newMessage} onChange={(e) => { setNewMessage(e.target.value); if (showPlusMenu) setShowPlusMenu(false); }}
            placeholder={isOrganizer ? "Message or /poll Question? A, B, C" : "Type a message..."}
            className="flex-1 bg-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <button type="submit" className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
