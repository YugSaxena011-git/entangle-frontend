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
  Atom,
  Shuffle,
  Eye,
  Lock,
  Radio,
  Sparkles,
} from "lucide-react";
import useSound from "use-sound";

// Reusing the Toggle Component for consistency
function SimToggle({ label, checked, disabled, onChange, color = "indigo" }) {
  const colorMap = {
    indigo: "bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]",
    red: "bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]",
  };
  return (
    <label className={`flex items-center gap-3 cursor-pointer transition-opacity shrink-0 ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"}`}>
      <div className="relative flex items-center shrink-0">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="sr-only" />
        <div className={`block w-8 h-4.5 rounded-full transition-colors duration-300 ease-in-out border border-white/10 ${checked ? `bg-${color}-500/20` : "bg-black/50"}`}></div>
        <div className={`absolute left-0.5 top-[2px] w-3.5 h-3.5 rounded-full transition-all duration-300 ease-in-out ${checked ? `translate-x-3.5 ${colorMap[color]}` : "translate-x-0 bg-slate-500"}`}></div>
      </div>
      <span className="select-none text-[10px] xl:text-[11px] font-bold uppercase tracking-widest font-mono text-slate-400 whitespace-nowrap">{label}</span>
    </label>
  );
}

const buildSimpleHash = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};

const bits = ["1", "0", "1", "1", "0", "1", "0", "0"];
const aliceBasis = ["+", "×", "+", "×", "+", "×", "×", "+"];
const bobBasis = ["+", "+", "+", "×", "×", "×", "+", "+"];
const sharedBits = bits.filter((_, i) => aliceBasis[i] === bobBasis[i]).join("");

const StepCard = ({ title, description, icon, active, done, error }) => {
  let stateClasses = "border-white/5 bg-black/40 text-slate-300";

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
      className={`rounded-2xl border p-4 lg:p-5 backdrop-blur-xl transition-all ${stateClasses}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] xl:text-[10px] font-bold uppercase tracking-widest opacity-75 mb-1.5 truncate">
            {title}
          </div>
          <div className="text-xs xl:text-sm leading-relaxed font-mono">{description}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Simulation() {
  const [message, setMessage] = useState("Hello bro");
  const [secretKey, setSecretKey] = useState("quantum123");
  const [tamperMode, setTamperMode] = useState(false);
  const [eavesdropper, setEavesdropper] = useState(false);
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
  const bb84Safe = !eavesdropper;
  const verified = keyMatch && integrityMatch && bb84Safe;

  const steps = [
    {
      title: "Step 1 · Qubit Bits Prepared",
      description: "The system starts with a BB84-inspired bit stream. In presentation, these bits represent simulated quantum states.",
      icon: <Atom size={18} />,
    },
    {
      title: "Step 2 · Basis Selection",
      description: "Alice and Bob choose random bases: + computational basis and × Hadamard basis. Matching bases are kept.",
      icon: <Shuffle size={18} />,
    },
    {
      title: "Step 3 · Shared Session Key",
      description: `Matching basis positions generate shared key bits: ${sharedBits || "none"}. This becomes the idea behind the Entangled Session Key.`,
      icon: <KeyRound size={18} />,
    },
    {
      title: "Step 4 · Quantum Veil Encryption",
      description: "The chat message is encrypted on the frontend before being sent, so the backend stores ciphertext instead of plaintext.",
      icon: <Lock size={18} />,
    },
    {
      title: "Step 5 · Integrity Hash Check",
      description: integrityMatch
        ? `Sender and server-side hash match: ${clientHash}`
        : "Tamper mode changed the message, so hash verification fails.",
      icon: <Hash size={18} />,
    },
    {
      title: "Step 6 · Eavesdropper Detection",
      description: eavesdropper
        ? "Eavesdropper mode simulates disturbance in the key exchange, so the channel is treated as unsafe."
        : "No disturbance detected. The channel is treated as safe.",
      icon: eavesdropper ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />,
    },
    {
      title: "Step 7 · Heisenberg One-Time View",
      description: "One-time messages are inspired by quantum measurement: after observation, the message collapses and cannot be viewed again.",
      icon: <Eye size={18} />,
    },
    {
      title: "Step 8 · Final Result",
      description: verified
        ? "Message is encrypted, verified, and delivered securely."
        : "Message is blocked or marked unsafe due to tampering, missing key, or simulated eavesdropping.",
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
    }, 650);
  };

  const resetSimulation = () => {
    playHover();
    setStepIndex(0);
    setIsRunning(false);
    setFinished(false);
    setTamperMode(false);
    setEavesdropper(false);
    setMessage("Hello bro");
    setSecretKey("quantum123");
  };

  return (
    <div className="w-full max-w-[1900px] mx-auto space-y-6 lg:space-y-8 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-6 shrink-0">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-indigo-400 mb-2"
          >
            <Activity className="animate-pulse" size={16} />
            <span className="font-mono text-[10px] xl:text-xs font-bold tracking-widest uppercase">
              BB84 + Quantum Veil Demo
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white">
            How ENTANGLE Works
          </h2>

          <p className="mt-3 text-slate-400 max-w-3xl text-xs xl:text-sm font-mono">
            This page explains your project using a BB84-inspired key exchange,
            Quantum Veil encryption, integrity checking, and Heisenberg one-time
            view messaging.
          </p>
        </div>

        <div className="flex gap-4 shrink-0">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(99,102,241,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={resetSimulation}
            className="px-5 py-3 border border-indigo-500/30 rounded-xl text-indigo-300 font-mono text-[10px] xl:text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Reset Demo
          </motion.button>

          <motion.button
            whileHover={!isRunning ? { scale: 1.05, boxShadow: "0 0 20px rgba(99,102,241,0.4)" } : {}}
            whileTap={!isRunning ? { scale: 0.95 } : {}}
            onClick={runSimulation}
            disabled={isRunning}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-mono font-bold text-[10px] xl:text-xs tracking-widest uppercase transition-all ${
              isRunning
                ? "bg-black/50 border border-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            }`}
          >
            <Activity size={16} />
            {isRunning ? "Running..." : "Run Simulation"}
          </motion.button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[0.9fr_1.1fr] gap-6 min-h-0 flex-1">
        
        {/* Input Panel */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 lg:p-8 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-xl overflow-y-auto custom-scrollbar min-w-0"
        >
          <h3 className="font-mono text-[10px] xl:text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Input Variables
          </h3>

          <div className="space-y-4 mb-8">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isRunning}
              className="w-full bg-black/60 border border-slate-700 rounded-xl px-4 py-3.5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              placeholder="Type a message"
            />

            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              disabled={isRunning}
              className="w-full bg-black/60 border border-slate-700 rounded-xl px-4 py-3.5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              placeholder="Entangled session key"
            />

            <div className="flex flex-col gap-4 pt-2">
              <SimToggle 
                label="Simulate Data Tamper (Integrity Failure)" 
                checked={tamperMode} 
                onChange={(e) => setTamperMode(e.target.checked)} 
                disabled={isRunning} 
                color="red" 
              />
              <SimToggle 
                label="Simulate Eavesdropper (BB84 Disruption)" 
                checked={eavesdropper} 
                onChange={(e) => setEavesdropper(e.target.checked)} 
                disabled={isRunning} 
                color="indigo" 
              />
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 lg:p-6 shadow-inner min-w-0">
            <div className="flex items-center gap-2 text-indigo-300 font-mono text-[10px] xl:text-xs font-bold uppercase tracking-widest mb-4">
              <Radio size={16} className="animate-pulse" />
              BB84 Basis Table
            </div>

            <div className="grid grid-cols-4 gap-2 lg:gap-3 text-[10px] lg:text-xs font-mono">
              {bits.map((bit, index) => {
                const match = aliceBasis[index] === bobBasis[index];
                return (
                  <div
                    key={index}
                    className={`rounded-xl border p-2 lg:p-3 text-center ${
                      match
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                        : "border-white/5 bg-white/5 text-slate-500"
                    }`}
                  >
                    <div className="font-bold">B: {bit}</div>
                    <div className="opacity-80 mt-1">A:{aliceBasis[index]}</div>
                    <div className="opacity-80">B:{bobBasis[index]}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 text-[11px] lg:text-xs font-mono text-slate-400">
              Shared Key: <span className="text-emerald-400 font-bold ml-1">{sharedBits}</span>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-4 min-w-0">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 min-w-0">
              <div className="text-[9px] uppercase tracking-widest font-mono font-bold text-slate-500 mb-2">
                Sender Hash
              </div>
              <div className="font-mono text-xs text-indigo-300 truncate">
                {clientHash}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 min-w-0">
              <div className="text-[9px] uppercase tracking-widest font-mono font-bold text-slate-500 mb-2">
                Server Hash
              </div>
              <div className="font-mono text-xs text-violet-300 truncate">
                {serverHash}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Output Panel */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 lg:p-8 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-xl overflow-y-auto custom-scrollbar min-w-0 flex flex-col"
        >
          <h3 className="font-mono text-[10px] xl:text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 shrink-0">
            Operation Output
          </h3>

          <div className="space-y-4 flex-1">
            {steps.map((step, index) => (
              <StepCard
                key={step.title}
                title={step.title}
                description={step.description}
                icon={step.icon}
                active={stepIndex === index + 1 && isRunning}
                done={stepIndex > index + 1 || (finished && stepIndex >= index + 1)}
                error={finished && index === steps.length - 1 && !verified}
              />
            ))}
          </div>

          <AnimatePresence>
            {(finished || isRunning) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`mt-6 border backdrop-blur-xl rounded-2xl overflow-hidden shrink-0 ${
                  verified
                    ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "border-red-500/30 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                }`}
              >
                <div className="p-5 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 lg:gap-6 min-w-0">
                  <motion.div
                    animate={
                      verified
                        ? { scale: [1, 1.05, 1] }
                        : { rotate: [0, -10, 10, 0] }
                    }
                    transition={{ repeat: Infinity, duration: verified ? 2 : 0.5 }}
                    className={`p-4 rounded-xl shrink-0 ${
                      verified
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {verified ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-bold text-sm lg:text-base uppercase tracking-widest truncate ${
                        verified ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {verified
                        ? "SECURE: Tunnel Verified"
                        : "UNSAFE: Verification Failed"}
                    </h3>

                    <p
                      className={`font-mono text-[10px] lg:text-xs mt-1.5 line-clamp-2 ${
                        verified ? "text-emerald-400/70" : "text-red-400/70"
                      }`}
                    >
                      {verified
                        ? "The BB84 key is safe, encryption is active, and integrity is verified."
                        : "Message tampered, key missing, or eavesdropper detected."}
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4 min-w-0">
                      <div className="rounded-xl bg-black/40 border border-white/5 p-2.5">
                        <div className="text-[8px] uppercase tracking-widest font-mono font-bold text-slate-500 mb-1">Key</div>
                        <div className="font-mono text-[10px] text-white font-bold">{keyMatch ? "READY" : "MISSING"}</div>
                      </div>
                      <div className="rounded-xl bg-black/40 border border-white/5 p-2.5">
                        <div className="text-[8px] uppercase tracking-widest font-mono font-bold text-slate-500 mb-1">Integrity</div>
                        <div className="font-mono text-[10px] text-white font-bold">{integrityMatch ? "VERIFIED" : "FAILED"}</div>
                      </div>
                      <div className="rounded-xl bg-black/40 border border-white/5 p-2.5">
                        <div className="text-[8px] uppercase tracking-widest font-mono font-bold text-slate-500 mb-1">Channel</div>
                        <div className="font-mono text-[10px] text-white font-bold">{eavesdropper ? "COMPROMISED" : "CLEAR"}</div>
                      </div>
                      <div className="rounded-xl bg-black/40 border border-white/5 p-2.5">
                        <div className="text-[8px] uppercase tracking-widest font-mono font-bold text-slate-500 mb-1">Delivery</div>
                        <div className="font-mono text-[10px] text-white font-bold">{verified ? "SUCCESS" : "BLOCKED"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}