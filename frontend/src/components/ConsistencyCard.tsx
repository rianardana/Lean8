"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Flame } from "lucide-react";

interface StatsData {
  streak: number;
  days: { date: string; count: number }[];
}

const color = (count: number) => {
  if (count === 0) return "bg-slate-100";
  if (count < 3) return "bg-emerald-200";
  if (count < 5) return "bg-emerald-400";
  return "bg-emerald-600";
};

export const ConsistencyCard: React.FC<{ activeDays?: number }> = ({ activeDays }) => {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getStats().then((d) => { if (isMounted) setData(d); }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  if (!data) return null;

  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < data.days.length; i += 7) weeks.push(data.days.slice(i, i + 7));

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Consistency Score</span>
          <h3 className="text-xl font-bold text-slate-900">Konsistensi Harian</h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-emerald-600 flex items-center gap-1.5">
            <Flame className="w-5 h-5" /> {data.streak}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            hari beruntun{activeDays != null ? ` · hari ke-${activeDays}` : ""}
          </p>
        </div>
      </div>
      <div className="flex justify-between">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((d) => (
              <div
                key={d.date}
                title={`${d.date} — ${d.count}/6 habit`}
                className={`w-4 h-4 rounded-[4px] ${color(d.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
        <span>Kurang</span>
        <div className="flex items-center gap-1">
          {["bg-slate-100", "bg-emerald-200", "bg-emerald-400", "bg-emerald-600"].map((c) => (
            <span key={c} className={`w-3 h-3 rounded-[3px] ${c}`} />
          ))}
        </div>
        <span>Rajin</span>
      </div>
    </div>
  );
};
