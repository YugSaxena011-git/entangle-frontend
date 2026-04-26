import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSound from "use-sound";
import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import Simulation from "./pages/Simulation";
import Analytics from "./pages/Analytics";
import Setup from "./pages/Setup";
import useChat from "./useChat";
import { API_BASE_URL } from "./config";
import {
  MessageSquare,
  Activity,
  BarChart3,
  Radio,
  TerminalSquare,
  Power,
  Shield,
  Sparkles,
} from "lucide-react";

const BootSequence = ({ onComplete, playPowerUp }) => {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);

  const bootMessages = [
    "Initializing ENTANGLE kernel...",
    "Bypassing standard network protocols...",
    "Establishing BB84 key exchange...",
    "Deploying Quantum Veil encryption...",
    "Calibrating Heisenberg observation limits...",
    "Secure lattice stabilized. Ready.",
  ];

  useEffect(() => {
    let currentLog = 0;
    let progressValue = 0;

    const logInterval = setInterval(() => {
      if (currentLog < bootMessages.length) {
        setLogs((prev) => [...prev, bootMessages[currentLog]]);
        currentLog++;
      }
    }, 400);

    const progressInterval = setInterval(() => {
      progressValue += Math.floor(Math.random() * 15);
      if (progressValue >= 100) {
        progressValue = 100;
        clearInterval(progressInterval);

        setTimeout(() => {
          setLogs((prev) => [...prev, "WELCOME TO ENTANGLE."]);
          playPowerUp();

          setTimeout(onComplete, 1400);
        }, 500);
      }
      setProgress(progressValue);
    }, 120);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete, playPowerUp]);

  return (
    <motion.div
      key="boot-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(16px)" }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-black flex flex-col justify-end p-12 font-mono min-h-[100dvh]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none opacity-50" />

      <div className="max-w-3xl space-y-2 relative z-10">
        <div className="mb-8 flex items-center gap-4 text-indigo-500">
          <TerminalSquare className="animate-pulse" size={32} />
          <span className="text-2xl font-bold tracking-widest uppercase">
            Connecting...
          </span>
        </div>

        {logs.map((log, index) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={index}
            className={`text-sm md:text-base ${
              log === "WELCOME TO ENTANGLE."
                ? "text-emerald-400 font-bold text-xl mt-8 animate-pulse"
                : "text-indigo-300"
            }`}
          >
            {`> ${log}`}
            {index === logs.length - 1 && log !== "WELCOME TO ENTANGLE." && progress < 100 && (
              <span className="inline-block w-2 h-4 bg-indigo-400/80 ml-1 animate-pulse align-middle" />
            )}
          </motion.div>
        ))}

        <div className="mt-12 pt-8 border-t border-indigo-900/50 flex items-center gap-6">
          <div className="flex-1 h-1 bg-indigo-950 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
              animate={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-indigo-400 w-16 text-right font-bold">
            {progress}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const VideoBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-black">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover opacity-30"
        style={{ filter: "brightness(0.7) contrast(1.2)" }}
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.82)_100%)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(#ffffff03_1px,transparent_1px),linear-gradient(90deg,#ffffff03_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute inset-0 mix-blend-overlay opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
    </div>
  );
};

function StartScreen({ onStart, playClick }) {
  return (
    <div className="min-h-[100dvh] bg-black flex items-center justify-center font-mono selection:bg-indigo-500/40 relative overflow-hidden">
      <VideoBackground />

      <div className="relative z-10 w-full max-w-5xl px-8">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8 }}
          className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-indigo-300 text-xs uppercase tracking-[0.25em]">
              <Shield size={14} />
              Quantum-Inspired Secure Messaging
            </div>

            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-[0.08em]">
                ENTANGLE
              </h1>
              <p className="mt-4 max-w-2xl text-slate-300 text-base md:text-lg leading-7">
                A secure communication system combining encrypted private chat,
                quantum-inspired key logic, tamper awareness, one-time message
                behavior, and live secure session control.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-indigo-300 mb-2">
                  <Shield size={18} />
                </div>
                <div className="text-white font-semibold text-sm">
                  Quantum Veil
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  End-to-end encrypted chat layer
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-emerald-300 mb-2">
                  <Sparkles size={18} />
                </div>
                <div className="text-white font-semibold text-sm">
                  Heisenberg Mode
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  Observe once, then collapse
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-cyan-300 mb-2">
                  <Radio size={18} />
                </div>
                <div className="text-white font-semibold text-sm">
                  Signal Flow
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  Real-time private secure channels
                </div>
              </div>
            </div>

            <div className="pt-2">
              <motion.button
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 0 30px rgba(99,102,241,0.35)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  playClick();

                  if (
                    "Notification" in window &&
                    Notification.permission === "default"
                  ) {
                    Notification.requestPermission();
                  }

                  onStart();
                }}
                className="flex items-center gap-4 text-indigo-200 hover:text-white transition-colors px-8 py-5 rounded-3xl border border-indigo-500/30 hover:border-indigo-400/50 bg-indigo-950/30"
              >
                <Power size={26} className="animate-pulse" />
                <span className="text-lg tracking-[0.35em] font-bold uppercase">
                  Start System
                </span>
              </motion.button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-2xl"
          >
            <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400 mb-4 font-mono">
              System Snapshot
            </div>

            <div className="space-y-4">
              {[
                ["Quantum Veil", "Active encryption foundation"],
                ["Private Rooms", "Room-bound secure channels"],
                ["Recent Chats", "Synced encrypted previews"],
                ["Tamper Checks", "Integrity-aware transmission"],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="text-white font-semibold text-sm">
                    {title}
                  </div>
                  <div className="text-slate-400 text-xs mt-1">{desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem("sessionToken") ||
      sessionStorage.getItem("sessionToken");

    if (!token) {
      setAuthLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/user/restore?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Session restore failed");
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch((error) => {
        console.error("Restore error:", error);
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("username");
        localStorage.removeItem("displayName");
        sessionStorage.removeItem("sessionToken");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("displayName");
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    const token =
      localStorage.getItem("sessionToken") ||
      sessionStorage.getItem("sessionToken");

    try {
      if (token) {
        await fetch(
          `${API_BASE_URL}/user/logout?token=${encodeURIComponent(token)}`
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("username");
      localStorage.removeItem("displayName");
      sessionStorage.removeItem("sessionToken");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("displayName");
      setUser(null);
      setHasStarted(false);
      setIsBooting(true);
      setCurrentPage("home");
    }
  };

  const chat = useChat(user);

  const [playClick] = useSound("/sounds/click.mp3", { volume: 0.25 });
  const [playHover] = useSound("/sounds/hover.mp3", { volume: 0.15 });
  const [playPowerUp] = useSound("/sounds/powerup.mp3", { volume: 0.4 });

  const handlePageChange = (pageId) => {
    playClick();
    setCurrentPage(pageId);
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center font-mono">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Setup onLogin={setUser} />;
  }

  if (!hasStarted) {
    return (
      <StartScreen
        onStart={() => setHasStarted(true)}
        playClick={playClick}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans selection:bg-indigo-500/40 text-slate-300 relative overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {isBooting ? (
          <BootSequence
            onComplete={() => setIsBooting(false)}
            playPowerUp={playPowerUp}
          />
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex-1 flex flex-col relative z-10 w-full h-[100dvh]"
          >
            <VideoBackground />

            <nav className="border-b border-white/5 bg-black/40 backdrop-blur-3xl sticky top-0 z-50 shrink-0">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />
              <div className="w-full px-6 lg:px-12 h-16 md:h-20 flex items-center justify-between">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => handlePageChange("home")}
                  onMouseEnter={playHover}
                >
                  <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                    <Radio
                      className="text-indigo-500 group-hover:animate-spin"
                      size={20}
                    />
                  </div>
                  <span className="text-lg md:text-xl font-bold tracking-[0.4em] text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    ENTANGLE
                  </span>
                </motion.div>

                <div className="flex items-center gap-4 md:gap-10 font-mono">
                  {[
                    {
                      id: "chat",
                      icon: <MessageSquare size={14} />,
                      label: "SECURE CHAT",
                    },
                    {
                      id: "simulation",
                      icon: <Activity size={14} />,
                      label: "HOW IT WORKS",
                    },
                    {
                      id: "analytics",
                      icon: <BarChart3 size={14} />,
                      label: "DASHBOARD",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handlePageChange(item.id)}
                      onMouseEnter={playHover}
                      className={`group relative hidden sm:flex items-center gap-2 uppercase text-[10px] md:text-[11px] tracking-[0.2em] transition-all py-2 ${
                        currentPage === item.id
                          ? "text-white"
                          : "text-slate-500 hover:text-indigo-400"
                      }`}
                    >
                      <span className="hidden md:block">{item.icon}</span>
                      {item.label}
                      {currentPage === item.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -bottom-1 left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_15px_#6366f1]"
                        />
                      )}
                    </button>
                  ))}

                  <button
                    onClick={handleLogout}
                    className="rounded-lg border border-red-500/30 px-3 py-2 text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-red-300 hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </nav>

            <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-4 md:py-6 flex flex-col relative z-10 min-h-0">
              <div className={currentPage === "home" ? "block flex-1 min-h-0" : "hidden"}>
                <Landing setPage={setCurrentPage} />
              </div>

              <div className={currentPage === "chat" ? "block flex-1 min-h-0" : "hidden"}>
                <Chat chat={chat} />
              </div>

              <div className={currentPage === "simulation" ? "block flex-1 min-h-0" : "hidden"}>
                <Simulation />
              </div>

              <div className={currentPage === "analytics" ? "block flex-1 min-h-0" : "hidden"}>
                <Analytics chat={chat} />
              </div>
            </main>

            <div className="hidden lg:flex fixed top-24 left-6 flex-col gap-2 opacity-30 pointer-events-none">
              <div className="w-8 h-[1px] bg-indigo-500" />
              <div className="w-[1px] h-8 bg-indigo-500" />
            </div>

            <div className="fixed bottom-6 right-6 md:bottom-8 md:right-12 flex items-center gap-3 md:gap-4 text-[9px] md:text-[10px] font-mono text-slate-600 tracking-widest uppercase bg-black/20 p-2 rounded border border-white/5 pointer-events-none">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              STATUS: ONLINE
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}