import { useState } from "react";
import { API_BASE_URL } from "../config";

export default function Setup({ onLogin }) {
  const [mode, setMode] = useState("register");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
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

      console.log(`${mode} raw response:`, text);

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
      console.log(`${mode} parsed data:`, data);

      localStorage.setItem("sessionToken", data.sessionToken);
      localStorage.setItem("username", data.username);
      localStorage.setItem("displayName", data.displayName || "");

      console.log(
        "Saved token after auth:",
        localStorage.getItem("sessionToken")
      );

      onLogin(data);
    } catch (error) {
      console.error(`${mode} error:`, error);
      alert(mode === "login" ? "Unable to login" : "Unable to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
        <h1 className="text-3xl font-bold mb-2">
          {mode === "login" ? "ENTANGLE Login" : "ENTANGLE Setup"}
        </h1>

        <p className="text-slate-400 mb-6">
          {mode === "login"
            ? "Login from any device using your username and password."
            : "Create your identity once. The app will remember you on this device."}
        </p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Unique username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl bg-black/50 border border-slate-700 px-4 py-3 outline-none"
          />

          {mode === "register" && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-black/50 border border-slate-700 px-4 py-3 outline-none"
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-black/50 border border-slate-700 px-4 py-3 outline-none"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 font-semibold disabled:opacity-50"
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating..."
              : mode === "login"
              ? "Login"
              : "Enter ENTANGLE"}
          </button>

          <button
            onClick={() =>
              setMode(mode === "login" ? "register" : "login")
            }
            className="w-full rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-300 hover:bg-white/5"
          >
            {mode === "login"
              ? "New user? Switch to Register"
              : "Already have an account? Switch to Login"}
          </button>
        </div>
      </div>
    </div>
  );
}