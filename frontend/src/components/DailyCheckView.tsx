"use client";

import React, { useState, useEffect } from "react";
import { DailyLogData } from "@/types";
import { api } from "@/lib/api";
import { Dumbbell, Clock, Utensils, Droplets, Moon, Ban, Save, CheckCircle2, Calendar } from "lucide-react";

interface DailyCheckViewProps {
  onSaved?: () => void;
}

export const DailyCheckView: React.FC<DailyCheckViewProps> = ({ onSaved }) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [log, setLog] = useState<DailyLogData>({
    date: todayStr,
    workout: false,
    ifCompleted: false,
    proteinCompleted: false,
    waterCompleted: false,
    sleepCompleted: false,
    noSnack: false,
    notes: "",
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getDaily(selectedDate).then((data) => {
      if (isMounted) {
        setLog(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const toggleHabit = (key: keyof Omit<DailyLogData, "id" | "date" | "notes" | "completedCount">) => {
    setLog((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await api.saveDaily(log);
      setLog(saved);
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Fallback handles state seamlessly
    } finally {
      setSaving(false);
    }
  };

  const habits = [
    {
      id: "workout",
      title: "Workout / Movement",
      desc: "Latihan beban, kalistenik, atau jalan kaki 20+ menit",
      icon: Dumbbell,
      completed: log.workout,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "ifCompleted",
      title: "Intermittent Fasting",
      desc: "Patuhi jendela fasting 16:8 atau sesuai target",
      icon: Clock,
      completed: log.ifCompleted,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
    {
      id: "proteinCompleted",
      title: "Protein Target",
      desc: "Tercapai asupan protein harian untuk memelihara otot",
      icon: Utensils,
      completed: log.proteinCompleted,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      id: "waterCompleted",
      title: "Air Putih",
      desc: "Minum minimal 2.5 - 3 Liter air putih per hari",
      icon: Droplets,
      completed: log.waterCompleted,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      id: "sleepCompleted",
      title: "Tidur Cukup",
      desc: "Tidur 7-8 jam berkualitas & matikan layar tepat waktu",
      icon: Moon,
      completed: log.sleepCompleted,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      id: "noSnack",
      title: "No Snack / Zero Junk",
      desc: "Bebas snack manis/olahan di luar jadwal makan utama",
      icon: Ban,
      completed: log.noSnack,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ] as const;

  const completedCount = habits.filter((h) => h.completed).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Date Header & Meter */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Input Harian (&lt; 60 detik)</span>
            <h2 className="text-2xl font-bold text-slate-100">Daily Checklist</h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Completion Gauge */}
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Pencapaian Habit Hari Ini</span>
            <span className="text-emerald-400 font-mono">{completedCount} dari 6 Tercentang</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/30"
              style={{ width: `${(completedCount / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Habit Cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm animate-pulse">Memuat checklist...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {habits.map((habit) => {
            const Icon = habit.icon;
            return (
              <div
                key={habit.id}
                onClick={() => toggleHabit(habit.id as keyof Omit<DailyLogData, "id" | "date" | "notes" | "completedCount">)}
                className={`group cursor-pointer select-none rounded-2xl border p-4 transition-all duration-200 flex items-start justify-between gap-3 ${
                  habit.completed
                    ? "bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-500/5"
                    : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border ${habit.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-sm font-semibold transition-colors ${habit.completed ? "text-slate-100" : "text-slate-300"}`}>
                      {habit.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{habit.desc}</p>
                  </div>
                </div>

                {/* Toggle Switch Pill */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 ${
                    habit.completed
                      ? "bg-emerald-500 border-emerald-400 text-slate-950 scale-110 shadow-sm shadow-emerald-500/50"
                      : "border-slate-700 bg-slate-950 text-transparent group-hover:border-slate-500"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notes Field */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 space-y-2">
        <label className="text-xs font-semibold text-slate-300">Catatan Tambahan (Opsional)</label>
        <textarea
          rows={2}
          value={log.notes || ""}
          onChange={(e) => setLog((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Tuliskan kendala, rasanya fasting hari ini, atau mood latihan..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 resize-none"
        />
      </div>

      {/* Save Trigger Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saveSuccess && (
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" /> Daily log tersimpan!
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Menyimpan..." : "Simpan Checklist"}</span>
        </button>
      </div>
    </div>
  );
};
