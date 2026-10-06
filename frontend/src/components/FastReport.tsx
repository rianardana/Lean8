"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FastData } from "@/types";

type Range = "week" | "month" | "year";

const RANGES: { id: Range; label: string }[] = [
  { id: "week", label: "Mingguan" },
  { id: "month", label: "Bulanan" },
  { id: "year", label: "Tahunan" },
];

const DAY = 86400000;

function buildBuckets(range: Range): { label: string; start: number; end: number; hours: number }[] {
  const now = new Date();
  const buckets: { label: string; start: number; end: number; hours: number }[] = [];
  if (range === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({ label: d.toLocaleDateString("id-ID", { weekday: "short" }), start: d.getTime(), end: d.getTime() + DAY, hours: 0 });
    }
  } else if (range === "month") {
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
      buckets.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, start: d.getTime(), end: d.getTime() + 7 * DAY, hours: 0 });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({ label: d.toLocaleDateString("id-ID", { month: "short" }), start: d.getTime(), end: next.getTime(), hours: 0 });
    }
  }
  return buckets;
}

function aggregate(range: Range, history: FastData[]) {
  const buckets = buildBuckets(range);
  for (const f of history) {
    if (!f.endedAt) continue;
    const start = new Date(f.startedAt).getTime();
    const end = new Date(f.endedAt).getTime();
    const hours = Math.max(0, (end - start) / 3600000);
    const b = buckets.find((b) => start >= b.start && start < b.end);
    if (b) b.hours += hours;
  }
  return buckets;
}

export const FastReport: React.FC = () => {
  const [history, setHistory] = useState<FastData[]>([]);
  const [range, setRange] = useState<Range>("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getFast().then((d) => { if (mounted) setHistory(d.history); }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const buckets = aggregate(range, history);
  const completed = history.filter((f) => f.endedAt).length;
  const totalHours = buckets.reduce((s, b) => s + b.hours, 0);
  const max = Math.max(1, ...buckets.map((b) => b.hours));

  const W = 320, H = 160, P = 10;
  const pts = buckets.map((b, i) => {
    const x = buckets.length <= 1 ? W / 2 : P + (i / (buckets.length - 1)) * (W - P * 2);
    const y = H - P - (b.hours / max) * (H - P * 2);
    return { x, y };
  });
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `0,${H} ${line} ${W},${H}`;

  if (loading) return <div className="text-center py-16 text-slate-500 text-sm animate-pulse">Memuat laporan...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Laporan Puasa</span>
          <h2 className="text-2xl font-bold text-slate-900">Statistik Fasting</h2>
          <p className="text-xs text-slate-500 mt-1">Jam puasa per {range === "week" ? "hari" : range === "month" ? "minggu" : "bulan"}.</p>
        </div>

        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${range === r.id ? "bg-emerald-500 border-emerald-400 text-slate-950" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-[11px] text-slate-500 font-mono uppercase">Total Jam</p>
            <p className="text-2xl font-black text-emerald-600 font-mono">{totalHours.toFixed(0)}<span className="text-xs font-semibold text-slate-400"> jam</span></p>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-[11px] text-slate-500 font-mono uppercase">Sesi Selesai</p>
            <p className="text-2xl font-black text-emerald-600 font-mono">{completed}<span className="text-xs font-semibold text-slate-400"> puasa</span></p>
          </div>
        </div>

        {completed === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">Belum ada puasa selesai. Mulai atau catat puasa dulu ya.</p>
        ) : (
          <div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
              <defs>
                <linearGradient id="fastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={area} fill="url(#fastGrad)" />
              <polyline points={line} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#10B981" strokeWidth="2" />
              ))}
            </svg>
            <div className="flex mt-1.5">
              {buckets.map((b, i) => (
                <span key={i} className="flex-1 text-center text-[9px] text-slate-500 truncate">{b.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
