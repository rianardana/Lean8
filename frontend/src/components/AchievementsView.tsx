"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { computeMilestones, Milestone } from "@/lib/milestones";
import { pickApplause, shareAchievement } from "@/lib/share";
import { Share2 } from "lucide-react";

type Item = Milestone & { bg: string };

export const AchievementsView: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.getStats(), api.getDashboard()])
      .then(([stats, dash]) => {
        if (!mounted) return;
        const ms = computeMilestones(
          stats.streak,
          dash.activeDays,
          dash.currentWeight,
          dash.startingWeight,
          dash.targetWeight,
          dash.goal
        );
        setItems(ms.map((m) => ({ ...m, bg: pickApplause() })));
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const share = async (m: Milestone) => {
    try { await shareAchievement(m); } catch { /* user cancel share sheet */ }
  };

  if (loading) return <p className="text-xs text-slate-500 animate-pulse">Memuat prestasi...</p>;

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-1">
        <p className="text-sm font-bold text-slate-900">Belum ada prestasi</p>
        <p className="text-xs text-slate-500">Jaga streak & target berat — pencapaian pertama lo bakal muncul di sini.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map((m) => (
        <div key={m.id} className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-slate-200 bg-slate-900">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 178" preserveAspectRatio="none" aria-hidden="true">
            <line x1="-10" y1="30" x2="110" y2="70" stroke="white" strokeOpacity="0.10" strokeWidth="0.6" />
            <line x1="-10" y1="70" x2="110" y2="30" stroke="white" strokeOpacity="0.10" strokeWidth="0.6" />
            <line x1="-10" y1="95" x2="110" y2="130" stroke="white" strokeOpacity="0.07" strokeWidth="0.6" />
            <line x1="-10" y1="130" x2="110" y2="95" stroke="white" strokeOpacity="0.07" strokeWidth="0.6" />
          </svg>
          <img src={m.bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-800/60 via-emerald-700/20 to-emerald-900/70" />
          <div className="absolute inset-0 p-5 flex flex-col items-center justify-center text-center">
            <p className="text-yellow-400 text-[11px] font-semibold tracking-[0.25em] uppercase [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">Selamat!</p>
            <p className="text-yellow-400 font-bold text-2xl leading-tight mt-3 [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">{m.title}</p>
            <p className="text-yellow-300 text-xs leading-relaxed mt-3 max-w-[220px] [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{m.desc}</p>
            <button
              onClick={() => share(m)}
              className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs hover:opacity-90 active:scale-95 transition shadow-lg"
            >
              <Share2 className="w-3.5 h-3.5" /> Bagikan
            </button>
          </div>
          <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
              <img src="/Logo_LeanMode.png" alt="Lean Mode" className="w-5 h-5 rounded-full" />
            </div>
            <span className="text-yellow-400 text-[11px] font-semibold leading-none tracking-wide [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">Lean Mode</span>
            <span className="text-white/80 text-[7px] tracking-[0.2em] uppercase leading-none [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">Consistency Over Perfection</span>
          </div>
        </div>
      ))}
    </div>
  );
};
