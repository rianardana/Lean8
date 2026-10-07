"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Scale } from "lucide-react";

const todayStr = () => new Date().toISOString().split("T")[0];

export const WeightNudge: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  const [needsWeight, setNeedsWeight] = useState(false);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.getWeights()
      .then((ws) => {
        if (!mounted) return;
        const last = ws[ws.length - 1];
        if (!last || last.date !== todayStr()) setNeedsWeight(true);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(val);
    if (isNaN(w) || w <= 0) return;
    setSaving(true);
    try {
      await api.logWeight(w);
      setSaved(true);
      setNeedsWeight(false);
      if (onSaved) onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (!needsWeight || saved) return null;

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm"
    >
      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
        <Scale className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">Timbang hari ini?</p>
        <p className="text-[11px] text-slate-500">Berat harian bikin prediksi target makin akurat.</p>
      </div>
      <input
        type="number"
        step="0.1"
        inputMode="decimal"
        placeholder="84.5"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-400"
      />
      <button
        type="submit"
        disabled={saving || !val}
        className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs disabled:opacity-50"
      >
        {saving ? "..." : "Simpan"}
      </button>
    </form>
  );
};
