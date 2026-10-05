"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await authClient.signUp.email({ email, password, name });
    if (error) {
      setError(error.message ?? "Pendaftaran gagal");
      setLoading(false);
      return;
    }
    // simpan tinggi & berat (best-effort, kalau gagal bisa diubah di Settings)
    try {
      const h = parseFloat(heightCm);
      const w = parseFloat(weight);
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(h > 0 ? { heightCm: h } : {}), ...(w > 0 ? { currentWeight: w } : {}) }),
      });
    } catch { /* ignore */ }
    router.push("/?welcome=1");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 space-y-5">
        <div className="flex flex-col items-center text-center">
          <img src="/mascot.webp" alt="Coach AI Lean Mode" className="h-44 w-auto mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">Buat Akun</h1>
          <p className="text-xs text-slate-500 mt-1">Mulai perjalanan Lean Mode bareng Coach AI.</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Nama</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Tinggi (cm)</label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="175"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Berat (kg)</label>
            <input
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
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
            placeholder="Min. 8 karakter"
            required
            minLength={8}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm hover:opacity-95 disabled:opacity-50 transition"
        >
          {loading ? "Membuat akun..." : "Daftar"}
        </button>

        <p className="text-xs text-slate-500 text-center">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-emerald-600 hover:underline">
            Masuk
          </Link>
        </p>
      </form>
    </div>
  );
}
