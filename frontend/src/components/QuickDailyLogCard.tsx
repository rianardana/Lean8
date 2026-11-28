"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Check, Circle, LoaderCircle, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { DailyLogData } from "@/types";
import { wibDate } from "@/lib/time";

type HabitKey = "workout" | "ifCompleted" | "proteinCompleted" | "waterCompleted" | "sleepCompleted" | "noSnack";

interface QuickDailyLogCardProps {
  onSaved?: () => void;
  onOpenDailyLog: (date: string) => void;
}

const getCompletedCount = (log: DailyLogData) => [
  log.workout, log.ifCompleted, log.proteinCompleted, log.waterCompleted, log.sleepCompleted, log.noSnack,
].filter(Boolean).length;

export const QuickDailyLogCard: React.FC<QuickDailyLogCardProps> = ({ onSaved, onOpenDailyLog }) => {
  const today = wibDate();
  const [log, setLog] = useState<DailyLogData | null>(null);
  const [goal, setGoal] = useState<"cut" | "bulk">("cut");
  const [saving, setSaving] = useState<HabitKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([api.getDaily(today), api.getSettings()]).then(([daily, settings]) => {
      if (!mounted) return;
      if (daily.status === "fulfilled") setLog(daily.value);
      else setError("Catatan cepat belum bisa dimuat.");
      if (settings.status === "fulfilled") setGoal(settings.value.goal === "bulk" ? "bulk" : "cut");
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [today]);

  const habits: { key: HabitKey; label: string }[] = [
    { key: "workout", label: "Gerak" },
    { key: "ifCompleted", label: goal === "bulk" ? "Surplus" : "Puasa" },
    { key: "proteinCompleted", label: "Protein" },
    { key: "waterCompleted", label: "Air putih" },
    { key: "sleepCompleted", label: "Tidur" },
    { key: "noSnack", label: goal === "bulk" ? "Snack sesuai rencana" : "No snack" },
  ];

  const markHabit = async (key: HabitKey) => {
    if (!log || log[key] || saving) return;
    setSaving(key);
    setError("");
    try {
      const saved = await api.quickLogHabit(key);
      setLog(saved);
      onSaved?.();
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white" aria-label="Memuat catatan cepat" />;
  if (!log) return <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500">{error || "Catatan cepat belum tersedia."}</div>;

  const completed = getCompletedCount(log);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="quick-log-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-600">Tanpa form panjang</span>
          <h3 id="quick-log-title" className="text-xl font-bold text-slate-900">Catat Cepat</h3>
          <p className="mt-1 text-xs text-slate-500">Ketuk habit yang sudah dilakukan. Langsung tersimpan.</p>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600"><Zap className="h-5 w-5" /></div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600">Progres hari ini</span>
        <span className="font-mono font-bold text-emerald-700">{completed}/6</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${(completed / 6) * 100}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {habits.map((habit) => {
          const checked = log[habit.key];
          const isSaving = saving === habit.key;
          return (
            <button
              key={habit.key}
              type="button"
              onClick={() => markHabit(habit.key)}
              disabled={checked || saving !== null}
              aria-pressed={checked}
              className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/60"} disabled:cursor-default disabled:opacity-100`}
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : checked ? <Check className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0 text-slate-400" />}
              <span>{habit.label}</span>
            </button>
          );
        })}
      </div>

      {error && <p role="alert" className="mt-3 text-xs font-semibold text-rose-600">{error}</p>}
      <button
        type="button"
        onClick={() => onOpenDailyLog(today)}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
      >
        Buka checklist lengkap <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </section>
  );
};
