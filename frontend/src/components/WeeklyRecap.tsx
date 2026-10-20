"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { WeeklyRecapData } from "@/types";
import { CalendarDays } from "lucide-react";

export const WeeklyRecap: React.FC = () => {
  const [data, setData] = useState<WeeklyRecapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getWeeklyRecap()
      .then((d) => { if (isMounted) setData(d); })
      .catch(() => {})
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6">
        <p className="text-xs text-slate-500 animate-pulse">Menyusun rekap minggu ini...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6">
        <p className="text-xs text-slate-500">Gagal memuat rekap — coba lagi nanti.</p>
      </div>
    );
  }

  const { stats } = data;
  const tiles = [
    { label: "Konsistensi", value: `${stats.consistency}%`, sub: `${stats.activeDays}/7 hari aktif` },
    { label: "Workout", value: `${stats.workoutCount}×`, sub: `${stats.workoutMinutes} menit` },
    { label: "Puasa", value: `${stats.fastCount}×`, sub: `${stats.avgFastHours} jam rata-rata` },
  ];

  const bullets = data.recap
    .split("\n")
    .map((s) => s.replace(/^•\s*/, "").trim())
    .filter(Boolean);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">Weekly Recap</span>
            <h3 className="text-xl font-bold text-white">Rekap Mingguan</h3>
          </div>
          <CalendarDays className="w-8 h-8 text-white/50" />
        </div>
        <p className="text-xs text-emerald-50 mt-1.5">{data.rangeStart} — {data.rangeEnd}</p>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-3 gap-2.5">
          {tiles.map((t) => (
            <div key={t.label} className="bg-emerald-50/80 rounded-2xl px-2 py-3 text-center">
              <p className="text-xl font-black text-emerald-700 leading-none">{t.value}</p>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide mt-1.5">{t.label}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{t.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {bullets.length > 0 && (
        <div className="px-6 pb-6 space-y-2.5">
          {bullets.map((b, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-[7px] shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
