"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { firebaseAuth, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const afterAuth = async () => {
    const token = await firebaseAuth.currentUser?.getIdToken();
    if (!token) { router.push("/"); router.refresh(); return; }
    const res = await fetch("/api/user", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const user = res.ok ? await res.json() : null;
    if (user && user.onboardingCompleted === false) router.push("/onboarding");
    else router.push("/");
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      await afterAuth();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
      await afterAuth();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login Google gagal");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 space-y-5">
        <div className="flex flex-col items-center text-center">
          <img src="/Logo_LeanMode.png" alt="Lean Mode" className="w-24 h-24 rounded-3xl mb-3 shadow-lg shadow-emerald-500/10" />
          <h1 className="text-2xl font-bold tracking-tight">Lean Mode</h1>
          <p className="text-xs text-slate-500 mt-1">Masuk untuk lanjutkan progresmu.</p>
          <div className="flex items-end gap-2 mt-4 w-full">
            <img src="/mascot.webp" alt="Coach AI" className="w-9 h-9 rounded-full object-cover object-top shrink-0" />
            <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <p className="text-[11px] text-slate-600 text-left leading-snug">Halo! Aku Coach AI kamu, siap dampingi perjalanan lean-mu. 💪</p>
            </div>
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
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-11 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Sembunyikan password" : "Lihat password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm hover:opacity-95 disabled:opacity-50 transition"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] text-slate-400">atau</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Masuk dengan Google
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
