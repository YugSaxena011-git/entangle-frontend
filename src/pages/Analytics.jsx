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
      label: "Total Messages",
      value: String(totalMessages).padStart(2, "0"),
      icon: <MessageSquare size={20} />,
      color: "text-indigo-400",
      border: "border-indigo-500/30",
    },
    {
      label: "Verified Secure",
      value: String(verifiedMessages).padStart(2, "0"),
      icon: <ShieldCheck size={20} />,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    {
      label: "Tampered / Blocked",
      value: String(tamperedMessages).padStart(2, "0"),
      icon: <AlertOctagon size={20} />,
      color: "text-red-400",
      border: "border-red-500/30",
    },
    {
      label: "Priority Messages",
      value: String(priorityMessages).padStart(2, "0"),
      icon: <Radio size={20} />,
      color: "text-violet-400",
      border: "border-violet-500/30",
    },
  ];

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-3xl font-bold uppercase tracking-tight">
          Secure Chat Dashboard
        </h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            key={i}
            className={`p-6 bg-black/40 backdrop-blur-xl border-t-2 border-x border-b border-white/5 rounded-2xl relative overflow-hidden group ${stat.border}`}
          >
            <div
              className={`absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity ${stat.color}`}
            >
              {stat.icon}
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-4">
              {stat.label}
            </p>
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className={`text-5xl font-bold tracking-tighter ${stat.color} drop-shadow-[0_0_15px_currentColor]`}
            >
              {stat.value}
            </motion.p>
          </motion.div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="p-8 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl h-96 flex flex-col relative"
        >
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-mono text-xs uppercase tracking-widest text-slate-400">
              Message Activity Distribution
            </h3>
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">
              {joined ? "LIVE SESSION" : "IDLE"}
            </span>
          </div>

          <div className="flex-1 flex items-end justify-between gap-2 relative">
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
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-black text-indigo-300 border border-indigo-500/30 font-mono text-[10px] py-1 px-3 rounded transition-all z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
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
                  className="w-full max-w-[44px] bg-gradient-to-t from-indigo-900/50 to-indigo-500/80 border-t border-indigo-400 rounded-t-sm group-hover:from-indigo-600/80 group-hover:to-indigo-400 transition-colors relative"
                >
                  <div className="absolute top-0 left-0 w-full h-4 bg-indigo-400 blur-md opacity-50" />
                </motion.div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4 border-t border-white/10 pt-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span>Start</span>
            <span>Flow</span>
            <span>Live</span>
            <span>Recent</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="p-8 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-mono text-xs uppercase tracking-widest text-slate-400">
              Session Snapshot
            </h3>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30">
              MONITOR
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
              <div className="flex items-center gap-2 mb-2 text-indigo-400">
                <Server size={16} />
                <span className="font-mono text-[11px] uppercase tracking-widest">
                  Active Room
                </span>
              </div>
              <div className="text-xl font-bold text-white break-all">
                {activeRoom}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
              <div className="flex items-center gap-2 mb-2 text-violet-400">
                <User size={16} />
                <span className="font-mono text-[11px] uppercase tracking-widest">
                  Latest Operator
                </span>
              </div>
              <div className="text-xl font-bold text-white break-all">
                {latestOperator}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <ShieldCheck size={16} />
                <span className="font-mono text-[11px] uppercase tracking-widest">
                  Session Status
                </span>
              </div>
              <div className="text-xl font-bold text-white">
                {joined ? "CONNECTED" : "OFFLINE"}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
              <div className="flex items-center gap-2 mb-2 text-amber-400">
                <KeyRound size={16} />
                <span className="font-mono text-[11px] uppercase tracking-widest">
                  Security Mode
                </span>
              </div>
              <div className="text-xl font-bold text-white">
                {verifiedMessages > 0 ? "ACTIVE" : "STANDBY"}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-4">
              Recent Activity
            </h4>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {recentActivity.length === 0 ? (
                <div className="text-sm text-slate-500 font-mono">
                  No live activity yet.
                </div>
              ) : (
                recentActivity.map((msg, i) => (
                  <motion.div
                    key={`${msg.sender}-${msg.timestamp}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-4 rounded-xl border border-white/5 bg-black/20"
                  >
                    <div className="flex justify-between gap-4 text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-2">
                      <span>{msg.sender || "Unknown"}</span>
                      <span>{msg.timestamp || "--"}</span>
                    </div>

                    <div className="text-sm text-slate-200 break-words">
                      {msg.content || "No content"}
                    </div>

                    <div className="mt-2 text-[10px] uppercase tracking-widest font-mono text-slate-500">
                      {msg.type || "CHAT"} · {msg.integrityStatus || "N/A"}
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