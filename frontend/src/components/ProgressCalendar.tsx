"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays, Check, Circle, Dumbbell, Image as ImageIcon, Ruler, Scale, Utensils, Timer } from "lucide-react";
import { api } from "@/lib/api";
import { ProgressCalendarData, ProgressCalendarDay } from "@/types";

interface ProgressCalendarProps {
  onOpenDailyLog: (date: string) => void;
}

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const HABITS = [
  { key: "workout", label: "Workout / gerak" },
  { key: "ifCompleted", label: "Target nutrisi" },
  { key: "proteinCompleted", label: "Protein" },
  { key: "waterCompleted", label: "Air putih" },
  { key: "sleepCompleted", label: "Tidur cukup" },
  { key: "noSnack", label: "Rencana snack" },
] as const;

function dateAtLocalNoon(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(dateAtLocalNoon(date));
}

function hasProgress(day: ProgressCalendarDay) {
  return day.hasHabitLog || day.weight !== null || day.workoutCount > 0 || day.mealCount > 0
    || day.fastCount > 0 || day.hasMeasurement || day.photoCount > 0;
}

function habitColor(count: number, hasAny: boolean) {
  if (count >= 5) return "bg-emerald-600 text-white";
  if (count >= 3) return "bg-emerald-300 text-emerald-950";
  if (count > 0) return "bg-emerald-100 text-emerald-900";
  return hasAny ? "bg-slate-100 text-slate-700" : "bg-white text-slate-400 hover:bg-slate-50";
}

export const ProgressCalendar: React.FC<ProgressCalendarProps> = ({ onOpenDailyLog }) => {
  const [data, setData] = useState<ProgressCalendarData | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    api.getProgressCalendar()
      .then((result) => {
        if (!mounted) return;
        setData(result);
        const mostRecent = [...result.days].reverse().find(hasProgress);
        setSelectedDate(mostRecent?.date ?? result.endDate);
      })
      .catch(() => { if (mounted) setError("Kalender progres belum bisa dimuat."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" aria-label="Memuat kalender progres" />;
  }

  if (!data) {
    return <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">{error || "Kalender progres belum tersedia."}</section>;
  }

  const firstWeekday = (dateAtLocalNoon(data.startDate).getDay() + 6) % 7;
  const cells: (ProgressCalendarDay | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...data.days,
  ];
  const selected = data.days.find((day) => day.date === selectedDate) ?? data.days[data.days.length - 1];
  const selectedHasProgress = hasProgress(selected);
  const hasOtherProgress = selected.weight !== null || selected.workoutCount > 0 || selected.mealCount > 0
    || selected.fastCount > 0 || selected.hasMeasurement || selected.photoCount > 0;

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="progress-calendar-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-600">Jejak Konsistensi</span>
          <h3 id="progress-calendar-title" className="text-xl font-bold text-slate-900">Kalender Progres</h3>
          <p className="mt-1 text-xs text-slate-500">30 hari terakhir · setiap catatan kecil ikut dihitung.</p>
        </div>
        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600"><CalendarDays className="h-5 w-5" /></div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="group" aria-label="Kalender 30 hari terakhir">
        {WEEKDAYS.map((day) => (
          <div key={day} aria-hidden="true" className="pb-1 text-center text-[10px] font-semibold text-slate-400">{day}</div>
        ))}
        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} aria-hidden="true" />;
          const selectedCell = day.date === selectedDate;
          const todayCell = day.date === data.endDate;
          const hasAny = hasProgress(day);
          const dayNum = String(Number(day.date.slice(-2)));
          const dateDescription = `${formatDate(day.date)}, ${day.hasHabitLog ? `${day.habitCount} dari 6 habit` : "belum ada checklist habit"}${hasAny && !day.hasHabitLog ? ", progres lain tercatat" : ""}`;
          return (
            <button
              key={day.date}
              type="button"
              aria-label={dateDescription}
              aria-pressed={selectedCell}
              title={dateDescription}
              onClick={() => setSelectedDate(day.date)}
              className={`relative aspect-square min-h-9 rounded-xl border text-center transition hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${habitColor(day.habitCount, hasAny)} ${selectedCell ? "border-emerald-600 ring-2 ring-emerald-500/30" : "border-transparent"} ${todayCell ? "font-black" : "font-semibold"}`}
            >
              <span className="block text-xs leading-tight">{dayNum}</span>
              <span className={`block text-[9px] leading-tight ${day.habitCount >= 5 ? "text-white/80" : "opacity-65"}`}>
                {day.hasHabitLog ? `${day.habitCount}/6` : hasAny ? "•" : ""}
              </span>
              {todayCell && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-cyan-500" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>Habit tercapai</span>
          <span className="h-3 w-3 rounded bg-slate-100" aria-hidden="true" />
          <span className="h-3 w-3 rounded bg-emerald-100" aria-hidden="true" />
          <span className="h-3 w-3 rounded bg-emerald-300" aria-hidden="true" />
          <span className="h-3 w-3 rounded bg-emerald-600" aria-hidden="true" />
          <span>lebih banyak</span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400">Titik biru = hari ini</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wide text-emerald-600">Detail hari</p>
            <h4 className="mt-0.5 text-sm font-bold capitalize text-slate-900">{formatDate(selected.date)}</h4>
            <p className="mt-1 text-xs text-slate-500">
              {selected.hasHabitLog ? `${selected.habitCount} dari 6 habit tercapai` : "Checklist habit belum dicatat"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenDailyLog(selected.date)}
            className="shrink-0 rounded-xl bg-emerald-500 px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-600"
          >
            {selected.hasHabitLog ? "Lihat / edit checklist" : "Catat checklist"}
          </button>
        </div>

        {selected.hasHabitLog && selected.habits && (
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
            {HABITS.map((habit) => {
              const completed = selected.habits?.[habit.key] ?? false;
              return (
                <div key={habit.key} className={`flex items-center gap-1.5 text-[10px] ${completed ? "font-semibold text-emerald-700" : "text-slate-400"}`}>
                  {completed ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3 w-3 shrink-0" />}
                  <span>{habit.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {hasOtherProgress && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-200 pt-3">
            {selected.weight !== null && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"><Scale className="h-3 w-3 text-emerald-600" />{selected.weight} kg</span>}
            {selected.workoutCount > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"><Dumbbell className="h-3 w-3 text-emerald-600" />{selected.workoutCount} workout</span>}
            {selected.mealCount > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"><Utensils className="h-3 w-3 text-amber-600" />{selected.mealCount} makanan</span>}
            {selected.fastCount > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"><Timer className="h-3 w-3 text-sky-600" />{selected.fastCount} puasa selesai</span>}
            {selected.hasMeasurement && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"><Ruler className="h-3 w-3 text-violet-600" />Ukuran tubuh</span>}
            {selected.photoCount > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"><ImageIcon className="h-3 w-3 text-pink-600" />{selected.photoCount} foto progres</span>}
          </div>
        )}

        {!selectedHasProgress && <p className="mt-3 text-[11px] text-slate-400">Belum ada progres tercatat pada tanggal ini. Kamu masih bisa melengkapi checklist.</p>}
      </div>
    </section>
  );
};
