"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message ?? "Login gagal");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 space-y-5">
        <div className="flex flex-col items-center text-center">
          <img src="/Logo_LeanMode.png" alt="Lean Mode" className="w-20 h-20 rounded-2xl mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">Lean Mode</h1>
          <p className="text-xs text-slate-500 mt-1">Masuk untuk lanjutkan progresmu.</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kamu@email.com"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm hover:opacity-95 disabled:opacity-50 transition"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>

        <p className="text-xs text-slate-500 text-center">
          Belum punya akun?{" "}
          <Link href="/register" className="text-emerald-600 hover:underline">
            Daftar
          </Link>
        </p>
      </form>
    </div>
  );
}
