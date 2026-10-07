"use client";

import React from "react";
import { DashboardData } from "@/types";
import { Scale } from "lucide-react";

interface DashboardViewProps {
  data: DashboardData;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {
  const isBulk = data.goal === "bulk";
  const deltaFromStart = data.currentWeight - data.startingWeight; // + = naik, - = turun
  const remainingWeight = Math.abs(data.currentWeight - data.targetWeight);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Weight Journey</span>
          <h3 className="text-xl font-bold text-slate-900">Perjalanan Berat</h3>
        </div>
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
          <Scale className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-500">Sekarang</span>
          <p className="text-2xl font-black text-slate-900">
            {data.currentWeight.toFixed(1)}<span className="text-xs font-semibold text-slate-500"> kg</span>
          </p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-500">{isBulk ? "Target Bulk" : "Target Lean"}</span>
          <p className="text-2xl font-black text-slate-900">
            {data.targetWeight.toFixed(1)}<span className="text-xs font-semibold text-slate-500"> kg</span>
          </p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-500">{isBulk ? "Naik" : "Turun"}</span>
          <p className="text-2xl font-black text-emerald-600">
            {deltaFromStart >= 0 ? "+" : "-"}{Math.abs(deltaFromStart).toFixed(1)}<span className="text-xs font-semibold text-slate-500"> kg</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">{data.startingWeight}kg → {data.targetWeight}kg · sisa {remainingWeight.toFixed(1)} kg</span>
          <span className="text-emerald-600 font-mono">{data.progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-sm shadow-emerald-500/50"
            style={{ width: `${Math.min(100, Math.max(5, data.progressPercentage))}%` }}
          />
        </div>
        {data.etaDate && (
          <p className="text-xs text-emerald-600 font-mono">
            Estimasi capai {data.targetWeight} kg: sekitar {data.etaDate} (±{data.etaDays} hari)
          </p>
        )}
      </div>
    </div>
  );
};
