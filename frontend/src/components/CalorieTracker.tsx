"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { wibDate } from "@/lib/time";
import { resizeImage } from "@/lib/image";
import { FoodItemData, MealLogData, WorkoutLogData } from "@/types";
import { Flame, Search, Plus, Trash2, Sparkles } from "lucide-react";

const MEALS = [
  { id: "breakfast", label: "Sarapan" },
  { id: "lunch", label: "Siang" },
  { id: "dinner", label: "Malam" },
  { id: "snack", label: "Camilan" },
];

const MAX_PHOTO_PER_DAY = 100;

export const CalorieTracker: React.FC = () => {
  const todayStr = wibDate();
  const [date, setDate] = useState(todayStr);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItemData[]>([]);
  const [meals, setMeals] = useState<MealLogData[]>([]);
  const [mealType, setMealType] = useState("breakfast");
  const [target, setTarget] = useState(2000);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogData[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const data = await api.getMeals(date);
      if (isMounted) setMeals(data);
    })();
    return () => { isMounted = false; };
  }, [date]);

  useEffect(() => {
    let isMounted = true;
    api.getWorkouts(date).then((logs) => {
      if (isMounted) setWorkoutLogs(logs);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [date]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const s = await api.getSettings();
        if (isMounted) setTarget((s as { calorieTarget?: number }).calorieTarget ?? 2000);
      } catch { /* ignore */ }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setAiLoading(true);
        try {
          const r = await api.estimateFood(query);
          setResults([{
            id: -1,
            name: `${r.name}${r.quantity > 1 ? ` ×${r.quantity}` : ''}`,
            serving: `${r.perServing} kcal/porsi • AI estimate`,
            calories: r.calories,
            protein: r.protein,
            carbs: r.carbs,
            fat: r.fat,
          }]);
        } catch {
          setResults([]);
        }
        setAiLoading(false);
      } else {
        setResults([]);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [query]);

  const refresh = async () => {
    const data = await api.getMeals(date);
    setMeals(data);
  };

  const addFood = async (food: FoodItemData) => {
    await api.logMeal({
      date, mealType, foodName: food.name, quantity: 1,
      calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat,
    });
    setQuery(""); setResults([]);
    await refresh();
  };

  const removeMeal = async (id: number) => {
    await api.deleteMeal(id);
    await refresh();
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true); setPhotoMsg("");
    try {
      const base64 = await resizeImage(file, 1024, "image/jpeg", 0.8);
      const r = await api.analyzeFoodPhoto(base64);
      await api.logMeal({
        date, mealType, foodName: `📸 ${r.name}`, quantity: 1,
        calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
      });
      await refresh();
    } catch (err) {
      const msg = String(err);
      setPhotoMsg(msg.includes("429") ? `Limit foto hari ini habis (${MAX_PHOTO_PER_DAY}/${MAX_PHOTO_PER_DAY}). Input manual dulu ya!` : "Analisis gagal — coba input manual.");
    }
    setPhotoLoading(false);
    e.target.value = "";
  };

  const totals = meals.reduce(
    (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const pct = Math.min(100, (totals.calories / target) * 100);
  const workoutKcal = workoutLogs.reduce((s, l) => s + l.kcal, 0);

  const removeWorkout = async (id: number) => {
    await api.deleteWorkout(id);
    const logs = await api.getWorkouts(date);
    setWorkoutLogs(logs);
  };

  const photoUsed = meals.filter((m) => m.foodName.startsWith("📸")).length;
  const photoLeft = Math.max(0, MAX_PHOTO_PER_DAY - photoUsed);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-orange-600 uppercase tracking-wider">Tracker Kalori</span>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-600" /> Makanan Hari Ini</h3>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none" />
      </div>

      {/* IN vs OUT */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-semibold text-orange-600">Masuk</p>
          <p className="text-lg font-black text-slate-900">{Math.round(totals.calories)}</p>
          <p className="text-[9px] text-slate-400 font-mono">kcal</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-semibold text-emerald-600">Keluar</p>
          <p className="text-lg font-black text-slate-900">{workoutKcal}</p>
          <p className="text-[9px] text-slate-400 font-mono">kcal</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-semibold text-slate-500">Net</p>
          <p className="text-lg font-black text-slate-900">{Math.round(totals.calories - workoutKcal)}</p>
          <p className="text-[9px] text-slate-400 font-mono">kcal</p>
        </div>
      </div>

      {/* Detail kalori keluar */}
      {workoutLogs.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-500">Detail Kalori Keluar</p>
          <div className="space-y-1.5">
            {workoutLogs.map((l) => (
              <div key={l.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{l.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{l.minutes} menit</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 font-mono">-{l.kcal} kcal</span>
                  <button onClick={() => l.id && removeWorkout(l.id)} className="text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress vs target */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-500">Target: {target} kcal</span>
          <span className="text-orange-600 font-mono">P {Math.round(totals.protein)}g • C {Math.round(totals.carbs)}g • F {Math.round(totals.fat)}g</span>
        </div>
        <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div className={`h-full rounded-full transition-all duration-300 ${totals.calories > target ? "bg-gradient-to-r from-rose-500 to-orange-500" : "bg-gradient-to-r from-orange-500 to-amber-400"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Pilih waktu makan */}
      <div className="flex gap-2 flex-wrap">
        {MEALS.map((m) => (
          <button key={m.id} onClick={() => setMealType(m.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition ${mealType === m.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Search makanan — AI POWERED */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-orange-500 transition-colors">
          <Search className="w-4 h-4 text-orange-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik apa aja... (donat cokelat 3, mie goreng jumbo, hamburger)"
            className="bg-transparent text-xs text-slate-900 focus:outline-none w-full"
          />
          {aiLoading && (
            <span className="inline-flex gap-1 shrink-0">
              <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          )}
        </div>
        {results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto">
            {results.map((f) => (
              <button key={f.id} onClick={() => addFood(f)} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-100 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    {f.name}
                    <Sparkles className="w-3 h-3 text-orange-600" />
                  </p>
                  <p className="text-[10px] text-slate-500">{f.serving}</p>
                </div>
                <span className="text-xs font-mono text-orange-600 flex items-center gap-1">{f.calories} kcal <Plus className="w-3 h-3" /></span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TOMBOL FOTO MAKANAN — Kamera / Gallery */}
      <div className="flex flex-col items-center justify-center gap-3 pt-1">
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <label className={`relative rounded-2xl overflow-hidden border-2 transition ${
            photoLeft === 0
              ? "border-slate-200 opacity-60 cursor-not-allowed"
              : "border-orange-500/30 cursor-pointer hover:border-orange-500 active:scale-95"
          }`}>
            <img src="/camera.webp" alt="Camera" className="w-full h-36 object-contain" />
            <span className="block text-center text-xs font-semibold text-slate-700 py-1.5">Camera</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} disabled={photoLoading || photoLeft === 0} />
          </label>

          <label className={`relative rounded-2xl overflow-hidden border-2 transition ${
            photoLeft === 0
              ? "border-slate-200 opacity-60 cursor-not-allowed"
              : "border-orange-500/30 cursor-pointer hover:border-orange-500 active:scale-95"
          }`}>
            <img src="/galery.webp" alt="Gallery" className="w-full h-36 object-contain" />
            <span className="block text-center text-xs font-semibold text-slate-700 py-1.5">Gallery</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={photoLoading || photoLeft === 0} />
          </label>
        </div>

        {photoMsg && <span className="text-[11px] text-rose-600 text-center">{photoMsg}</span>}
      </div>

      {/* Log makanan hari ini */}
      {meals.length > 0 && (
        <div className="space-y-2 pt-1">
          {meals.map((m) => {
            const meal = MEALS.find((x) => x.id === m.mealType);
            return (
              <div key={m.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">{meal?.label ?? m.mealType}</span>
                  <p className="text-xs font-semibold text-slate-800">{m.foodName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-orange-600">{m.calories} kcal</span>
                  <button onClick={() => removeMeal(m.id!)} className="text-slate-500 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};