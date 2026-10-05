"use client";

import React from "react";

type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

const META: Record<BmiCategory, { label: string; color: string; scaleX: number; range: string; hint: string }> = {
  underweight: { label: "Underweight", color: "#38bdf8", scaleX: 0.8,  range: "< 18.5", hint: "Tambah asupan kalori sehat & protein buat mendekati berat ideal." },
  normal:      { label: "Normal",      color: "#10b981", scaleX: 1,    range: "18.5 - 24.9", hint: "Pertahankan! Pola makan & latihanmu udah di jalur yang bener." },
  overweight:  { label: "Overweight",  color: "#f59e0b", scaleX: 1.28, range: "25 - 29.9", hint: "Fokus defisit kalori ringan & tambah gerakan harian. Gas terus!" },
  obese:       { label: "Obese",       color: "#f43f5e", scaleX: 1.5,  range: ">= 30", hint: "Konsisten defisit kalori & latihan — progres kecil tetep berarti." },
};

// Batas zona BMI pada skala 14–40 (persen)
const ZONES = [
  { stop: 17.3, color: "#38bdf8", label: "Kurus" },
  { stop: 42.3, color: "#10b981", label: "Normal" },
  { stop: 61.5, color: "#f59e0b", label: "Berlebih" },
  { stop: 100, color: "#f43f5e", label: "Obesitas" },
];

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

  const stops = ZONES.map((z, i) => {
    const from = i === 0 ? 0 : ZONES[i - 1].stop;
    return `${z.color} ${from}%, ${z.color} ${z.stop}%`;
  }).join(", ");

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-lg shadow-slate-900/[0.03]">
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-[0.07] pointer-events-none" style={{ background: meta.color }} />

      <div className="relative flex flex-col sm:flex-row items-center gap-7">
        {/* Siluet tubuh */}
        <div className="relative shrink-0">
          <div className="absolute inset-x-0 bottom-2 h-14 rounded-full blur-2xl opacity-20" style={{ background: meta.color }} />
          <svg viewBox="0 0 100 200" className="relative h-44 sm:h-48 w-auto drop-shadow-sm">
            <defs>
              <linearGradient id="bmiBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.color} stopOpacity="0.95" />
                <stop offset="100%" stopColor={meta.color} stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <g fill="url(#bmiBody)">
              {/* kepala */}
              <circle cx="50" cy="20" r="12.5" />
              {/* badan + lengan + kaki (lebar menyesuaikan kategori) */}
              <g transform={`translate(50 100) scale(${meta.scaleX} 1) translate(-50 -100)`}>
                {/* torso — bahu lebar, pinggang ramping, pinggul */}
                <path d="M50 36 C42 36 33 43 33 52 L35 84 C35 92 41 97 50 97 C59 97 65 92 65 84 L67 52 C67 43 58 36 50 36 Z" />
                {/* lengan */}
                <path d="M34 46 C27 50 25 62 26 76 L33 76 C32 64 33 54 39 49 Z" />
                <path d="M66 46 C73 50 75 62 74 76 L67 76 C68 64 67 54 61 49 Z" />
                {/* kaki */}
                <path d="M41 95 C41 112 42 130 44 150 L47 168 C47 171 50 171 50 168 L49 150 L48 99 Z" />
                <path d="M59 95 C59 112 58 130 56 150 L53 168 C53 171 50 171 50 168 L51 150 L52 99 Z" />
              </g>
            </g>
          </svg>
        </div>

        {/* Info */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Kondisi Tubuh</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border" style={{ background: `${meta.color}15`, color: meta.color, borderColor: `${meta.color}35` }}>
              {meta.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight" style={{ color: meta.color }}>{bmi}</span>
            <span className="text-sm font-medium text-slate-400">kg/m²</span>
            <span className="ml-auto text-[11px] font-mono text-slate-400">{meta.range}</span>
          </div>

          {/* Gauge BMI */}
          <div className="space-y-2">
            <div className="relative h-2.5 rounded-full" style={{ background: `linear-gradient(to right, ${stops})` }}>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-[3px] shadow-md"
                style={{ left: `calc(${pos}% - 8px)`, borderColor: meta.color }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>14</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
            </div>
            <div className="flex justify-between text-[9px] font-medium text-slate-400">
              {ZONES.map((z) => <span key={z.label} style={{ color: z.color }}>{z.label}</span>)}
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">{meta.hint}</p>
        </div>
      </div>
    </div>
  );
};
