"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { wibDate } from "@/lib/time";
import { Heart } from "lucide-react";

const KEY = "lean8_motivation";

export const MotivationCard: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const today = wibDate();
    try {
      const cached = localStorage.getItem(KEY);
      if (cached) {
        const p = JSON.parse(cached);
        if (p.date === today && typeof p.message === "string") {
          setMessage(p.message);
          setLoading(false);
          return;
        }
      }
    } catch { /* abaikan cache rusak */ }

    api
      .getMotivation()
      .then((d) => {
        if (!mounted) return;
        setMessage(d.message);
        localStorage.setItem(KEY, JSON.stringify({ date: d.date, message: d.message }));
      })
      .catch(() => { if (mounted) setMessage(null); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  if (loading || !message) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 space-y-2 shadow-lg">
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-white/90" />
        <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">Motivasi Harian</span>
      </div>
      <p className="text-sm text-white leading-relaxed font-medium">{message}</p>
    </div>
  );
};
