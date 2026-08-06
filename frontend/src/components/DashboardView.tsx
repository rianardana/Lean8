"use client";

import React from "react";
import { DashboardData } from "@/types";
import { Target, Flame, Calendar, Award, ArrowRight } from "lucide-react";

interface DashboardViewProps {
  data: DashboardData;
  onNavigateToDaily: () => void;
  onNavigateToAi: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onNavigateToDaily,
  onNavigateToAi,
}) => {
  const lostWeight = Math.max(0, data.startingWeight - data.currentWeight);
  const remainingWeight = Math.max(0, data.currentWeight - data.targetWeight);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800/80 to-emerald-950/40 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <Flame className="w-3.5 h-3.5" />
            <span>Habit Transformation Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Halo, {data.userHandshakeName}!
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Konsistensi harian &lt; 60 detik menuju tubuh lean ideal. Setiap centang hari ini memperkuat identitas baru Anda.
          </p>
        </div>
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current Weight */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 space-y-2 hover:border-slate-700/80 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Berat Sekarang</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-100">{data.currentWeight.toFixed(1)}</span>
            <span className="text-xs font-semibold text-slate-400">kg</span>
          </div>
          <p className="text-[11px] text-slate-500">Awal: {data.startingWeight} kg</p>
        </div>

        {/* Metric 2: Target Weight */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 space-y-2 hover:border-slate-700/80 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Target Lean</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-100">{data.targetWeight.toFixed(1)}</span>
            <span className="text-xs font-semibold text-slate-400">kg</span>
          </div>
          <p className="text-[11px] text-slate-500">Sisa: {remainingWeight.toFixed(1)} kg lagi</p>
        </div>

        {/* Metric 3: Progress % */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 space-y-2 hover:border-slate-700/80 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Progress Goal</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-100">{data.progressPercentage.toFixed(1)}</span>
            <span className="text-xs font-semibold text-slate-400">%</span>
          </div>
          <p className="text-[11px] text-slate-500">Turun: -{lostWeight.toFixed(1)} kg</p>
        </div>

        {/* Metric 4: Active Days */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 space-y-2 hover:border-slate-700/80 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Hari ke-</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-100">{data.activeDays}</span>
            <span className="text-xs font-semibold text-slate-400">hari</span>
          </div>
          <p className="text-[11px] text-emerald-400/80 font-medium">Tercatat aktif</p>
        </div>
      </div>

      {/* Progress Bar Visualizer */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300">Target Visualizer ({data.startingWeight}kg → {data.targetWeight}kg)</span>
          <span className="text-emerald-400 font-mono">{data.progressPercentage.toFixed(1)}% Terlampaui</span>
        </div>
        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-sm shadow-emerald-500/50"
            style={{ width: `${Math.min(100, Math.max(5, data.progressPercentage))}%` }}
          />
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onNavigateToDaily}
          className="group relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 text-left transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/5"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Input Harian</span>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                Isi Daily Checklist Hari Ini
              </h3>
              <p className="text-xs text-slate-400">Butuh waktu kurang dari 60 detik.</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-200">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </button>

        <button
          onClick={onNavigateToAi}
          className="group relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-6 text-left transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/5"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono text-teal-400 uppercase tracking-wider">Insight AI</span>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                Minta AI Review Hari Ini
              </h3>
              <p className="text-xs text-slate-400">Dapatkan 5 poin evaluasi praktis.</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-200">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
