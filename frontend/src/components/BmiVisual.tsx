"use client";

import React from "react";

type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

const META: Record<BmiCategory, { label: string; color: string; scaleX: number; range: string; hint: string }> = {
  underweight: { label: "Underweight", color: "#38bdf8", scaleX: 0.82, range: "< 18.5", hint: "Tambah asupan kalori sehat & protein buat mendekati berat ideal." },
  normal:      { label: "Normal",      color: "#10b981", scaleX: 1,    range: "18.5 - 24.9", hint: "Pertahankan! Pola makan & latihanmu udah di jalur yang bener." },
  overweight:  { label: "Overweight",  color: "#f59e0b", scaleX: 1.18, range: "25 - 29.9", hint: "Fokus defisit kalori ringan & tambah gerakan harian. Gas terus!" },
  obese:       { label: "Obese",       color: "#f43f5e", scaleX: 1.38, range: ">= 30", hint: "Konsisten defisit kalori & latihan — progres kecil tetep berarti." },
};

export function calcBmi(weightKg: number, heightCm: number): { bmi: number; category: BmiCategory } {
  const h = heightCm / 100;
  const bmi = h > 0 ? weightKg / (h * h) : 0;
  const category: BmiCategory = bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : "obese";
  return { bmi: Math.round(bmi * 10) / 10, category };
}

export const BmiVisual: React.FC<{ weight: number; heightCm: number }> = ({ weight, heightCm }) => {
  const { bmi, category } = calcBmi(weight, heightCm);
  const meta = META[category];
  const pos = Math.min(100, Math.max(0, ((bmi - 14) / (40 - 14)) * 100));

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
      {/* Siluet tubuh — melebar/menyempit sesuai kategori */}
      <svg viewBox="0 0 100 200" className="w-24 h-48 shrink-0">
        <circle cx="50" cy="20" r="11" fill={meta.color} opacity={0.9} />
        <g transform={`translate(50 100) scale(${meta.scaleX} 1) translate(-50 -100)`} fill={meta.color} opacity={0.9}>
          <path d="M50 33 C36 35 31 43 31 56 L33 94 C34 106 41 111 50 111 C59 111 66 106 67 94 L69 56 C69 43 64 35 50 33 Z" />
          <path d="M31 42 C25 48 23 64 24 80 L29 80 C29 66 31 52 34 46 Z" />
          <path d="M69 42 C75 48 77 64 76 80 L71 80 C71 66 69 52 66 46 Z" />
          <path d="M39 111 L37 156 C36 170 37 181 39 190 L46 190 C47 177 47 164 46 150 L48 114 Z" />
          <path d="M61 111 L63 156 C64 170 63 181 61 190 L54 190 C53 177 53 164 54 150 L52 114 Z" />
        </g>
      </svg>

      <div className="flex-1 space-y-3 w-full">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: meta.color }}>Kondisi Tubuh</span>
            <h3 className="text-2xl font-bold text-slate-100">{meta.label}</h3>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black" style={{ color: meta.color }}>{bmi}</p>
            <p className="text-[10px] text-slate-500 font-mono">BMI (kg/m²) • {meta.range}</p>
          </div>
        </div>

        {/* Gauge warna */}
        <div className="relative h-3 rounded-full overflow-hidden flex">
          <div className="h-full bg-sky-500" style={{ width: "17.3%" }} />
          <div className="h-full bg-emerald-500" style={{ width: "25%" }} />
          <div className="h-full bg-amber-500" style={{ width: "19.2%" }} />
          <div className="h-full bg-rose-500" style={{ width: "38.5%" }} />
          <div className="absolute top-0 h-full w-1.5 bg-white rounded-full shadow" style={{ left: `calc(${pos}% - 3px)` }} />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500">
          <span>14</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">{meta.hint}</p>
      </div>
    </div>
  );
};