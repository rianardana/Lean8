"use client";

import React, { useState, useEffect } from "react";
import { WeightLogData } from "@/types";
import { api } from "@/lib/api";
import { Plus, Calendar, Scale, CheckCircle2 } from "lucide-react";

interface ProgressViewProps {
  userId: number;
  onWeightLogged?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ userId, onWeightLogged }) => {
  const [weights, setWeights] = useState<WeightLogData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const todayStr = new Date().toISOString().split("T")[0];
  const [newWeight, setNewWeight] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const fetchWeights = async () => {
    setLoading(true);
    try { setWeights(await api.getWeights(userId)); } finally { setLoading(false); }
  };

  useEffect(() => { fetchWeights(); }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeight);
    if (isNaN(val) || val <= 0) return;
    setSubmitting(true);
    try {
      await api.logWeight(userId, val, selectedDate);
      setNewWeight(""); setSuccessMsg(true);
      await fetchWeights();
      if (onWeightLogged) onWeightLogged();
      setTimeout(() => setSuccessMsg(false), 3000);
    } finally { setSubmitting(false); }
  };

  const minWeight = weights.length ? Math.min(...weights.map((w) => w.weight)) - 1 : 60;
  const maxWeight = weights.length ? Math.max(...weights.map((w) => w.weight)) + 1 : 90;
  const range = Math.max(1, maxWeight - minWeight);
  const points = weights.map((w, index) => {
    const x = (index / Math.max(1, weights.length - 1)) * 300;
    const y = 120 - ((w.weight - minWeight) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-4">
          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Weight Logger</span>
            <h3 className="text-xl font-bold text-slate-100">Catat Berat Badan</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Tanggal Log</label>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-xs text-slate-200 focus:outline-none w-full cursor-pointer" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Berat (kg)</label>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Scale className="w-4 h-4 text-emerald-400" />
                <input type="number" step="0.1" placeholder="Contoh: 84.5" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="bg-transparent text-xs text-slate-200 focus:outline-none w-full" required />
              </div>
            </div>
            {successMsg && (<p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Berat berhasil tercatat!</p>)}
            <button type="submit" disabled={submitting || !newWeight} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /><span>{submitting ? "Menyimpan..." : "Simpan Log Berat"}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Trend Visualizer</span>
              <h3 className="text-xl font-bold text-slate-100">Grafik Perjalanan Berat Badan</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Terbaru</span>
              <p className="text-lg font-black text-emerald-400">{weights.length ? `${weights[weights.length - 1].weight} kg` : "-"}</p>
            </div>
          </div>
          <div className="relative w-full h-44 bg-slate-950/60 rounded-2xl border border-slate-800/60 p-4 flex items-center justify-center">
            {loading ? (<span className="text-xs text-slate-500 animate-pulse">Memuat grafik...</span>)
              : weights.length < 2 ? (<span className="text-xs text-slate-500">Minimal 2 entri berat untuk menampilkan trend grafik.</span>)
              : (
              <svg viewBox="0 0 300 140" className="w-full h-full overflow-visible">
                <defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity="0.4" /><stop offset="100%" stopColor="#10B981" stopOpacity="0.0" /></linearGradient></defs>
                <polygon points={`0,140 ${points} 300,140`} fill="url(#chartGradient)" />
                <polyline fill="none" stroke="#10B981" strokeWidth="2.5" points={points} />
                {weights.map((w, index) => {
                  const x = (index / Math.max(1, weights.length - 1)) * 300;
                  const y = 120 - ((w.weight - minWeight) / range) * 100;
                  return (<g key={w.id || index}><circle cx={x} cy={y} r="4" fill="#090D16" stroke="#10B981" strokeWidth="2" /></g>);
                })}
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-100">Riwayat Penimbangan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
              <tr><th className="py-2.5 px-4 rounded-l-xl">Tanggal</th><th className="py-2.5 px-4">Berat (kg)</th><th className="py-2.5 px-4 rounded-r-xl">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {weights.map((w) => (
                <tr key={w.id || w.date} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono">{w.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-100">{w.weight} kg</td>
                  <td className="py-3 px-4"><span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">Tercatat</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};