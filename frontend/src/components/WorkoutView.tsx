"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { WORKOUTS, MUSCLE_GROUPS, WorkoutType, Exercise } from "@/data/workouts";
import { PROGRAMS, Program } from "@/data/programs";
import { Dumbbell, Play, Pause, RotateCcw, Timer, ChevronRight, ChevronLeft, ArrowLeft, CheckCircle2, Search } from "lucide-react";
import { api } from "@/lib/api";
import { ProgramEnrollmentData } from "@/types";

type TypeFilter = "all" | WorkoutType;

const TYPE_LABEL: Record<WorkoutType, { label: string; cls: string; emoji: string }> = {
  gym: { label: "Gym", cls: "text-amber-600 bg-amber-500/10 border-amber-500/30", emoji: "🏋️" },
  calisthenics: { label: "Calisthenics", cls: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30", emoji: "🤸" },
};

const fmt = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

const muscleLabel = (key: string) => MUSCLE_GROUPS.find((g) => g.key === key)?.label ?? key;
const exById = (id: string) => WORKOUTS.find((w) => w.id === id);

// Aktivitas cardio manual (type harus cocok dengan MET di /api/workouts)
const ACTIVITIES = [
  { type: "jalan", label: "Jalan", emoji: "🚶" },
  { type: "lari", label: "Lari", emoji: "🏃" },
  { type: "sepeda", label: "Sepeda", emoji: "🚴" },
  { type: "renang", label: "Renang", emoji: "🏊" },
] as const;

const WorkoutTimer: React.FC<{ onElapsedChange?: (sec: number) => void }> = ({ onElapsedChange }) => {
  const [dur, setDur] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      setRemaining((r) => {
        if (r <= 1) { setRunning(false); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => { onElapsedChange?.(elapsed); }, [elapsed, onElapsedChange]);

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
  const [progIdx, setProgIdx] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [progVariant, setProgVariant] = useState<"gym" | "calisthenics">("gym");
  const [enrollments, setEnrollments] = useState<ProgramEnrollmentData[]>([]);
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<TypeFilter>("all");
  const [muscle, setMuscle] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [savedKcal, setSavedKcal] = useState<number | null>(null);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [actType, setActType] = useState<string | null>(null);
  const [actMinutes, setActMinutes] = useState("");
  const [actSavedKcal, setActSavedKcal] = useState<number | null>(null);
  const [savingAct, setSavingAct] = useState(false);

  useEffect(() => { setSavedKcal(null); }, [selected?.id]);
  useEffect(() => { api.getPrograms().then(setEnrollments).catch(() => {}); }, []);

  const saveWorkout = async () => {
    if (!selected || elapsedSec < 10) return;
    setSavingWorkout(true);
    try {
      const minutes = Math.max(1, Math.round(elapsedSec / 60));
      const log = await api.logWorkout({ name: selected.name, type: selected.type, minutes });
      setSavedKcal(log.kcal);
      setSessionKey((k) => k + 1);
    } catch { /* ignore */ }
    setSavingWorkout(false);
  };

  const saveActivity = async () => {
    const mins = Number(actMinutes);
    if (!actType || !mins || mins <= 0) return;
    setSavingAct(true);
    try {
      const act = ACTIVITIES.find((a) => a.type === actType);
      const log = await api.logWorkout({ name: act?.label ?? actType, type: actType, minutes: mins });
      setActSavedKcal(log.kcal);
      setActMinutes("");
      setActType(null);
    } catch { /* ignore */ }
    setSavingAct(false);
  };

  const q = query.trim().toLowerCase();
  const list = WORKOUTS.filter(
    (e) => (type === "all" || e.type === type) && (muscle === "all" || e.muscle === muscle) && (!q || e.name.toLowerCase().includes(q))
  );

  const enrollmentFor = (programId: string, variant: string) => enrollments.find((e) => e.programId === programId && e.variant === variant);
  const setEnrollment = (e: ProgramEnrollmentData) => setEnrollments((prev) => [...prev.filter((x) => !(x.programId === e.programId && x.variant === e.variant)), e]);

  const startProg = async (programId: string, variant: string) => {
    setBusy(true);
    try { setEnrollment(await api.startProgram(programId, variant)); } catch { /* ignore */ }
    setBusy(false);
  };
  const advanceProg = async (programId: string, variant: string) => {
    setBusy(true);
    try { setEnrollment(await api.advanceProgram(programId, variant)); } catch { /* ignore */ }
    setBusy(false);
  };
  const cancelProg = async (programId: string, variant: string) => {
    setBusy(true);
    try {
      await api.cancelProgram(programId, variant);
      setEnrollments((prev) => prev.filter((x) => !(x.programId === programId && x.variant === variant)));
    } catch { /* ignore */ }
    setBusy(false);
  };
  const restartProg = async (programId: string, variant: string) => {
    setBusy(true);
    try {
      await api.cancelProgram(programId, variant);
      setEnrollment(await api.startProgram(programId, variant));
    } catch { /* ignore */ }
    setBusy(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Program workout */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Program</span>
          <h3 className="text-base font-bold text-slate-900">Program Pilihan</h3>
          <p className="text-xs text-slate-500 mt-0.5">Geser, lalu tekan untuk mulai latihan.</p>
        </div>

        <div className="relative">
          <div
            className="overflow-hidden rounded-2xl"
            onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX == null) return;
              const dx = e.changedTouches[0].clientX - touchX;
              if (Math.abs(dx) > 40) setProgIdx((i) => Math.min(PROGRAMS.length - 1, Math.max(0, i + (dx < 0 ? 1 : -1))));
              setTouchX(null);
            }}
          >
            <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${progIdx * 100}%)` }}>
              {PROGRAMS.map((p) => {
                const progEnroll = enrollments.filter((e) => e.programId === p.id);
                const active = progEnroll.find((e) => !e.done) ?? progEnroll[0];
                return (
                  <button key={p.id} onClick={() => { setSelectedProgram(p); setProgVariant(p.variants[0].type); }} className="w-full shrink-0 flex justify-center text-left">
                    <div className="relative h-96 w-64">
                      {p.cover ? (
                        <img src={p.cover} alt={p.name} className="h-96 w-64 rounded-2xl object-cover border border-slate-200" />
                      ) : (
                        <div className="h-96 w-64 rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-500 to-teal-500 p-5 flex flex-col justify-between text-white">
                          <span className="text-4xl">{p.emoji}</span>
                          <div>
                            <p className="text-base font-bold leading-tight">{p.name}</p>
                            <p className="text-xs opacity-80 mt-1.5 leading-snug">{p.tagline}</p>
                          </div>
                        </div>
                      )}
                      {active && (
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white whitespace-nowrap">
                          {active.done ? "✓ Selesai" : `🔥 Hari ${active.currentDay}/7`}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {progIdx > 0 && (
            <button onClick={() => setProgIdx(progIdx - 1)} className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-slate-200 shadow flex items-center justify-center text-slate-700 hover:bg-white transition" aria-label="Sebelumnya">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {progIdx < PROGRAMS.length - 1 && (
            <button onClick={() => setProgIdx(progIdx + 1)} className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-slate-200 shadow flex items-center justify-center text-slate-700 hover:bg-white transition" aria-label="Berikutnya">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex justify-center gap-1.5">
          {PROGRAMS.map((_, i) => (
            <button key={i} onClick={() => setProgIdx(i)} aria-label={`Program ${i + 1}`} className={`h-2 rounded-full transition-all ${i === progIdx ? "w-6 bg-emerald-500" : "w-2 bg-slate-200 hover:bg-slate-300"}`} />
          ))}
        </div>
      </div>

      {/* Tambah aktivitas manual */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Cardio / Aktivitas</span>
          <h3 className="text-base font-bold text-slate-900">Tambah Aktivitas Manual</h3>
          <p className="text-xs text-slate-500 mt-0.5">Jalan, lari, sepeda — isi durasi, langsung dihitung kalorinya.</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.type}
              onClick={() => setActType(a.type)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all ${actType === a.type ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}
            >
              <span className="text-2xl leading-none">{a.emoji}</span>
              <span className={`text-[10px] font-semibold ${actType === a.type ? "text-emerald-700" : "text-slate-500"}`}>{a.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={actMinutes}
            onChange={(e) => setActMinutes(e.target.value)}
            placeholder="Durasi (menit)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={saveActivity}
            disabled={!actType || !actMinutes || savingAct}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:opacity-95 disabled:opacity-40 transition"
          >
            {savingAct ? "..." : "Simpan"}
          </button>
        </div>
        {actSavedKcal != null && (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-sm font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" /> Tersimpan · ±{actSavedKcal} kcal terbakar 🔥
          </div>
        )}
      </div>

      <div className="bg-white backdrop-blur-md border border-slate-200 rounded-3xl p-6 space-y-4">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Panduan Latihan</span>
          <h2 className="text-2xl font-bold text-slate-900">Workout Library</h2>
          <p className="text-xs text-slate-500 mt-1">Pilih gerakan gym atau kalisthenics, klik untuk lihat demo &amp; timer.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari gerakan (mis. squat, pull up)..."
            className="bg-transparent text-xs text-slate-900 focus:outline-none w-full placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2">
          {([["all", "Semua", "✨"], ["gym", "Gym", "🏋️"], ["calisthenics", "Calisthenics", "🤸"]] as const).map(([key, label, emoji]) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${type === key ? "bg-emerald-500 border-emerald-400 text-slate-950" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              <span className="text-sm leading-none">{emoji}</span> {label}
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
                  <div className="w-10 h-10 rounded-xl border bg-slate-50 border-slate-200 flex items-center justify-center">
                    <span className="text-xl leading-none">{e.emoji}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{e.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{muscleLabel(e.muscle)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${t.cls}`}>{t.emoji} {t.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail gerakan */}
      {selected && createPortal(
        <div className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto overscroll-contain">
          <div className="max-w-3xl mx-auto min-h-screen">
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-slate-100 transition" aria-label="Kembali">
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <h2 className="text-base font-bold text-slate-900">{selected.name}</h2>
            </div>

            <div className="px-4 py-5 pb-28 space-y-4">
              {selected.gif ? (
                selected.gif.endsWith(".webm") ? (
                  <video src={selected.gif} autoPlay loop muted playsInline className="w-full h-56 object-contain rounded-2xl bg-black" />
                ) : (
                  <img src={selected.gif} alt={selected.name} loading="lazy" className="w-full h-56 object-contain rounded-2xl bg-slate-100" />
                )
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

              <WorkoutTimer key={sessionKey} onElapsedChange={setElapsedSec} />

              {savedKcal != null ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-sm font-semibold animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Workout tersimpan · ±{savedKcal} kcal terbakar 🔥
                </div>
              ) : (
                <button
                  onClick={saveWorkout}
                  disabled={elapsedSec < 10 || savingWorkout}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  {savingWorkout ? 'Menyimpan...' : `Simpan Workout · ${fmt(elapsedSec)}`}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Detail program */}
      {selectedProgram && (() => {
        const variant = selectedProgram.variants.find((v) => v.type === progVariant) ?? selectedProgram.variants[0];
        const enrollment = enrollmentFor(selectedProgram.id, variant.type);
        return createPortal(
          <div className="fixed inset-0 z-[55] bg-slate-50 overflow-y-auto overscroll-contain">
            <div className="max-w-3xl mx-auto min-h-screen">
              <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                <button onClick={() => setSelectedProgram(null)} className="p-2 rounded-full hover:bg-slate-100 transition" aria-label="Kembali">
                  <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h2 className="text-base font-bold text-slate-900">{selectedProgram.name}</h2>
              </div>

              <div className="px-4 py-5 pb-28 space-y-4">
                {selectedProgram.cover ? (
                  <img src={selectedProgram.cover} alt={selectedProgram.name} className="w-64 mx-auto rounded-2xl border border-slate-200" />
                ) : (
                  <div className="w-64 mx-auto h-96 rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-500 to-teal-500 p-5 flex flex-col justify-between text-white">
                    <span className="text-4xl">{selectedProgram.emoji}</span>
                    <div>
                      <p className="text-base font-bold leading-tight">{selectedProgram.name}</p>
                      <p className="text-xs opacity-80 mt-1.5 leading-snug">{selectedProgram.tagline}</p>
                    </div>
                  </div>
                )}

                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">{selectedProgram.emoji} {selectedProgram.name}</h2>
                  <p className="text-sm text-slate-500">{selectedProgram.tagline}</p>
                  <p className="text-xs text-slate-400 font-mono">{selectedProgram.progression}</p>
                </div>

                <div className="flex gap-2">
                  {selectedProgram.variants.map((v) => (
                    <button key={v.type} onClick={() => setProgVariant(v.type)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${progVariant === v.type ? "bg-emerald-500 border-emerald-400 text-slate-950" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                      {v.type === "gym" ? "🏋️ Gym" : "🤸 Calisthenics"}
                    </button>
                  ))}
                </div>

                {/* Progress & aksi */}
                {!enrollment ? (
                  <button onClick={() => startProg(selectedProgram.id, variant.type)} disabled={busy} className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm hover:opacity-95 disabled:opacity-40 transition">
                    {busy ? "..." : "🚀 Mulai Program"}
                  </button>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                    {enrollment.done ? (
                      <p className="text-center text-sm font-bold text-slate-900">🎉 Program Selesai!</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">Hari {enrollment.currentDay} dari 7</span>
                          <span className="text-slate-400 font-mono">{Math.round(((enrollment.currentDay - 1) / 7) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${((enrollment.currentDay - 1) / 7) * 100}%` }} />
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      {enrollment.done ? (
                        <button onClick={() => restartProg(selectedProgram.id, variant.type)} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs disabled:opacity-40">Ulangi Program</button>
                      ) : (
                        <button onClick={() => advanceProg(selectedProgram.id, variant.type)} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs disabled:opacity-40">✓ Selesai Hari Ini</button>
                      )}
                      <button onClick={() => cancelProg(selectedProgram.id, variant.type)} disabled={busy} className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-semibold text-xs hover:border-red-300 hover:text-red-600 transition disabled:opacity-40">Berhenti</button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {variant.days.map((d) => {
                    const status = d.rest ? "rest" : !enrollment ? null : enrollment.done || d.day < enrollment.currentDay ? "done" : d.day === enrollment.currentDay ? "today" : "upcoming";
                    return (
                      <div key={d.day} className={`bg-white border rounded-2xl p-4 ${status === "today" ? "border-amber-400 bg-amber-50/40" : "border-slate-200"}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-emerald-600 font-semibold">Hari {d.day}</span>
                          <span className="text-sm font-semibold text-slate-900">{d.title}</span>
                          {status === "done" && <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">✓ Selesai</span>}
                          {status === "today" && <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">Hari ini</span>}
                        </div>
                        {d.rest ? (
                          <p className="text-xs text-slate-400 mt-1.5">😴 Istirahat — pemulihan itu bagian dari progress.</p>
                        ) : (
                          <div className="mt-2.5 space-y-1.5">
                            {d.exercises.map((id) => {
                              const ex = exById(id);
                              if (!ex) return null;
                              return (
                                <button key={id} onClick={() => setSelected(ex)} className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 transition text-left">
                                  <span className="text-xl leading-none">{ex.emoji}</span>
                                  <span className="text-sm font-medium text-slate-900">{ex.name}</span>
                                  <span className="ml-auto text-[11px] font-mono text-slate-400">{ex.setsReps}</span>
                                </button>
                              );
                            })}
                            {d.note && <p className="text-[11px] text-slate-400 mt-2">{d.note}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
};
