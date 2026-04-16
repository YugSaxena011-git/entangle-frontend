import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Server,
  KeyRound,
  Hash,
  Send,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import useSound from "use-sound";

const buildSimpleHash = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};

const StepCard = ({ title, description, icon, active, done, error }) => {
  let stateClasses =
    "border-white/5 bg-black/40 text-slate-300";

  if (error) {
    stateClasses =
      "border-red-500/40 bg-red-500/10 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.15)]";
  } else if (active) {
    stateClasses =
      "border-indigo-500/40 bg-indigo-500/10 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.18)]";
  } else if (done) {
    stateClasses =
      "border-emerald-500/30 bg-emerald-500/5 text-emerald-200";
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${stateClasses}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1">{icon}</div>
        <div>
          <div className="font-mono text-xs uppercase tracking-widest opacity-75 mb-2">
            {title}
          </div>
          <div className="text-sm leading-relaxed">{description}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Simulation() {
  const [message, setMessage] = useState("Hello bro");
  const [secretKey, setSecretKey] = useState("123");
  const [tamperMode, setTamperMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const [playHover] = useSound("/sounds/hover.mp3", { volume: 0.1 });
  const [playClick] = useSound("/sounds/click.mp3", { volume: 0.3 });

  const preparedMessage = useMemo(() => {
    return tamperMode ? `${message} [changed]` : message;
  }, [message, tamperMode]);

  const clientBase = `${message}|${secretKey}|CHAT`;
  const serverBase = `${preparedMessage}|${secretKey}|CHAT`;

  const clientHash = useMemo(() => buildSimpleHash(clientBase), [clientBase]);
  const serverHash = useMemo(() => buildSimpleHash(serverBase), [serverBase]);

  const keyMatch = secretKey.trim().length > 0;
  const integrityMatch = clientHash === serverHash;
  const verified = keyMatch && integrityMatch;

  const steps = [
    {
      title: "Step 1 · Message Created",
      description: `User types the message: "${message || "..."}"`,
      icon: <MessageSquare size={18} />,
    },
    {
      title: "Step 2 · Secret Key Attached",
      description: `The message is combined with room secret key: "${secretKey || "..."}"`,
      icon: <KeyRound size={18} />,
    },
    {
      title: "Step 3 · Hash Generated",
      description: `A security hash is generated on sender side: ${clientHash}`,
      icon: <Hash size={18} />,
    },
    {
      title: "Step 4 · Sent to Server",
      description: "The protected message is sent to backend for validation and delivery.",
      icon: <Send size={18} />,
    },
    {
      title: "Step 5 · Server Verification",
      description: verified
        ? "Server confirms key and integrity match."
        : !keyMatch
        ? "Server cannot verify because secret key is missing."
        : "Server detects message mismatch during integrity check.",
      icon: <Server size={18} />,
    },
    {
      title: "Step 6 · Final Result",
      description: verified
        ? "Message is VERIFIED and delivered securely."
        : "Message is marked TAMPERED or INVALID and is not trusted.",
      icon: verified ? <CheckCircle2 size={18} /> : <XCircle size={18} />,
    },
  ];

  const runSimulation = () => {
    if (!message.trim() || !secretKey.trim()) {
      alert("Please enter message and secret key.");
      return;
    }

    playClick();
    setIsRunning(true);
    setFinished(false);
    setStepIndex(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setStepIndex(current);

      if (current >= steps.length) {
        clearInterval(interval);
        setIsRunning(false);
        setFinished(true);
      }
    }, 700);
  };

  const resetSimulation = () => {
    playHover();
    setStepIndex(0);
    setIsRunning(false);
    setFinished(false);
    setTamperMode(false);
    setMessage("Hello bro");
    setSecretKey("123");
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-indigo-500/20 pb-8">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-indigo-400 mb-2"
          >
            <Activity className="animate-pulse" />
            <span className="font-mono text-sm tracking-widest uppercase">
              Secure Chat Working Demo
            </span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            How Your Chat App Works
          </h2>

          <p className="mt-4 text-slate-400 max-w-3xl text-sm md:text-base">
            This simulation shows the internal flow of your secure chat system:
            message creation, secret key usage, hash generation, backend checking,
            and final delivery result.
          </p>
        </div>

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(99,102,241,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={resetSimulation}
            className="px-6 py-3 border border-indigo-500/30 rounded-xl text-indigo-300 font-mono text-xs uppercase tracking-widest transition-colors"
          >
            Reset Demo
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={runSimulation}
            disabled={isRunning}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold tracking-widest uppercase transition-all ${
              isRunning
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            <Activity size={18} />
            {isRunning ? "Running..." : "Run Simulation"}
          </motion.button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5"
        >
          <h3 className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-6">
            Input Panel
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">
                Message
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isRunning}
                className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:outline-none placeholder:text-slate-600"
                placeholder="Type a message"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">
                Secret Key
              </label>
              <input
                type="text"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                disabled={isRunning}
                className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:outline-none placeholder:text-slate-600"
                placeholder="Enter secret key"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-300 font-mono">
              <input
                type="checkbox"
                checked={tamperMode}
                onChange={(e) => setTamperMode(e.target.checked)}
                disabled={isRunning}
              />
              Tamper Message During Transmission
            </label>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-2">
                Sender Side Hash
              </div>
              <div className="font-mono text-sm text-indigo-300 break-all">
                {clientHash}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-2">
                Server Side Hash
              </div>
              <div className="font-mono text-sm text-violet-300 break-all">
                {serverHash}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/5 bg-black/30 p-5">
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
              Simple Physics Link
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Like a quantum system is understood only after observation, your message
              is trusted only after verification. In this app, the message becomes
              meaningful to the system only after the server checks the key and integrity.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5"
        >
          <h3 className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-6">
            Output Panel
          </h3>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <StepCard
                key={step.title}
                title={step.title}
                description={step.description}
                icon={step.icon}
                active={stepIndex === index + 1 && isRunning}
                done={stepIndex > index + 1 || (finished && stepIndex >= index + 1)}
                error={
                  finished &&
                  index === 4 &&
                  !verified
                }
              />
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {(finished || isRunning) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`border backdrop-blur-xl rounded-2xl overflow-hidden ${
              verified
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-red-500/50 bg-red-500/10"
            }`}
          >
            <div className="p-6 flex items-center gap-6">
              <motion.div
                animate={
                  verified
                    ? { scale: [1, 1.08, 1] }
                    : { rotate: [0, -10, 10, 0] }
                }
                transition={{ repeat: Infinity, duration: verified ? 2 : 0.5 }}
                className={`p-4 rounded-xl ${
                  verified
                    ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    : "bg-red-500/20 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                }`}
              >
                {verified ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
              </motion.div>

              <div className="flex-1">
                <h3
                  className={`font-bold text-xl uppercase tracking-widest ${
                    verified ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {verified
                    ? "VERIFIED: Message Delivered Securely"
                    : "TAMPERED: Message Failed Integrity Check"}
                </h3>

                <p
                  className={`font-mono text-sm mt-2 ${
                    verified ? "text-emerald-400/70" : "text-red-400/70"
                  }`}
                >
                  {verified
                    ? "The secret key matched and the generated hash stayed unchanged during transmission."
                    : "The message changed during transmission or failed verification, so the system marks it as untrusted."}
                </p>

                <div className="grid sm:grid-cols-3 gap-3 mt-5">
                  <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-1">
                      Key Match
                    </div>
                    <div className="font-mono text-sm text-white">
                      {keyMatch ? "TRUE" : "FALSE"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-1">
                      Integrity
                    </div>
                    <div className="font-mono text-sm text-white">
                      {integrityMatch ? "VERIFIED" : "FAILED"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-1">
                      Delivery
                    </div>
                    <div className="font-mono text-sm text-white">
                      {verified ? "SUCCESS" : "BLOCKED"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}