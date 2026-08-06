"use client";

import React, { useState } from "react";
import { AiReviewData } from "@/types";
import { api } from "@/lib/api";
import { Sparkles, Bot, CheckCircle2, ArrowRight } from "lucide-react";

interface AiReviewViewProps {
  userId: number;
}

export const AiReviewView: React.FC<AiReviewViewProps> = ({ userId }) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState<boolean>(false);
  const [review, setReview] = useState<AiReviewData | null>(null);

  const handleReview = async () => {
    setLoading(true);
    try { setReview(await api.getAiReview(userId, todayStr)); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-md"><Bot className="w-6 h-6" /></div>
          <div>
            <span className="text-xs font-mono text-teal-400 uppercase tracking-wider">Lean8 AI Coach</span>
            <h2 className="text-2xl font-bold text-slate-100">Evaluasi & Insight Harian</h2>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xl">Personal coach berbasis AI tanpa motivasi kosong. Menganalisa data habit & tren berat badan Anda untuk menghasilkan maksimal 5 poin saran paling praktis.</p>
        <button onClick={handleReview} disabled={loading} className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-500/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50">
          <Sparkles className="w-5 h-5 animate-spin-slow" /><span>{loading ? "Menganalisis Data..." : "Review Hari Ini"}</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {loading && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-8 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Menelaah checklist & grafik berat badan Anda...</p>
        </div>
      )}

      {!loading && review && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Sparkles className="w-5 h-5 text-teal-400" /><span> Poin Praktis Coach</span></h3>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">{review.date}</span>
          </div>
          <div className="space-y-3">
            {review.actionablePoints.map((point, index) => (
              <div key={index} className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-teal-500/30 transition-colors">
                <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-teal-500/20">0{index + 1}</div>
                <p className="text-xs text-slate-200 leading-relaxed pt-0.5">{point}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /><span>Fokus pada eksekusi 1-2 saran utama untuk menjaga momentum konsistensi Anda.</span>
          </div>
        </div>
      )}
    </div>
  );
};