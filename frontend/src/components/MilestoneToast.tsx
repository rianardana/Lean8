"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X } from "lucide-react";
import { computeMilestones, Milestone } from "@/lib/milestones";

const SEEN_KEY = "lean8_milestones_seen";

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
