"use client";
import { useState } from "react";
import { Music } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login fail");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login fail");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-black px-4 text-white">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-green-500">
          <Music size={26} /> My Music
        </h1>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          autoCapitalize="none"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-base outline-none focus:border-green-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-base outline-none focus:border-green-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-green-500 py-3 font-bold text-black active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "..." : "Login"}
        </button>
      </form>
    </main>
  );
}
