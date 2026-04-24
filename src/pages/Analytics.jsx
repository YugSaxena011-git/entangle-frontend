import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Activity,
  AlertOctagon,
  ShieldCheck,
  Radio,
  MessageSquare,
  User,
  KeyRound,
} from "lucide-react";

export default function Analytics({ chat }) {
  const { messages = [], joined = false } = chat || {};

  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime = a.createdAtEpoch ?? 0;
      const bTime = b.createdAtEpoch ?? 0;
      return aTime - bTime;
    });
  }, [messages]);

  const totalMessages = orderedMessages.filter(
    (msg) => msg.type === "CHAT" || msg.type === "PRIORITY"
  ).length;

  const verifiedMessages = orderedMessages.filter(
    (msg) => msg.integrityStatus === "VERIFIED"
  ).length;

  const tamperedMessages = orderedMessages.filter(
    (msg) =>
      msg.integrityStatus === "TAMPERED" ||
      msg.integrityStatus === "DENIED" ||
      msg.integrityStatus === "JOIN_LOCKED"
  ).length;

  const priorityMessages = orderedMessages.filter(
    (msg) => msg.type === "PRIORITY"
  ).length;

  const activeRoom =
    orderedMessages.length > 0
      ? orderedMessages[orderedMessages.length - 1]?.roomId || "N/A"
      : "N/A";

  const latestOperator =
    orderedMessages.length > 0
      ? orderedMessages[orderedMessages.length - 1]?.sender || "N/A"
      : "N/A";

  const recentActivity = orderedMessages.slice(-6).reverse();

  const chartBuckets = useMemo(() => {
    const onlyMessages = orderedMessages.filter(
      (msg) => msg.type === "CHAT" || msg.type === "PRIORITY"
    );

    const buckets = new Array(6).fill(0);

    if (onlyMessages.length === 0) return buckets;

    onlyMessages.forEach((_, index) => {
      const bucketIndex = Math.min(
        5,
        Math.floor((index / Math.max(onlyMessages.length, 1)) * 6)
      );
      buckets[bucketIndex] += 1;
    });

    const max = Math.max(...buckets, 1);

    return buckets.map((value) => Math.round((value / max) * 100));
  }, [orderedMessages]);

  const stats = [
    {
      label: "Total Packets",
      value: String(totalMessages).padStart(2, "0"),
      icon: <MessageSquare size={20} />,
      color: "text-indigo-400",
      border: "border-indigo-500/30",
      bg: "bg-indigo-500/5",
    },
    {
      label: "Verified Secure",
      value: String(verifiedMessages).padStart(2, "0"),
      icon: <ShieldCheck size={20} />,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/5",
    },
    {
      label: "Tampered / Blocked",
      value: String(tamperedMessages).padStart(2, "0"),
      icon: <AlertOctagon size={20} />,
      color: "text-red-400",
      border: "border-red-500/30",
      bg: "bg-red-500/5",
    },
    {
      label: "Priority Routing",
      value: String(priorityMessages).padStart(2, "0"),
      icon: <Radio size={20} />,
      color: "text-violet-400",
      border: "border-violet-500/30",
      bg: "bg-violet-500/5",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 w-full max-w-[1900px] mx-auto h-full flex flex-col min-h-0">
      
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0 border-b border-white/10 pb-4 lg:pb-6">
        <h2 className="text-2xl lg:text-3xl font-bold uppercase tracking-tight text-white">
          Network Analytics
        </h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 shrink-0 min-w-0">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            key={i}
            className={`p-5 lg:p-6 bg-black/40 backdrop-blur-2xl border-t-2 border-x border-b border-white/10 rounded-3xl relative overflow-hidden group shadow-xl ${stat.bg} min-w-0`}
          >
            <div
              className={`absolute top-0 right-0 p-4 lg:p-5 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500 ${stat.color}`}
            >
              {stat.icon}
            </div>
            <p className="font-mono text-[9px] xl:text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3 truncate">
              {stat.label}
            </p>
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className={`text-4xl lg:text-5xl font-bold tracking-tighter ${stat.color} drop-shadow-[0_0_15px_currentColor] truncate`}
            >
              {stat.value}
            </motion.p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-4 lg:gap-6 min-h-0 flex-1">
        
        {/* Left: Chart Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="p-6 lg:p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col relative shadow-xl min-w-0"
        >
          <div className="flex justify-between items-center mb-8 shrink-0">
            <h3 className="font-mono text-[10px] xl:text-xs font-bold uppercase tracking-widest text-slate-400 truncate">
              Message Flow Distribution
            </h3>
            <span className={`text-[9px] xl:text-[10px] font-bold font-mono px-2.5 py-1.5 rounded-lg border uppercase tracking-widest whitespace-nowrap shrink-0 ${joined ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
              {joined ? "LIVE SESSION" : "IDLE"}
            </span>
          </div>

          <div className="flex-1 flex items-end justify-between gap-3 relative min-h-[150px]">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full h-[1px] bg-white" />
              ))}
            </div>

            {chartBuckets.map((height, i) => (
              <div
                key={i}
                className="w-full flex justify-center group relative h-full items-end"
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black/80 backdrop-blur text-indigo-300 border border-indigo-500/30 font-mono font-bold text-[9px] py-1.5 px-2.5 rounded-lg transition-all z-20 shadow-[0_0_15px_rgba(99,102,241,0.3)] pointer-events-none">
                  {height}%
                </div>

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{
                    duration: 0.9,
                    delay: 0.35 + i * 0.05,
                    type: "spring",
                    stiffness: 50,
                  }}
                  className="w-full max-w-[48px] bg-gradient-to-t from-indigo-900/50 to-indigo-500/80 border-t border-indigo-400 rounded-t-sm group-hover:from-indigo-600/80 group-hover:to-indigo-400 transition-colors relative shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                >
                  <div className="absolute top-0 left-0 w-full h-4 bg-indigo-400 blur-md opacity-50" />
                </motion.div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-5 border-t border-white/10 pt-5 text-[9px] xl:text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest shrink-0">
            <span>Start</span>
            <span>Flow</span>
            <span>Live</span>
            <span>Recent</span>
          </div>
        </motion.div>

        {/* Right: Snapshot & Activity Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="p-6 lg:p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-xl flex flex-col min-w-0"
        >
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="font-mono text-[10px] xl:text-xs font-bold uppercase tracking-widest text-slate-400 truncate">
              Session Metadata
            </h3>
            <span className="text-[9px] xl:text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 uppercase tracking-widest shrink-0 whitespace-nowrap">
              MONITOR
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6 shrink-0 min-w-0">
            <div className="p-3.5 lg:p-4 rounded-2xl border border-white/5 bg-white/[0.02] min-w-0">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-400 min-w-0">
                <Server size={14} className="shrink-0" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest truncate">Room</span>
              </div>
              <div className="text-base lg:text-lg font-bold text-white font-mono truncate">{activeRoom}</div>
            </div>

            <div className="p-3.5 lg:p-4 rounded-2xl border border-white/5 bg-white/[0.02] min-w-0">
              <div className="flex items-center gap-2 mb-1.5 text-violet-400 min-w-0">
                <User size={14} className="shrink-0" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest truncate">Operator</span>
              </div>
              <div className="text-base lg:text-lg font-bold text-white font-mono truncate">{latestOperator}</div>
            </div>

            <div className="p-3.5 lg:p-4 rounded-2xl border border-white/5 bg-white/[0.02] min-w-0">
              <div className="flex items-center gap-2 mb-1.5 text-emerald-400 min-w-0">
                <ShieldCheck size={14} className="shrink-0" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest truncate">Network</span>
              </div>
              <div className="text-base lg:text-lg font-bold text-white font-mono truncate">{joined ? "CONNECTED" : "OFFLINE"}</div>
            </div>

            <div className="p-3.5 lg:p-4 rounded-2xl border border-white/5 bg-white/[0.02] min-w-0">
              <div className="flex items-center gap-2 mb-1.5 text-amber-400 min-w-0">
                <KeyRound size={14} className="shrink-0" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest truncate">Security</span>
              </div>
              <div className="text-base lg:text-lg font-bold text-white font-mono truncate">{verifiedMessages > 0 ? "ACTIVE" : "STANDBY"}</div>
            </div>
          </div>

          <div className="flex flex-col min-h-0 flex-1">
            <h4 className="font-mono text-[9px] xl:text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 shrink-0">
              Terminal Log (Recent)
            </h4>

            <div className="space-y-2.5 overflow-y-auto custom-scrollbar pr-2 flex-1 min-w-0">
              {recentActivity.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono mt-2">
                  Awaiting signal...
                </div>
              ) : (
                recentActivity.map((msg, i) => (
                  <motion.div
                    key={`${msg.sender}-${msg.timestamp}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-3.5 rounded-xl border border-white/5 bg-black/40 min-w-0"
                  >
                    <div className="flex justify-between gap-3 text-[8px] lg:text-[9px] font-bold uppercase tracking-widest font-mono text-slate-500 mb-2 min-w-0">
                      <span className="truncate text-indigo-400/80">{msg.sender || "Unknown"}</span>
                      <span className="shrink-0">{msg.timestamp || "--"}</span>
                    </div>

                    <div className="text-xs lg:text-sm text-slate-300 font-mono line-clamp-2">
                      {msg.content || "[Empty Buffer]"}
                    </div>

                    <div className="mt-2.5 flex items-center gap-2 text-[8px] lg:text-[9px] font-bold uppercase tracking-widest font-mono min-w-0">
                      <span className="text-slate-500">{msg.type || "CHAT"}</span>
                      <span className="text-slate-600">·</span>
                      <span className={msg.integrityStatus === 'VERIFIED' ? 'text-emerald-400/80' : msg.integrityStatus === 'TAMPERED' ? 'text-red-400/80' : 'text-slate-500'}>
                        {msg.integrityStatus || "N/A"}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}