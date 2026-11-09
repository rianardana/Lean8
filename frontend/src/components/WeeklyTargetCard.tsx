"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { WeeklyTargetData } from "@/types";
import { Target, CheckCircle2 } from "lucide-react";

const KEY_LABEL: Record<string, string> = { workout: "🏋️", fast: "⏱️", activeDays: "🔥" };

export const WeeklyTargetCard: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
  const [data, setData] = useState<WeeklyTargetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getWeeklyTarget()
      .then((d) => {
        if (isMounted) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const isLoading = loading && data === null && refreshKey === undefined;

  if (loading || !data) return null;
  if (!data.progress || data.progress.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Target Minggu Ini</p>
            <p className="text-[11px] text-slate-500">Belum dipasang. Atur di Pengaturan → Target Minggu Ini.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Target Minggu Ini</span>
          <h3 className="text-xl font-bold text-slate-900">Progres Target</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {data.weekStart} — {data.weekEnd} (WIB)
          </p>
        </div>
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
          <Target className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-3">
        {data.progress.map((p) => {
          const pct = p.target > 0 ? Math.min(100, Math.round((p.current / p.target) * 100)) : 0;
          return (
            <div key={p.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span aria-hidden="true">{KEY_LABEL[p.key] ?? "•"}</span>
                  {p.label}
                  {p.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </span>
                <span className={`font-mono ${p.done ? "text-emerald-600" : "text-slate-500"}`}>{p.detail}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${p.done ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {data.reminderEnabled && (
        <p className="text-[10px] text-slate-400">
          🔔 Reminder aktif — push Android (notif/getar/suara mengikuti setelan perangkat &amp; DND) + fallback saat app dibuka.
        </p>
      )}
    </div>
  );
};
