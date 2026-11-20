"use client";

import React from "react";
import { Sparkles, Trophy } from "lucide-react";

interface XpCardProps {
  xp: number;
  level: number;
}

export const XpCard: React.FC<XpCardProps> = ({ xp, level }) => {
  const currentLevelXp = (level - 1) * 100;
  const nextLevelXp = level * 100;
  const progress = Math.min(100, Math.round(((xp - currentLevelXp) / 100) * 100));
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Level {level}</p>
            <p className="text-lg font-black text-slate-900">{xp} XP</p>
          </div>
        </div>
        <Trophy className="w-5 h-5 text-amber-500" />
      </div>
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-slate-400">{Math.max(0, nextLevelXp - xp)} XP lagi ke Level {level + 1}</p>
      </div>
    </div>
  );
};
