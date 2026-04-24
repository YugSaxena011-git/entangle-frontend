import { useState } from "react";
import { API_BASE_URL } from "../config";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

export default function Setup({ onLogin }) {
  const [mode, setMode] = useState("register");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const finalUsername = username.trim().toLowerCase();
    const finalDisplayName = displayName.trim();
    const finalPassword = password.trim();

    if (!finalUsername || !finalPassword) {
      alert("Please enter username and password");
      return;
    }

    if (mode === "register" && !finalDisplayName) {
      alert("Please enter display name");
      return;
    }

    try {
      setLoading(true);

      const url =
        mode === "login"
          ? `${API_BASE_URL}/user/login?username=${encodeURIComponent(
              finalUsername
            )}&password=${encodeURIComponent(finalPassword)}`
          : `${API_BASE_URL}/user/register?username=${encodeURIComponent(
              finalUsername
            )}&displayName=${encodeURIComponent(
              finalDisplayName
            )}&password=${encodeURIComponent(finalPassword)}`;

      const res = await fetch(url);
      const text = await res.text();

      if (!res.ok) {
        if (text.includes("Username already exists")) {
          alert("Username already taken. Try a different one.");
          return;
        }

        if (text.includes("Invalid password")) {
          alert("Wrong password.");
          return;
        }

        if (text.includes("User not found")) {
          alert("User not found. Please register first.");
          return;
        }

        throw new Error(text || `${mode} failed`);
      }

      const data = JSON.parse(text);

      localStorage.removeItem("sessionToken");
      localStorage.removeItem("username");
      localStorage.removeItem("displayName");

      sessionStorage.removeItem("sessionToken");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("displayName");

      const storage = rememberDevice ? localStorage : sessionStorage;
      storage.setItem("sessionToken", data.sessionToken);
      storage.setItem("username", data.username);
      storage.setItem("displayName", data.displayName || "");

      onLogin(data);
    } catch (error) {
      console.error(`${mode} error:`, error);
      alert(mode === "login" ? "Unable to login" : "Unable to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-8 lg:p-10 shadow-2xl relative z-10"
      >
        <div className="flex items-center gap-3 mb-6 text-indigo-400">
          <Terminal size={24} />
          <h1 className="text-[10px] xl:text-xs font-mono uppercase tracking-widest font-bold">
            {mode === "login" ? "System Login" : "System Setup"}
          </h1>
        </div>

        <h2 className="text-3xl lg:text-4xl font-bold mb-3 tracking-tight">
          ENTANGLE
        </h2>

        <p className="text-slate-400 mb-8 text-sm lg:text-base font-mono leading-relaxed">
          {mode === "login"
            ? "Authenticate identity to access secure channels."
            : "Initialize operator profile for quantum-encrypted networking."}
        </p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Operator ID (Username)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-slate-700 px-4 py-3.5 text-sm text-white font-mono outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-600"
          />

          {mode === "register" && (
            <motion.input
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              type="text"
              placeholder="Display Alias"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-black/60 border border-slate-700 px-4 py-3.5 text-sm text-white font-mono outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-600"
            />
          )}

          <input
            type="password"
            placeholder="Passcode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-slate-700 px-4 py-3.5 text-sm text-white font-mono outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-600"
          />

          <label className="flex items-center gap-3 cursor-pointer group mt-2">
            <div className="relative flex items-center shrink-0">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-8 h-4.5 rounded-full transition-colors duration-300 ease-in-out border border-white/10 ${rememberDevice ? "bg-indigo-500/20" : "bg-black/50"}`}></div>
              <div className={`absolute left-0.5 top-[2px] w-3.5 h-3.5 rounded-full transition-all duration-300 ease-in-out ${rememberDevice ? "translate-x-3.5 bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]" : "translate-x-0 bg-slate-500"}`}></div>
            </div>
            <span className="select-none text-[10px] xl:text-xs font-bold uppercase tracking-widest font-mono text-slate-400 group-hover:text-slate-300 transition-colors">
              Maintain Session
            </span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-4 mt-4 font-bold font-mono uppercase tracking-widest text-xs lg:text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
          >
            {loading
              ? mode === "login"
                ? "Authenticating..."
                : "Initializing..."
              : mode === "login"
              ? "Access System"
              : "Create Identity"}
          </button>

          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full rounded-xl border border-white/10 px-4 py-4 font-bold font-mono uppercase tracking-widest text-[10px] lg:text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
          >
            {mode === "login"
              ? "Initialize New Operator"
              : "Switch to Authentication"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}