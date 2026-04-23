import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Send,
  Lock,
  Radio,
  UserPlus,
  Users,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import useSound from "use-sound";

export default function Chat({ chat }) {
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState(false);
  const [tamperMode, setTamperMode] = useState(false);
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
    setSecretKey,
    addContact,
    connectToPrivateChat,
    sendMessage,
  } = chat;

  const chatBoxRef = useRef(null);

  const [playTyping] = useSound("/sounds/typing.mp3", {
    volume: 0.1,
    interrupt: false,
  });
  const [playClick] = useSound("/sounds/click.mp3", { volume: 0.3 });

  const makeMessageKey = (msg) => {
    return [
      msg.roomId || "",
      msg.sender || "",
      msg.type || "",
      msg.content || "",
      msg.createdAtEpoch || 0,
      msg.timestamp || "",
    ].join("|");
  };

  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime = a.createdAtEpoch ?? 0;
      const bTime = b.createdAtEpoch ?? 0;
      if (aTime !== bTime) return aTime - bTime;
      return makeMessageKey(a).localeCompare(makeMessageKey(b));
    });
  }, [messages]);

  const handleJoinPrivateChat = (contactName) => {
    connectToPrivateChat(currentUser, contactName, secretKey);
  };

  const handleAddContact = async () => {
    if (!newContact.trim()) return;
    await addContact(newContact);
    setNewContact("");
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedContact || !activeRoomId) return;

    playClick();

    const messageType = priority ? "PRIORITY" : "CHAT";

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
  };

  const handleMessageKeyDown = (e) => {
    if (e.repeat) return;

    const silentKeys = [
      "Shift",
      "Control",
      "Alt",
      "Meta",
      "CapsLock",
      "Tab",
      "Escape",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ];
    if (silentKeys.includes(e.key)) return;

    if (e.key === "Backspace" && message.length === 0) return;

    if (e.key === "Enter") {
      handleSendMessage();
      return;
    }

    playTyping();
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [orderedMessages]);

  const getMessageStyle = (msg) => {
    if (msg.type === "PRIORITY") {
      return "border-indigo-500/50 bg-indigo-500/10 text-indigo-200";
    }
    if (msg.integrityStatus === "TAMPERED") {
      return "border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
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
    return "border-slate-700/50 bg-slate-800/30 text-slate-200";
  };

  const verifiedCount = orderedMessages.filter(
    (m) => m.integrityStatus === "VERIFIED"
  ).length;
  const tamperedCount = orderedMessages.filter(
    (m) => m.integrityStatus === "TAMPERED"
  ).length;

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col xl:flex-row gap-8 w-full max-w-7xl mx-auto">
      <div className="w-full xl:w-80 flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5"
        >
          <div className="flex items-center gap-2 mb-6 text-indigo-400">
            <Terminal size={18} />
            <h3 className="text-xs font-mono uppercase tracking-widest font-bold">
              Operator Setup
            </h3>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={currentUser}
              disabled
              className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:outline-none placeholder:text-slate-600 opacity-70"
            />

            <input
              type="text"
              placeholder="Enter Secret Key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              disabled={joined || isConnecting}
              className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="mt-6 border-t border-white/5 pt-5">
            <div className="flex items-center gap-2 mb-4 text-violet-400">
              <UserPlus size={16} />
              <h4 className="text-xs font-mono uppercase tracking-widest font-bold">
                Add Contact
              </h4>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="username"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value.toLowerCase())}
                className="flex-1 bg-black/50 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:outline-none placeholder:text-slate-600"
              />
              <button
                onClick={handleAddContact}
                className="px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase tracking-widest"
              >
                Add
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.06 }}
          className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5"
        >
          <div className="flex items-center gap-2 mb-5 text-emerald-400">
            <MessageCircle size={16} />
            <h4 className="text-xs font-mono uppercase tracking-widest font-bold">
              Recent Chats
            </h4>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {recentChats.length === 0 ? (
              <div className="text-sm text-slate-500 font-mono">
                No recent chats yet.
              </div>
            ) : (
              recentChats.map((chatItem) => {
                const active = selectedContact === chatItem.contact;
                const preview =
                  chatItem.lastMessage?.content || "No messages yet";
                const time = chatItem.lastMessage?.timestamp || "";

                return (
                  <button
                    key={chatItem.contact}
                    onClick={() => handleJoinPrivateChat(chatItem.contact)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                      active
                        ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                        : "border-white/5 bg-white/5 text-slate-300 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-mono text-sm uppercase tracking-wide">
                        {chatItem.contact}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {time}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {preview}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5"
        >
          <div className="flex items-center gap-2 mb-5 text-cyan-400">
            <Users size={16} />
            <h4 className="text-xs font-mono uppercase tracking-widest font-bold">
              Contacts
            </h4>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {contacts.length === 0 ? (
              <div className="text-sm text-slate-500 font-mono">
                No contacts added yet.
              </div>
            ) : (
              contacts.map((contact) => {
                const active = selectedContact === contact;
                return (
                  <button
                    key={contact}
                    onClick={() => handleJoinPrivateChat(contact)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                      active
                        ? "border-indigo-500/50 bg-indigo-500/10 text-white"
                        : "border-white/5 bg-white/5 text-slate-300 hover:border-indigo-500/30 hover:bg-indigo-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Users size={16} />
                        <span className="font-mono text-sm uppercase tracking-wide">
                          {contact}
                        </span>
                      </div>
                      {active && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 }}
          className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 flex-1 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-slate-500 mb-6">
            Security State
          </h3>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <ShieldCheck
                className="text-emerald-400 mt-1 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                size={24}
              />
              <div>
                <p className="text-emerald-400 font-bold uppercase tracking-wider text-sm">
                  Line {joined ? "Secured" : "Idle"}
                </p>
                <p className="text-slate-500 text-xs font-mono mt-1">
                  {joined
                    ? `Private chat with ${selectedContact || "contact"}`
                    : "Select a contact to connect"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-6 border-t border-white/5">
              <ShieldAlert
                className="text-red-400 mt-1 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                size={24}
              />
              <div>
                <p className="text-red-400 font-bold uppercase tracking-wider text-sm">
                  Threats
                </p>
                <p className="text-slate-500 text-xs font-mono mt-1">
                  {tamperedCount} tampered event(s)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-6 border-t border-white/5">
              <Radio
                className="text-indigo-400 mt-1 drop-shadow-[0_0_10px_rgba(99,102,241,0.35)]"
                size={24}
              />
              <div>
                <p className="text-indigo-400 font-bold uppercase tracking-wider text-sm">
                  Verified Flow
                </p>
                <p className="text-slate-500 text-xs font-mono mt-1">
                  {verifiedCount} verified message(s)
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-3 text-xs font-mono text-slate-500">
              <div>Operator: {currentUser || "N/A"}</div>
              <div>Contact: {selectedContact || "N/A"}</div>
              <div>Room: {activeRoomId || "N/A"}</div>
              <div>Status: {joined ? "CONNECTED" : "OFFLINE"}</div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative"
      >
        <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500">
              Private Conversation
            </div>
            <div className="text-xl font-bold text-white">
              {selectedContact ? `@${selectedContact}` : "Choose a contact"}
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500">
                Session
              </div>
              <div className="text-sm font-mono text-indigo-300">
                {joined ? "Connected" : isConnecting ? "Connecting..." : "Idle"}
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("sessionToken");
                localStorage.removeItem("username");
                localStorage.removeItem("displayName");
                window.location.reload();
              }}
              className="rounded-lg border border-red-500/30 px-3 py-2 text-[10px] uppercase tracking-widest text-red-300 hover:bg-red-500/10"
            >
              Clear Device Session
            </button>
          </div>
        </div>

        <div
          ref={chatBoxRef}
          className="flex-1 p-8 overflow-y-auto space-y-6 flex flex-col"
        >
          {orderedMessages.length === 0 ? (
            <div className="m-auto text-center text-slate-500 font-mono text-sm">
              {selectedContact
                ? "No private messages yet. Start the conversation."
                : "Select a contact from the left panel."}
            </div>
          ) : (
            orderedMessages.map((msg, i) => {
              const isMine = msg.sender === currentUser;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }}
                  key={`${makeMessageKey(msg)}-${i}`}
                  className={`flex flex-col max-w-[80%] ${
                    isMine ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <span className="text-[10px] font-mono text-indigo-400">
                      [{msg.timestamp || "--"}]
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {msg.sender || "UNKNOWN"}
                    </span>
                  </div>

                  <div
                    className={`px-5 py-3 rounded-xl border backdrop-blur-sm text-sm ${getMessageStyle(
                      msg
                    )}`}
                  >
                    <div>{msg.content}</div>
                    {msg.integrityStatus && (
                      <div className="mt-2 text-[10px] uppercase tracking-wider opacity-70">
                        Integrity: {msg.integrityStatus}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-black/60 border-t border-white/5">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={priority}
                onChange={(e) => setPriority(e.target.checked)}
                disabled={!joined}
              />
              Priority
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tamperMode}
                onChange={(e) => setTamperMode(e.target.checked)}
                disabled={!joined}
              />
              Tamper Mode
            </label>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2 pr-2 focus-within:border-indigo-500/50 transition-colors">
            <Lock size={16} className="text-slate-500 ml-3" />

            <input
              type="text"
              maxLength={200}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleMessageKeyDown}
              placeholder={
                joined
                  ? `Message ${selectedContact || "contact"}...`
                  : "Select and connect to a contact first..."
              }
              disabled={!joined}
              className="flex-1 bg-transparent px-2 py-2 focus:outline-none text-sm text-white font-mono placeholder:text-slate-600 disabled:opacity-50"
            />

            <button
              onClick={handleSendMessage}
              disabled={!joined}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 p-3 rounded-lg text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}