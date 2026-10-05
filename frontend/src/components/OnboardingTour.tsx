"use client";

import React, { useState } from "react";
import { X, ChevronRight, Check, LayoutDashboard, CheckSquare, Flame, TrendingDown, Sparkles } from "lucide-react";

const STEPS = [
  { icon: LayoutDashboard, title: "Dashboard", desc: "Lihat berat sekarang, progress, dan BMI kamu dalam satu layar." },
  { icon: CheckSquare, title: "Habit Harian", desc: "Centang checklist < 60 detik: workout, fasting, protein, air, tidur, no snack." },
  { icon: Flame, title: "Kalori", desc: "Log makanan & kalori — bisa lewat foto makanan pakai AI." },
  { icon: TrendingDown, title: "Progres", desc: "Pantau grafik berat badan & estimasi tanggal capai target." },
  { icon: Sparkles, title: "AI Coach", desc: "Tanya coach soal diet, nutrisi, dan cara jaga konsistensi." },
];

export const OnboardingTour: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const StepIcon = STEPS[step].icon;

  const next = () => (last ? onDone() : setStep(step + 1));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-emerald-600">{step + 1} / {STEPS.length}</span>
          <button onClick={onDone} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center space-y-3 py-2">
          <img src="/mascot.webp" alt="Coach AI Lean Mode" className="h-28 w-auto" />
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
            <StepIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">{STEPS[step].title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{STEPS[step].desc}</p>
          </div>
        </div>

        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-emerald-500 w-4" : "bg-slate-200"}`} />
          ))}
        </div>

        <div className="flex gap-2">
          {!last && (
            <button onClick={onDone} className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition">
              Lewati
            </button>
          )}
          <button onClick={next} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold hover:opacity-95 transition flex items-center justify-center gap-1">
            {last ? (<><Check className="w-4 h-4" /> Selesai</>) : (<>Lanjut <ChevronRight className="w-4 h-4" /></>)}
          </button>
        </div>
      </div>
    </div>
  );
};
