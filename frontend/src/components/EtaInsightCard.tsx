"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrendingUp } from "lucide-react";

const KEY = "lean8_eta_insight";

export const EtaInsightCard: React.FC = () => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const today = new Date().toISOString().split("T")[0];
    try {
      const cached = localStorage.getItem(KEY);
      if (cached) {
        const p = JSON.parse(cached);
        if (p.date === today && typeof p.insight === "string") {
          setInsight(p.insight);
          setLoading(false);
          return;
        }
      }
    } catch { /* abaikan cache rusak */ }

    api
      .getEtaInsight()
      .then((d) => {
        if (!mounted) return;
        setInsight(d.insight);
        localStorage.setItem(KEY, JSON.stringify({ date: d.date, insight: d.insight }));
      })
      .catch(() => { if (mounted) setInsight(null); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  if (loading || !insight) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono text-teal-600 uppercase tracking-wider">Analisa AI</span>
            <h3 className="text-lg font-bold text-slate-900">Prediksi Capai Target</h3>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">diperbarui harian</span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
    </div>
  );
};
