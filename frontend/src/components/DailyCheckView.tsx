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
    date: todayStr, workout: false, ifCompleted: false, proteinCompleted: false,
    waterCompleted: false, sleepCompleted: false, noSnack: false, notes: "",
  });
  const [goal, setGoal] = useState<"cut" | "bulk">("cut");

  useEffect(() => {
    api.getSettings().then((s) => setGoal(s.goal ?? "cut")).catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getDaily(selectedDate).then((data) => {
      if (isMounted) { setLog(data); setLoading(false); }
    });
    return () => { isMounted = false; };
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
    } catch { /* handled */ } finally { setSaving(false); }
  };

  const isBulk = goal === "bulk";

  const habits = [
    { id: "workout", title: "Workout / Movement", desc: "Latihan beban, kalistenik, atau jalan kaki 20+ menit", icon: Dumbbell, completed: log.workout, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
    { id: "ifCompleted", title: isBulk ? "Kalori Surplus" : "Intermittent Fasting", desc: isBulk ? "Makan di atas maintenance, surplus 300-500 kcal" : "Patuhi jendela fasting 16:8 atau sesuai target", icon: Clock, completed: log.ifCompleted, color: "text-teal-600 bg-teal-500/10 border-teal-500/20" },
    { id: "proteinCompleted", title: "Protein Target", desc: "Tercapai asupan protein harian untuk memelihara otot", icon: Utensils, completed: log.proteinCompleted, color: "text-cyan-600 bg-cyan-500/10 border-cyan-500/20" },
    { id: "waterCompleted", title: "Air Putih", desc: "Minum minimal 2.5 - 3 Liter air putih per hari", icon: Droplets, completed: log.waterCompleted, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
    { id: "sleepCompleted", title: "Tidur Cukup", desc: "Tidur 7-8 jam berkualitas & matikan layar tepat waktu", icon: Moon, completed: log.sleepCompleted, color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20" },
    { id: "noSnack", title: isBulk ? "Snack Tambahan" : "No Snack / Zero Junk", desc: isBulk ? "Snack sehat / tambahan kalori untuk surplus" : "Bebas snack manis/olahan di luar jadwal makan utama", icon: Ban, completed: log.noSnack, color: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
  ] as const;

  const completedCount = habits.filter((h) => h.completed).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white backdrop-blur-md border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Input Harian (&lt; 60 detik)</span>
            <h2 className="text-2xl font-bold text-slate-900">Daily Checklist</h2>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-xs font-mono text-slate-800 focus:outline-none cursor-pointer" />
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Pencapaian Habit Hari Ini</span>
            <span className="text-emerald-600 font-mono">{completedCount} dari 6 Tercentang</span>
          </div>
          <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/30" style={{ width: `${(completedCount / 6) * 100}%` }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm animate-pulse">Memuat checklist...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {habits.map((habit) => {
            const Icon = habit.icon;
            return (
              <div key={habit.id} onClick={() => toggleHabit(habit.id as keyof Omit<DailyLogData, "id" | "date" | "notes" | "completedCount">)}
                className={`group cursor-pointer select-none rounded-2xl border p-4 transition-all duration-200 flex items-start justify-between gap-3 ${habit.completed ? "bg-white border-emerald-500/40 shadow-md shadow-emerald-500/5" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border ${habit.color}`}><Icon className="w-5 h-5" /></div>
                  <div className="space-y-1">
                    <h4 className={`text-sm font-semibold transition-colors ${habit.completed ? "text-slate-900" : "text-slate-500"}`}>{habit.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{habit.desc}</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 ${habit.completed ? "bg-emerald-500 border-emerald-400 text-slate-950 scale-110 shadow-sm shadow-emerald-500/50" : "border-slate-300 bg-slate-50 text-transparent group-hover:border-slate-500"}`}>
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
        <label className="text-xs font-semibold text-slate-500">Catatan Tambahan (Opsional)</label>
        <textarea rows={2} value={log.notes || ""} onChange={(e) => setLog((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Tuliskan kendala, rasanya fasting hari ini, atau mood latihan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500 resize-none" />
      </div>

   {saveSuccess && (
        <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5" />
          Checklist tersimpan!
        </div>
      )}

      {/* Tombol Simpan */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Simpan Checklist Hari Ini
          </>
        )}
      </button>
      
    </div>
  );
};