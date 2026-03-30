import { useState, useEffect, useRef } from "react";
import socket from "../utils/socket";
import {
  Send, Pin, PinOff, BarChart3, X, ThumbsUp, Heart, Laugh,
  PartyPopper, Flame, Check, ChevronDown, Crown,
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

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    socket.emit("sendEventChatMessage", { eventId, userName: user.name, message: newMessage.trim(), isHost: isOrganizer });
    setNewMessage("");
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
    <div className={`bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0 ${isFullscreen ? "w-80" : "w-72"}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Live Chat</h3>
        <div className="flex items-center gap-1">
          {isOrganizer && (
            <button onClick={() => setShowPollForm(!showPollForm)} className="p-1 rounded text-gray-400 hover:text-blue-400 hover:bg-gray-800 transition" title="Create Poll">
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] text-gray-500">{messages.length}</span>
        </div>
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
        <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700">
          <form onSubmit={createPoll} className="space-y-1.5">
            <input type="text" value={pollForm.question} onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })} placeholder="Poll question..." className="w-full bg-gray-800 text-white text-xs px-2 py-1.5 rounded placeholder-gray-500 focus:outline-none" />
            {pollForm.options.map((opt, idx) => (
              <div key={idx} className="flex gap-1">
                <input type="text" value={opt} onChange={(e) => { const o = [...pollForm.options]; o[idx] = e.target.value; setPollForm({ ...pollForm, options: o }); }}
                  placeholder={`Option ${idx + 1}`} className="flex-1 bg-gray-800 text-white text-xs px-2 py-1 rounded placeholder-gray-500 focus:outline-none" />
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
                  <p className="text-sm text-gray-200 break-words leading-relaxed">{msg.message}</p>

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
        <div className="px-3 py-1.5 border-t border-gray-800 flex flex-wrap gap-1.5">
          {activeStackedKeys.map(([key, data]) => (
            <span key={key} className="inline-flex items-center gap-1 bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full animate-pulse">
              {key} <span className="text-blue-400 font-bold">×{data.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="p-2 border-t border-gray-800">
        <div className="flex gap-1.5">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
