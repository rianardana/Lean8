"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { buildMealPrep, PROTEIN_SOURCES, type ProteinSource } from "@/lib/mealprep";
import { ChefHat, Sparkles, Search, X } from "lucide-react";

const fmtG = (g: number) => (g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${g} g`);
const fmtPortion = (g: number, s: ProteinSource) => (s.unit && s.gramsPerUnit ? `${Math.round(g / s.gramsPerUnit)} ${s.unit}` : fmtG(g));
const WEEKDAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

interface Recipe { name: string; ingredients: string[]; steps: string }

export const MealPrepView: React.FC = () => {
  const [target, setTarget] = useState({ protein: 120, kcal: 2000, goal: "cut" });
  const [selected, setSelected] = useState<ProteinSource[]>([PROTEIN_SOURCES[0]]);
  const [days, setDays] = useState(7);
  const [meals, setMeals] = useState(3);
  const [customQuery, setCustomQuery] = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [variLoading, setVariLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.getSettings()
      .then((s) => {
        if (!mounted) return;
        setTarget({ protein: s.proteinTargetGrams ?? 120, kcal: s.calorieTarget ?? 2000, goal: s.goal ?? "cut" });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const plan = buildMealPrep({ proteinTarget: target.protein, calorieTarget: target.kcal, mealsPerDay: meals, days, sources: selected });

  const toggleSource = (s: ProteinSource) => {
    setSelected((prev) => (prev.some((x) => x.id === s.id) ? (prev.length > 1 ? prev.filter((x) => x.id !== s.id) : prev) : [...prev, s]));
    setRecipes(null);
  };

  const removeCustom = (s: ProteinSource) => {
    setSelected((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== s.id) : prev));
    setRecipes(null);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = customQuery.trim();
    if (!q || resolveLoading) return;
    setResolveLoading(true);
    try {
      const r = await api.resolveFoodMacros(q);
      setSelected((prev) => [...prev, { id: `custom-${q}-${Date.now()}`, name: r.name, protein: r.protein, kcal: r.kcal, carbs: r.carbs, fat: r.fat }]);
      setCustomQuery("");
      setRecipes(null);
    } catch { /* biar gak macet */ }
    setResolveLoading(false);
  };

  const handleVary = async () => {
    setVariLoading(true);
    try {
      const names = plan.rotation.map((d) => d.source.name);
      const r = await api.getMealVariations(names, target.goal);
      setRecipes(r.days ?? []);
    } catch {
      setRecipes(null);
    }
    setVariLoading(false);
  };

  const customSources = selected.filter((s) => !PROTEIN_SOURCES.some((p) => p.id === s.id));

  return (
    <div className="space-y-4">
      {/* Pengaturan */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono text-orange-600 uppercase tracking-wider">Meal Prep</span>
            <h3 className="text-lg font-bold text-slate-900">Siapkan Minggu Ini</h3>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-500">
          Target lo: <span className="font-mono text-slate-900">{target.protein}g protein</span> ·{" "}
          <span className="font-mono text-slate-900">{target.kcal} kcal</span> ·{" "}
          <span className="text-slate-900">{target.goal === "bulk" ? "bulk" : "cut"}</span>
        </p>

        <div>
          <p className="text-[11px] text-slate-400 font-mono mb-1.5">Bahan utama — pilih lebih dari 1 buat rotasi</p>
          <div className="flex gap-2 flex-wrap">
            {PROTEIN_SOURCES.map((s) => {
              const isOn = selected.some((x) => x.id === s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSource(s)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    isOn ? "bg-orange-500 text-slate-950 border-orange-400" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}

            {customSources.map((s) => (
              <button
                key={s.id}
                onClick={() => removeCustom(s)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-orange-500 text-slate-950 border border-orange-400"
              >
                {s.name} <X className="w-3 h-3" />
              </button>
            ))}

            <form onSubmit={handleResolve} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 focus-within:border-orange-500 transition-colors">
              <input
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="ketik bahan lain…"
                className="bg-transparent text-xs text-slate-900 focus:outline-none w-36"
              />
              {resolveLoading ? (
                <span className="inline-flex gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              ) : (
                <button type="submit" className="text-orange-600 shrink-0"><Search className="w-3.5 h-3.5" /></button>
              )}
            </form>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[11px] text-slate-400 font-mono">Hari:</span>
          {[5, 7].map((d) => (
            <button
              key={d}
              onClick={() => { setDays(d); setRecipes(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                days === d ? "bg-emerald-500 text-white border-emerald-400" : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {d} hari
            </button>
          ))}
          <span className="text-[11px] text-slate-400 font-mono ml-2">Makan/hari:</span>
          {[2, 3].map((m) => (
            <button
              key={m}
              onClick={() => setMeals(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                meals === m ? "bg-emerald-500 text-white border-emerald-400" : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {m}x
            </button>
          ))}
        </div>
      </div>

      {/* Hasil */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
        <h4 className="text-xs font-semibold text-slate-500">Hasil — {days} hari · {meals}x makan/hari</h4>

        <div className="space-y-1.5">
          {plan.rotation.map((d, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-slate-400 w-10">{WEEKDAYS[i] ?? `H${i + 1}`}</span>
                <span className="text-xs font-semibold text-slate-800">{d.source.name}</span>
              </div>
              <span className="text-xs font-mono text-orange-600">{fmtPortion(d.sourceGramsPerMeal, d.source)}/makan + {d.riceGramsPerMeal}g nasi</span>
            </div>
          ))}
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
          <p className="text-xs font-semibold text-emerald-700">Setiap hari nutup target: {plan.target.protein}g protein · ±{plan.target.kcal} kcal</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 space-y-1.5">
          <p className="text-[10px] font-mono text-slate-400 uppercase">Masak total</p>
          {Object.entries(plan.weekly.sourceGrams).map(([id, g]) => {
            const src = selected.find((s) => s.id === id)!;
            return (
              <p key={id} className="text-sm font-bold text-white">
                {fmtPortion(g, src)} {src.name}
              </p>
            );
          })}
          <p className="text-xs text-slate-300">+ {fmtG(plan.weekly.riceGrams)} nasi</p>
        </div>
      </div>

      {/* Resep AI */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-mono text-orange-600 uppercase tracking-wider">Resep Singkat</span>
        </div>

        {!recipes ? (
          <button
            onClick={handleVary}
            disabled={variLoading}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-orange-400 to-amber-400 text-slate-950 shadow-md shadow-orange-500/20 hover:opacity-95 active:scale-95 transition disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${variLoading ? "animate-spin" : ""}`} />
            {variLoading ? "Menyiapkan..." : "Bosan? Buat Resep"}
          </button>
        ) : (
          <div className="space-y-2">
            {recipes.map((r, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{r.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{WEEKDAYS[i] ?? `H${i + 1}`}</span>
                </div>
                <p className="text-[11px] text-slate-500">Bahan: {r.ingredients.join(", ")}</p>
                <p className="text-[11px] text-slate-500">Cara: {r.steps}</p>
              </div>
            ))}
            <button onClick={() => setRecipes(null)} className="w-full text-[11px] text-slate-400 hover:text-orange-600 transition pt-1">
              Acak lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
