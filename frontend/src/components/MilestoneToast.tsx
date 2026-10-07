"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X } from "lucide-react";

const SEEN_KEY = "lean8_milestones_seen";

interface Milestone {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

const STREAK_STEPS = [3, 7, 14, 30, 60];
const DAYS_STEPS = [7, 30, 60, 90];
const WEIGHT_STEP = 5; // kg

function computeMilestones(
  streak: number,
  activeDays: number,
  currentWeight: number,
  startingWeight: number,
  targetWeight: number,
  goal: "cut" | "bulk"
): Milestone[] {
  const out: Milestone[] = [];
  for (const s of STREAK_STEPS) {
    if (streak >= s) out.push({ id: `streak-${s}`, emoji: "🔥", title: `${s} Hari Streak!`, desc: "Konsisten tanpa putus, identitas lean makin kuat." });
  }
  const total = Math.abs(targetWeight - startingWeight);
  const done = Math.abs(currentWeight - startingWeight);
  const verb = goal === "bulk" ? "Naik" : "Turun";
  for (let kg = WEIGHT_STEP; kg <= total; kg += WEIGHT_STEP) {
    if (done >= kg) out.push({ id: `weight-${kg}`, emoji: "🎯", title: `${verb} ${kg} kg!`, desc: `${done.toFixed(1)} kg dari total ${total.toFixed(0)} kg menuju target.` });
  }
  for (const d of DAYS_STEPS) {
    if (activeDays >= d) out.push({ id: `days-${d}`, emoji: "📅", title: `${d} Hari Aktif!`, desc: `${d} hari mencatat, kebiasaan mulai terbentuk.` });
  }
  return out;
}

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markSeen(id: string) {
  const seen = readSeen();
  if (!seen.includes(id)) seen.push(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

export const MilestoneToast: React.FC = () => {
  const [queue, setQueue] = useState<Milestone[]>([]);
  const current = queue[0] ?? null;

  useEffect(() => {
    let mounted = true;
    Promise.all([api.getStats(), api.getDashboard()])
      .then(([stats, dash]) => {
        if (!mounted) return;
        const seen = readSeen();
        const all = computeMilestones(
          stats.streak,
          dash.activeDays,
          dash.currentWeight,
          dash.startingWeight,
          dash.targetWeight,
          dash.goal
        );
        setQueue(all.filter((m) => !seen.includes(m.id)));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => {
      markSeen(current.id);
      setQueue((q) => q.slice(1));
    }, 4000);
    return () => clearTimeout(t);
  }, [current]);

  if (!current) return null;

  const dismiss = () => {
    markSeen(current.id);
    setQueue((q) => q.slice(1));
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-fade-in">
      <div className="relative flex items-start gap-3 bg-white border border-emerald-200 rounded-2xl p-4 shadow-xl shadow-emerald-500/10">
        <span className="text-3xl leading-none">{current.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900">{current.title}</p>
          <p className="text-xs text-slate-500 leading-snug mt-0.5">{current.desc}</p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Tutup notifikasi"
          className="shrink-0 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
