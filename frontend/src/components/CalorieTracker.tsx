"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FoodItemData, MealLogData } from "@/types";
import { Flame, Search, Plus, Trash2, Coffee, Sun, Moon, Cookie } from "lucide-react";

const MEALS = [
  { id: "breakfast", label: "Sarapan", icon: Coffee },
  { id: "lunch", label: "Siang", icon: Sun },
  { id: "dinner", label: "Malam", icon: Moon },
  { id: "snack", label: "Camilan", icon: Cookie },
];

export const CalorieTracker: React.FC<{ userId: number }> = ({ userId }) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItemData[]>([]);
  const [meals, setMeals] = useState<MealLogData[]>([]);
  const [mealType, setMealType] = useState("breakfast");
  const [target, setTarget] = useState(2000);

  const refresh = async () => {
    const data = await api.getMeals(userId, date);
    setMeals(data);
  };

  useEffect(() => { refresh(); }, [userId, date]);

  useEffect(() => {
    api.getSettings(userId).then((s) => setTarget((s as { calorieTarget?: number }).calorieTarget ?? 2000)).catch(() => {});
  }, [userId]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) api.searchFoods(query).then(setResults).catch(() => {});
      else setResults([]);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const addFood = async (food: FoodItemData) => {
    await api.logMeal(userId, {
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

  const totals = meals.reduce(
    (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const pct = Math.min(100, (totals.calories / target) * 100);

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-orange-400 uppercase tracking-wider">Tracker Kalori</span>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" /> Makanan Hari Ini</h3>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none" />
      </div>

      {/* Progress kalori */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-400">{Math.round(totals.calories)} / {target} kcal</span>
          <span className="text-orange-400 font-mono">P {Math.round(totals.protein)}g • C {Math.round(totals.carbs)}g • F {Math.round(totals.fat)}g</span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div className={`h-full rounded-full transition-all duration-300 ${totals.calories > target ? "bg-gradient-to-r from-rose-500 to-orange-500" : "bg-gradient-to-r from-orange-500 to-amber-400"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Pilih waktu makan */}
      <div className="flex gap-2 flex-wrap">
        {MEALS.map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.id} onClick={() => setMealType(m.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${mealType === m.id ? "bg-orange-500 text-slate-950 border-orange-400" : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600"}`}>
              <Icon className="w-3.5 h-3.5" /> {m.label}
            </button>
          );
        })}
      </div>

      {/* Search makanan */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-2xl border border-slate-800 focus-within:border-orange-500 transition-colors">
          <Search className="w-4 h-4 text-orange-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari makanan Indonesia... (nasi goreng, sate, rawon)" className="bg-transparent text-xs text-slate-100 focus:outline-none w-full" />
        </div>
        {results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto">
            {results.map((f) => (
              <button key={f.id} onClick={() => addFood(f)} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-800 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-slate-100">{f.name}</p>
                  <p className="text-[10px] text-slate-500">{f.serving}</p>
                </div>
                <span className="text-xs font-mono text-orange-400 flex items-center gap-1">{f.calories} kcal <Plus className="w-3 h-3" /></span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Log makanan hari ini */}
      {meals.length > 0 && (
        <div className="space-y-2 pt-1">
          {meals.map((m) => {
            const meal = MEALS.find((x) => x.id === m.mealType);
            return (
              <div key={m.id} className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">{meal?.label ?? m.mealType}</span>
                  <p className="text-xs font-semibold text-slate-200">{m.foodName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-orange-400">{m.calories} kcal</span>
                  <button onClick={() => removeMeal(m.id!)} className="text-slate-600 hover:text-rose-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};