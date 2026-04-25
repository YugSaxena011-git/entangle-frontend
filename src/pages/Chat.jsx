import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Send,
  Lock,
  UserPlus,
  Users,
  MessageCircle,
  Eye,
  Bell,
  Sparkles,
  Radio,
} from "lucide-react";
import { motion } from "framer-motion";
import useSound from "use-sound";

export default function Chat({ chat }) {
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState(false);
  const [tamperMode, setTamperMode] = useState(false);
  const [oneTime, setOneTime] = useState(false);
  const [newContact, setNewContact] = useState("");

  const {
    messages,
    joined,
    isConnecting,
    currentUser,
    secretKey,
    contacts,
    recentChats,
    selectedContact,
    activeRoomId,
    unreadMap,
    consumedMessages,
    setSecretKey,
    addContact,
    connectToPrivateChat,
    sendMessage,
    markMessageConsumed,
  } = chat;

  const chatBoxRef = useRef(null);
  const lastTypeTime = useRef(0);

  // Applied the volume and pitch-shift hack for the haptic feel
  const [playTyping] = useSound("/sounds/typing.mp3", {
    volume: 0.2,
    playbackRate: 0.6,
    interrupt: true,
  });
  const [playClick] = useSound("/sounds/click.mp3", { volume: 0.3 });

  const makeMessageKey = useCallback((msg) =>
    [
      msg.id || "",
      msg.roomId || "",
      msg.sender || "",
      msg.type || "",
      msg.content || "",
      msg.createdAtEpoch || 0,
      msg.timestamp || "",
    ].join("|"), []);

  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime = a.createdAtEpoch ?? 0;
      const bTime = b.createdAtEpoch ?? 0;
      if (aTime !== bTime) return aTime - bTime;
      return makeMessageKey(a).localeCompare(makeMessageKey(b));
    });
  }, [messages, makeMessageKey]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [orderedMessages]);

  const handleJoinPrivateChat = useCallback((contactName) => {
    connectToPrivateChat(currentUser, contactName, secretKey);
  }, [connectToPrivateChat, currentUser, secretKey]);

  const handleAddContact = async () => {
    if (!newContact.trim()) return;
    await addContact(newContact);
    setNewContact("");
  };

  const handleSendMessage = useCallback(() => {
    if (!message.trim() || !selectedContact || !activeRoomId) return;

    playClick();

    const messageType = oneTime ? "ONE_TIME" : priority ? "PRIORITY" : "CHAT";

    sendMessage(
      currentUser,
      activeRoomId,
      secretKey,
      message,
      messageType,
      tamperMode
    );

    setMessage("");
    setPriority(false);
    setTamperMode(false);
    setOneTime(false);
  }, [message, selectedContact, activeRoomId, oneTime, priority, playClick, sendMessage, currentUser, secretKey, tamperMode]);

  const handleMessageKeyDown = (e) => {
    if (e.repeat) return;

    const silentKeys = [
      "Shift", "Control", "Alt", "Meta", "CapsLock", 
      "Tab", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    ];

    if (silentKeys.includes(e.key)) return;
    if (e.key === "Backspace" && message.length === 0) return;

    if (e.key === "Enter") {
      handleSendMessage();
      return;
    }

    // THE FIX: Ultra-fast 25ms throttle instead of 100ms
    const now = Date.now();
    if (now - lastTypeTime.current > 25) {
      
      // 1. True physical haptic for mobile devices (super light 10ms tap)
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10); 
      }
      
      // 2. Audio fallback for desktop
      playTyping();
      
      lastTypeTime.current = now;
    }
  };

  const handleClearSession = useCallback(() => {
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("username");
    localStorage.removeItem("displayName");
    sessionStorage.removeItem("sessionToken");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("displayName");
    window.location.reload();
  }, []);

  const getMessageStyle = useCallback((msg) => {
    if (msg.type === "ONE_TIME") {
      return "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-100 shadow-[0_0_15px_rgba(217,70,239,0.15)]";
    }
    if (msg.type === "PRIORITY") {
      return "border-indigo-500/50 bg-indigo-500/10 text-indigo-200";
    }
    if (msg.integrityStatus === "TAMPERED") {
      return "border-red-500/80 bg-red-500/15 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-[pulse_2s_ease-in-out_infinite]";
    }
    if (msg.integrityStatus === "VERIFIED") {
      return "border-emerald-500/30 bg-emerald-500/5 text-emerald-200";
    }
    if (
      msg.integrityStatus === "DENIED" ||
      msg.integrityStatus === "JOIN_LOCKED"
    ) {
      return "border-orange-500/50 bg-orange-500/10 text-orange-200";
    }
    if (msg.type === "JOIN" || msg.type === "LEAVE") {
      return "border-cyan-500/30 bg-cyan-500/5 text-cyan-200";
    }
    return "border-slate-700/50 bg-slate-800/40 text-slate-200";
  }, []);

  const verifiedCount = orderedMessages.filter(
    (m) => m.integrityStatus === "VERIFIED"
  ).length;

  const tamperedCount = orderedMessages.filter(
    (m) => m.integrityStatus === "TAMPERED"
  ).length;

  return (
    <div className="w-full max-w-[1900px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_260px] 2xl:grid-cols-[300px_minmax(0,1fr)_300px] gap-4 lg:gap-5 h-[calc(100vh-10rem)] min-h-[500px]">
        
        {/* Left Sidebar */}
        <aside className="min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5 h-full overflow-y-auto custom-scrollbar pr-1 lg:pr-2 pb-6">
          <OperatorCard
            currentUser={currentUser}
            secretKey={secretKey}
            setSecretKey={setSecretKey}
            joined={joined}
            isConnecting={isConnecting}
            newContact={newContact}
            setNewContact={setNewContact}
            handleAddContact={handleAddContact}
          />

          <ListCard
            title="Recent Chats"
            icon={<MessageCircle size={16} />}
            accent="text-emerald-400"
            empty="No recent chats yet."
          >
            {recentChats.map((chatItem) => {
              const active = selectedContact === chatItem.contact;
              const preview =
                chatItem.lastMessage?.plainContent ||
                chatItem.lastMessage?.content ||
                "[Encrypted]";
              const time = chatItem.lastMessage?.timestamp || "";
              const unread = unreadMap[chatItem.roomId] || 0;

              return (
                <ConversationButton
                  key={chatItem.contact}
                  active={active}
                  title={chatItem.contact}
                  subtitle={preview}
                  time={time}
                  unread={unread}
                  onClick={() => handleJoinPrivateChat(chatItem.contact)}
                  activeClass="border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  hoverClass="hover:border-emerald-500/30 hover:bg-emerald-500/5"
                />
              );
            })}
          </ListCard>

          <ListCard
            title="Contacts"
            icon={<Users size={16} />}
            accent="text-cyan-400"
            empty="No contacts added yet."
          >
            {contacts.map((contact) => {
              const active = selectedContact === contact;

              return (
                <button
                  key={contact}
                  onClick={() => handleJoinPrivateChat(contact)}
                  className={`w-full min-w-0 rounded-xl border px-3 py-3 text-left transition-all ${
                    active
                      ? "border-indigo-500/50 bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                      : "border-white/5 bg-white/5 text-slate-300 hover:border-indigo-500/30 hover:bg-indigo-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex items-center gap-2">
                      <Users size={16} className="shrink-0 text-slate-400" />
                      <span className="truncate font-mono text-xs xl:text-sm uppercase tracking-wide">
                        {contact}
                      </span>
                    </div>

                    {active && (
                      <span className="shrink-0 text-[9px] xl:text-[10px] font-mono uppercase tracking-widest text-indigo-300">
                        Active
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </ListCard>
        </aside>

        {/* Center Panel */}
        <motion.section
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-w-0 flex flex-col rounded-3xl border border-white/10 bg-black/50 backdrop-blur-2xl shadow-2xl overflow-hidden h-full shrink-0"
        >
          <div className="shrink-0 border-b border-white/10 bg-white/[0.03] px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="text-[9px] xl:text-[10px] uppercase tracking-[0.2em] font-mono text-slate-500 truncate">
                  Encrypted Channel
                </div>

                <div className="mt-1 flex items-center gap-2.5 min-w-0">
                  <div
                    className={`shrink-0 h-2.5 w-2.5 rounded-full shadow-lg ${
                      joined ? "bg-emerald-400 shadow-emerald-400/50" : "bg-slate-600"
                    }`}
                  />
                  <h2 className="truncate text-lg md:text-xl xl:text-2xl font-bold text-white tracking-wide">
                    {selectedContact ? `@${selectedContact}` : "Awaiting Target"}
                  </h2>
                </div>
              </div>

              <div className="hidden sm:flex shrink-0 items-center gap-2 xl:gap-4">
                <StatusPill
                  label={joined ? "Connected" : isConnecting ? "Connecting" : "Idle"}
                  tone={joined ? "emerald" : isConnecting ? "indigo" : "slate"}
                />

                <button
                  onClick={handleClearSession}
                  className="rounded-xl border border-red-500/30 px-3 py-2 text-[9px] xl:text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all whitespace-nowrap"
                >
                  Clear Session
                </button>
              </div>
            </div>
            
            <div className="mt-4 xl:hidden grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MiniMetric label="Verified" value={verifiedCount} tone="emerald" />
              <MiniMetric label="Threats" value={tamperedCount} tone="red" />
              <MiniMetric label="Mode" value={joined ? "Secure" : "Idle"} tone="indigo" />
              <MiniMetric label="Status" value="Live" tone="cyan" />
            </div>
          </div>

          <div
            ref={chatBoxRef}
            className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 lg:px-8 py-6 space-y-5 flex flex-col custom-scrollbar"
          >
            {orderedMessages.length === 0 ? (
              <div className="m-auto max-w-sm text-center px-4">
                <div className="mx-auto mb-5 flex h-16 w-16 xl:h-20 xl:w-20 items-center justify-center rounded-3xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                  <Radio size={28} />
                </div>
                <h3 className="text-lg xl:text-xl font-bold text-white tracking-wide">
                  {selectedContact ? "Channel Secured" : "Establish Connection"}
                </h3>
                <p className="mt-2 text-xs xl:text-sm text-slate-400 font-mono leading-relaxed">
                  {selectedContact
                    ? "Start the encrypted conversation using Quantum Veil. All packets are end-to-end verified."
                    : "Choose a contact from the terminal panel to open a secure channel."}
                </p>
              </div>
            ) : (
              orderedMessages.map((msg, i) => {
                const isMine = msg.sender === currentUser;
                const msgKey = makeMessageKey(msg);
                const consumed = consumedMessages.has(msgKey);

                const shownText =
                  msg.type === "ONE_TIME" && consumed
                    ? "⚛ Wavefunction collapsed. Data purged."
                    : msg.plainContent ||
                      (msg.type === "JOIN" || msg.type === "LEAVE"
                        ? msg.content
                        : "[Encrypted payload]");

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.1) }}
                    key={`${msgKey}-${i}`}
                    className={`flex flex-col max-w-[92%] lg:max-w-[85%] xl:max-w-[75%] ${
                      isMine ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <div className="mb-1.5 flex max-w-full items-center gap-2 px-1">
                      <span className="shrink-0 text-[9px] xl:text-[10px] font-mono text-indigo-400/80">
                        [{msg.timestamp || "--"}]
                      </span>

                      <span className="truncate text-[9px] xl:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {msg.sender || "UNKNOWN"}
                      </span>

                      {msg.type === "ONE_TIME" && (
                        <span className="shrink-0 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/20 px-2 py-0.5 text-[8px] xl:text-[9px] font-bold uppercase tracking-widest text-fuchsia-300 hidden sm:inline-block">
                          Heisenberg
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (msg.type === "ONE_TIME" && !consumed) {
                          markMessageConsumed(msgKey);
                        }
                      }}
                      className={`max-w-full rounded-2xl border px-4 lg:px-5 py-3 text-left text-sm xl:text-base leading-relaxed break-words backdrop-blur-md transition-all ${getMessageStyle(
                        msg
                      )}`}
                    >
                      <div className="font-medium tracking-wide min-w-0">{shownText}</div>

                      {msg.integrityStatus && (
                        <div className="mt-2.5 flex items-center gap-2 border-t border-current/10 pt-2 text-[9px] xl:text-[10px] uppercase tracking-wider opacity-80 font-mono">
                          <span className="block h-1.5 w-1.5 rounded-full bg-current shrink-0"></span>
                          <span className="truncate">Integrity: {msg.integrityStatus}</span>
                        </div>
                      )}

                      {msg.type === "ONE_TIME" && !consumed && (
                        <div className="mt-2.5 flex items-center gap-2 text-[9px] xl:text-[10px] font-bold uppercase tracking-widest text-fuchsia-300 bg-fuchsia-500/10 p-2 rounded-lg border border-fuchsia-500/20">
                          <Eye size={14} className="shrink-0" />
                          <span className="truncate">Tap once to observe</span>
                        </div>
                      )}
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="shrink-0 border-t border-white/10 bg-black/60 p-4 lg:p-5 backdrop-blur-xl">
            <div className="mb-3 flex flex-wrap items-center gap-x-4 lg:gap-x-5 gap-y-2">
              <ModeCheck
                label="Priority"
                checked={priority}
                disabled={!joined || oneTime}
                onChange={(e) => setPriority(e.target.checked)}
                color="indigo"
              />
              <ModeCheck
                label="Tamper"
                checked={tamperMode}
                disabled={!joined}
                onChange={(e) => setTamperMode(e.target.checked)}
                color="red"
              />
              <ModeCheck
                label="Heisenberg"
                checked={oneTime}
                disabled={!joined || priority}
                onChange={(e) => setOneTime(e.target.checked)}
                color="fuchsia"
              />
            </div>

            <div className="flex items-center gap-2 lg:gap-3 rounded-2xl border border-white/15 bg-white/[0.03] p-1.5 lg:p-2 focus-within:border-indigo-500/60 focus-within:bg-white/[0.05] transition-all shadow-inner min-w-0">
              <Lock size={16} className="ml-2 lg:ml-3 shrink-0 text-slate-400 hidden sm:block" />

              <input
                type="text"
                maxLength={250}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleMessageKeyDown}
                placeholder={
                  joined
                    ? oneTime
                      ? `Drafting collapsible payload...`
                      : `Drafting encrypted payload...`
                    : "Awaiting active connection..."
                }
                disabled={!joined}
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm xl:text-base text-white font-mono outline-none placeholder:text-slate-600 disabled:opacity-40"
              />

              <button
                onClick={handleSendMessage}
                disabled={!joined}
                className="shrink-0 rounded-xl bg-indigo-600 p-2.5 lg:p-3 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:shadow-none"
              >
                <Send size={16} className={message.length > 0 ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Right Sidebar - Fixes applied here */}
        <aside className="hidden xl:flex min-w-0 flex-col gap-4 h-full overflow-y-auto custom-scrollbar pl-2 pb-10">
          <PanelCard glow="emerald">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-70" />
            <h3 className="mb-3 text-[10px] xl:text-xs font-mono uppercase tracking-widest font-bold text-slate-400">
              Quantum Veil Status
            </h3>

            <div className="space-y-3">
              <StateLine
                icon={<ShieldCheck size={18} />}
                color="text-emerald-400"
                title={`Veil ${joined ? "Active" : "Idle"}`}
                desc={
                  joined
                    ? `Tunnel established with ${selectedContact || "contact"}`
                    : "No active target selected"
                }
              />

              <StateLine
                icon={<Sparkles size={18} />}
                color="text-fuchsia-400"
                title="Heisenberg Protocol"
                desc="One-time payloads collapse structurally post-observation"
              />

              <StateLine
                icon={<ShieldAlert size={18} />}
                color={tamperedCount > 0 ? "text-red-400" : "text-slate-500"}
                title="Threat Detection"
                desc={`${tamperedCount} tampered packet(s) intercepted`}
              />
            </div>
          </PanelCard>

          <PanelCard>
            <h3 className="mb-3 text-[10px] xl:text-xs font-mono uppercase tracking-widest font-bold text-slate-400">
              Session Metadata
            </h3>

            <div className="space-y-2">
              <InfoRow label="Operator" value={currentUser || "N/A"} />
              <InfoRow label="Target" value={selectedContact || "N/A"} />
              <InfoRow label="Room ID" value={activeRoomId || "N/A"} />
            </div>
          </PanelCard>

          <PanelCard>
            <h3 className="mb-3 text-[10px] xl:text-xs font-mono uppercase tracking-widest font-bold text-slate-400">
              Packet Metrics
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <MiniMetric label="Verified" value={verifiedCount} tone="emerald" />
              <MiniMetric label="Threats" value={tamperedCount} tone="red" />
              <MiniMetric label="Total" value={orderedMessages.length} tone="indigo" />
              <MiniMetric label="Mode" value={oneTime ? "H" : "Q"} tone="cyan" />
            </div>
          </PanelCard>
        </aside>
      </div>
    </div>
  );
}

// Subcomponents

function OperatorCard({ currentUser, secretKey, setSecretKey, joined, isConnecting, newContact, setNewContact, handleAddContact }) {
  return (
    <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-2xl shadow-xl min-w-0 shrink-0">
      <div className="mb-3 flex items-center gap-2 text-indigo-400 min-w-0">
        <Terminal size={18} className="shrink-0" />
        <h3 className="text-[10px] xl:text-xs font-mono uppercase tracking-widest font-bold truncate">Operator Console</h3>
      </div>
      <div className="space-y-2.5 min-w-0">
        <input type="text" value={currentUser} disabled className="w-full min-w-0 rounded-xl border border-slate-700 bg-black/60 p-2.5 text-[11px] xl:text-sm text-slate-300 font-mono outline-none opacity-80 cursor-not-allowed" />
        <input type="text" placeholder="Entanglement Key" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} disabled={joined || isConnecting} className="w-full min-w-0 rounded-xl border border-slate-700 bg-black/60 p-2.5 text-[11px] xl:text-sm text-white font-mono outline-none placeholder:text-slate-600 focus:border-indigo-500/50 transition-colors" />
      </div>
      <div className="mt-3 border-t border-white/10 pt-3 min-w-0">
        <div className="mb-2 flex items-center gap-2 text-violet-400 min-w-0">
          <UserPlus size={14} className="shrink-0" />
          <h4 className="text-[10px] xl:text-xs font-mono uppercase tracking-widest font-bold truncate">Add Target</h4>
        </div>
        <div className="flex gap-2 min-w-0">
          <input type="text" placeholder="username" value={newContact} onChange={(e) => setNewContact(e.target.value.toLowerCase())} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-black/60 p-2.5 text-[11px] xl:text-sm text-white font-mono outline-none placeholder:text-slate-600 focus:border-violet-500/50 transition-colors" />
          <button onClick={handleAddContact} disabled={!newContact.trim()} className="shrink-0 rounded-xl bg-indigo-600 px-3 xl:px-4 text-[9px] xl:text-[10px] font-bold font-mono uppercase tracking-widest text-white hover:bg-indigo-500 transition-colors disabled:opacity-50">Add</button>
        </div>
      </div>
    </motion.section>
  );
}

function ListCard({ title, icon, accent, empty, children }) {
  return (
    <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-2xl shadow-xl flex flex-col flex-1 min-h-[180px] min-w-0">
      <div className={`mb-3 flex items-center gap-2 min-w-0 ${accent}`}>
        <div className="shrink-0">{icon}</div>
        <h4 className="text-[10px] xl:text-xs font-mono uppercase tracking-widest font-bold truncate">{title}</h4>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 min-w-0">
        {React.Children.count(children) > 0 ? children : <div className="text-[11px] xl:text-xs text-slate-500 font-mono mt-1">{empty}</div>}
      </div>
    </motion.section>
  );
}

function ConversationButton({ active, title, subtitle, time, unread, onClick, activeClass, hoverClass }) {
  return (
    <button onClick={onClick} className={`w-full min-w-0 rounded-xl border px-3 py-2 text-left transition-all ${active ? `${activeClass} text-white` : `border-white/5 bg-white/5 text-slate-300 ${hoverClass}`}`}>
      <div className="mb-1 flex items-center justify-between gap-2 min-w-0">
        <span className="truncate font-mono text-[11px] xl:text-xs font-bold uppercase tracking-wide min-w-0">{title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {unread > 0 && <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">{unread}</span>}
          <span className="whitespace-nowrap text-[8px] xl:text-[9px] text-slate-500 font-mono">{time}</span>
        </div>
      </div>
      <div className="truncate text-[9px] xl:text-[10px] text-slate-400 font-mono opacity-80 min-w-0">{subtitle}</div>
    </button>
  );
}

function PanelCard({ children, glow }) {
  return <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-2xl shadow-xl min-w-0 shrink-0">{children}</section>;
}

function StateLine({ icon, color, title, desc }) {
  return (
    <div className="flex items-start gap-3 border-t border-white/10 pt-3 first:border-t-0 first:pt-0 min-w-0">
      <div className={`${color} mt-0.5 drop-shadow-md shrink-0`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className={`${color} text-[9px] xl:text-[10px] font-bold uppercase tracking-wider truncate`}>{title}</p>
        <p className="mt-0.5 text-[9px] xl:text-[10px] leading-relaxed text-slate-400 font-mono line-clamp-2">{desc}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 hover:bg-white/[0.04] transition-colors min-w-0">
      <div className="text-[8px] xl:text-[9px] font-bold uppercase tracking-widest text-slate-500 font-mono truncate">{label}</div>
      <div className="mt-0.5 truncate text-[11px] xl:text-xs text-slate-200 font-mono">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value, tone }) {
  const tones = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    red: "border-red-500/30 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
    indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]",
    slate: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  };
  return (
    <div className={`rounded-xl border p-2.5 min-w-0 ${tones[tone] || tones.slate}`}>
      <div className="text-[8px] xl:text-[9px] uppercase font-bold tracking-widest font-mono opacity-70 truncate">{label}</div>
      <div className="mt-1 truncate text-base xl:text-lg font-bold font-mono">{value}</div>
    </div>
  );
}

function StatusPill({ label, tone }) {
  const tones = {
    emerald: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    indigo: "border-indigo-500/40 bg-indigo-500/15 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]",
    slate: "border-slate-500/30 bg-slate-500/15 text-slate-300",
  };
  return (
    <div className={`rounded-xl border px-2.5 py-1.5 text-[8px] xl:text-[9px] font-bold uppercase tracking-[0.2em] font-mono whitespace-nowrap ${tones[tone] || tones.slate}`}>
      {label}
    </div>
  );
}

function ModeCheck({ label, checked, disabled, onChange, color = "indigo" }) {
  const colorMap = {
    indigo: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]",
    red: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
    fuchsia: "bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]",
  };
  return (
    <label className={`flex items-center gap-1.5 cursor-pointer transition-opacity shrink-0 ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"}`}>
      <div className="relative flex items-center shrink-0">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="sr-only" />
        <div className={`block w-7 h-4 rounded-full transition-colors duration-300 ease-in-out border border-white/10 ${checked ? "bg-white/10" : "bg-black/50"}`}></div>
        <div className={`absolute left-0.5 top-[2px] w-3 h-3 rounded-full transition-all duration-300 ease-in-out ${checked ? `translate-x-3.5 ${colorMap[color] || colorMap.indigo}` : "translate-x-0 bg-slate-500"}`}></div>
      </div>
      <span className="select-none text-[9px] xl:text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400 whitespace-nowrap">{label}</span>
    </label>
  );
}