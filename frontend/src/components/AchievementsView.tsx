"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { computeMilestones, Milestone } from "@/lib/milestones";
import { pickApplause, shareAchievement } from "@/lib/share";
import { Share2, Lock, Award } from "lucide-react";

type Item = Milestone & { bg: string };

const LEVEL_BADGES = [
  { level: 3, title: "Consistent Beginner", image: "/beginer.webp" },
  { level: 5, title: "Fat Burner", image: "/fatburner.webp" },
  { level: 8, title: "Discipline Engine", image: "/discipline.webp" },
  { level: 12, title: "Lean Machine", image: "/Lean%20machine.webp" },
  { level: 16, title: "Elite Habit", image: "/elite%20habit.webp" },
  { level: 20, title: "Lean Legend", image: "/Legend.webp" },
];

export const AchievementsView: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [level, setLevel] = useState<number>(1);
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
        setLevel(dash.level ?? 1);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const share = async (m: Milestone) => {
    try { await shareAchievement(m); } catch { /* user cancel share sheet */ }
  };

  const shareBadge = async (b: { title: string; level: number }) => {
    const m: Milestone = { id: `level-badge-${b.level}`, title: b.title, desc: `Unlocked at Level ${b.level}` };
    try { await shareAchievement(m); } catch { /* user cancel share sheet */ }
  };

  if (loading) return <p className="text-xs text-slate-500 animate-pulse">Memuat prestasi...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Level Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {LEVEL_BADGES.map((b) => {
            const unlocked = level >= b.level;
            const needXp = b.level * 100;
            return (
              <div key={b.level} className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-900">
                <img src={b.image} alt={b.title} className={`absolute inset-0 w-full h-full object-cover ${unlocked ? "drop-shadow-2xl" : "grayscale opacity-35"}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/70 rounded-full p-4 border border-white/20">
                      <Lock className="w-7 h-7 text-white" />
                    </div>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 border border-amber-400/40 rounded-full px-2.5 py-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-300">Lv {b.level}</span>
                </div>
                <div className="absolute bottom-3 inset-x-0 text-center space-y-1">
                  <p className="text-sm font-black text-white drop-shadow-lg">{b.title}</p>
                  <p className="text-[10px] font-semibold text-amber-200 drop-shadow">
                    {unlocked ? "Unlocked" : `Unlock at ${needXp} XP`}
                  </p>
                </div>
                {unlocked && (
                  <button onClick={() => shareBadge(b)} className="absolute top-3 right-3 bg-emerald-500 text-slate-950 rounded-full p-2 shadow-lg">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-1">
          <p className="text-sm font-bold text-slate-900">Belum ada prestasi</p>
          <p className="text-xs text-slate-500">Jaga streak & target berat — pencapaian pertama lo bakal muncul di sini.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};
