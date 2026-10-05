"use client";

import React, { useState, useEffect } from "react";
import { WORKOUTS, MUSCLE_GROUPS, WorkoutType, Exercise } from "@/data/workouts";
import { Dumbbell, Play, Pause, RotateCcw, Timer, ChevronRight, ArrowLeft } from "lucide-react";

type TypeFilter = "all" | WorkoutType;

const TYPE_LABEL: Record<WorkoutType, { label: string; cls: string }> = {
  gym: { label: "Gym", cls: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
  calisthenics: { label: "Calisthenics", cls: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
};

const fmt = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

const muscleLabel = (key: string) => MUSCLE_GROUPS.find((g) => g.key === key)?.label ?? key;

const WorkoutTimer: React.FC = () => {
  const [dur, setDur] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { setRunning(false); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const pickDur = (d: number) => { if (!running) { setDur(d); setRemaining(d); } };
  const start = () => { setRemaining((r) => (r === 0 ? dur : r)); setRunning(true); };
  const reset = () => { setRunning(false); setRemaining(dur); };

  return (
    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-6 space-y-4 text-white shadow-lg shadow-emerald-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          <h3 className="text-sm font-bold">Timer Latihan</h3>
        </div>
        <div className="flex gap-1.5">
          {[60, 120].map((d) => (
            <button
              key={d}
              onClick={() => pickDur(d)}
              disabled={running}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 ${dur === d ? "bg-white text-emerald-700" : "bg-white/20 text-white hover:bg-white/30"}`}
            >
              {d / 60} menit
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <div className={`font-mono font-bold leading-none ${remaining === 0 ? "text-4xl" : "text-6xl"}`}>
          {remaining === 0 ? "Selesai!" : fmt(remaining)}
        </div>
        <div className="w-full h-2.5 bg-white/25 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-white rounded-full transition-all duration-1000 ease-linear" style={{ width: `${(remaining / dur) * 100}%` }} />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={running ? (() => setRunning(false)) : start}
          className="flex-1 py-3 rounded-2xl bg-slate-950 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {running ? <><Pause className="w-4 h-4" /> Jeda</> : <><Play className="w-4 h-4" /> {remaining === 0 || remaining === dur ? "Mulai Latihan" : "Lanjut"}</>}
        </button>
        <button
          onClick={reset}
          className="px-4 py-3 rounded-2xl bg-white/20 text-white font-bold text-sm flex items-center gap-2 hover:bg-white/30 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>
    </div>
  );
};

export const WorkoutView: React.FC = () => {
  const [type, setType] = useState<TypeFilter>("all");
  const [muscle, setMuscle] = useState<string>("all");
  const [selected, setSelected] = useState<Exercise | null>(null);

  const list = WORKOUTS.filter(
    (e) => (type === "all" || e.type === type) && (muscle === "all" || e.muscle === muscle)
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white backdrop-blur-md border border-slate-200 rounded-3xl p-6 space-y-4">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Panduan Latihan</span>
          <h2 className="text-2xl font-bold text-slate-900">Workout Library</h2>
          <p className="text-xs text-slate-500 mt-1">Pilih gerakan gym atau kalisthenics, klik untuk lihat demo &amp; timer.</p>
        </div>

        <div className="flex gap-2">
          {([["all", "Semua"], ["gym", "Gym"], ["calisthenics", "Calisthenics"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${type === key ? "bg-emerald-500 border-emerald-400 text-slate-950" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => setMuscle(muscle === g.key ? "all" : g.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${muscle === g.key ? "bg-teal-500 border-teal-400 text-slate-950" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">Belum ada gerakan untuk filter ini.</div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {list.map((e) => {
            const t = TYPE_LABEL[e.type];
            return (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className="text-left bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 transition-all hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl border bg-slate-50 border-slate-200">
                    <Dumbbell className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{e.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{muscleLabel(e.muscle)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${t.cls}`}>{t.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail gerakan */}
      {selected && (
        <div className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto">
          <div className="max-w-3xl mx-auto min-h-screen">
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-slate-100 transition" aria-label="Kembali">
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <h2 className="text-base font-bold text-slate-900">{selected.name}</h2>
            </div>

            <div className="px-4 py-5 space-y-4">
              {selected.gif ? (
                <img src={selected.gif} alt={selected.name} loading="lazy" className="w-full h-56 object-contain rounded-2xl bg-slate-100" />
              ) : (
                <div className="w-full h-56 bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-300">
                  <Dumbbell className="w-6 h-6" />
                  <span className="text-[11px] font-medium">Belum ada demo</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${TYPE_LABEL[selected.type].cls}`}>{TYPE_LABEL[selected.type].label}</span>
                <span className="text-[11px] text-slate-400 font-mono">{muscleLabel(selected.muscle)}</span>
                <span className="ml-auto text-xs font-semibold text-emerald-600 font-mono">{selected.setsReps}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <p className="text-sm text-slate-600 leading-relaxed">{selected.how}</p>
                {selected.tip && <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">{selected.tip}</p>}
              </div>

              <WorkoutTimer />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
