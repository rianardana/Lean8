"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { firebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type Step = {
  key: string;
  title: string;
  type: "text" | "date" | "number" | "time" | "select" | "radio";
  placeholder?: string;
  options?: { value: string; label: string }[];
};

const steps: Step[] = [
  { key: "name", title: "Hai! Aku Coach AI. Nama panggilanmu siapa?", type: "text", placeholder: "Nama kamu" },
  { key: "sex", title: "Oke! Jenis kelaminmu apa?", type: "radio", options: [{ value: "male", label: "Laki-laki" }, { value: "female", label: "Perempuan" }] },
  { key: "birthdate", title: "Kapan tanggal lahirmu?", type: "date" },
  { key: "heightCm", title: "Tinggi badanmu berapa cm?", type: "number", placeholder: "175" },
  { key: "currentWeight", title: "Berat badanmu sekarang berapa kg?", type: "number", placeholder: "70" },
  { key: "targetWeight", title: "Target berat badan yang ingin dicapai?", type: "number", placeholder: "65" },
  { key: "goal", title: "Tujuan utamamu?", type: "radio", options: [{ value: "cut", label: "Cut (turun lemak)" }, { value: "bulk", label: "Bulk (naik massa)" }] },
  { key: "activityLevel", title: "Aktivitas harianmu seberapa aktif?", type: "radio", options: [{ value: "sedentary", label: "Sedentary" }, { value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "active", label: "Active" }, { value: "very", label: "Very Active" }] },
  { key: "workoutTime", title: "Jam berapa biasanya kamu latihan?", type: "time" },
  { key: "sleepTime", title: "Jam berapa biasanya kamu tidur?", type: "time" },
  { key: "proteinTargetGrams", title: "Target protein harianmu berapa gram?", type: "number", placeholder: "120" },
  { key: "workoutFrequency", title: "Berapa kali latihan per minggu?", type: "number", placeholder: "3" },
  { key: "fitnessExperience", title: "Pengalaman fitnessmu sejauh ini?", type: "radio", options: [{ value: "beginner", label: "Pemula" }, { value: "intermediate", label: "Menengah" }, { value: "advanced", label: "Lanjutan" }] },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({
    name: "",
    sex: "male",
    birthdate: "",
    heightCm: "",
    currentWeight: "",
    targetWeight: "",
    goal: "cut",
    activityLevel: "moderate",
    workoutTime: "07:00",
    sleepTime: "22:00",
    proteinTargetGrams: "120",
    workoutFrequency: "3",
    fitnessExperience: "beginner",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      if (!u) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  const current = steps[step];
  const value = form[current.key];

  const setValue = (v: string) => setForm((f) => ({ ...f, [current.key]: v }));

  const canNext = () => {
    if (current.type === "text" || current.type === "date" || current.type === "number" || current.type === "time") {
      return value.trim() !== "";
    }
    return true;
  };

  const next = () => {
    if (!canNext()) { setError("Isi dulu jawabannya."); return; }
    setError("");
    if (step < steps.length - 1) setStep((s) => s + 1);
    else submit();
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const h = parseFloat(form.heightCm);
      const w = parseFloat(form.currentWeight);
      const tw = parseFloat(form.targetWeight);
      await api.saveSettings({
        name: form.name,
        sex: form.sex,
        birthdate: form.birthdate,
        heightCm: h > 0 ? h : 175,
        currentWeight: w > 0 ? w : 70,
        targetWeight: tw > 0 ? tw : 65,
        goal: form.goal as "cut" | "bulk",
        activityLevel: form.activityLevel,
        workoutTime: form.workoutTime,
        sleepTime: form.sleepTime,
        proteinTargetGrams: parseInt(form.proteinTargetGrams) || 120,
      });
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingCompleted: true,
          fitnessExperience: form.fitnessExperience,
          workoutFrequency: parseInt(form.workoutFrequency) || 3,
        }),
      });
      sessionStorage.setItem("leanmode_show_tour", "1");
      router.push("/?welcome=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-end gap-3">
          <img src="/mascot.webp" alt="Coach AI" className="w-12 h-12 rounded-full object-cover object-top shrink-0" />
          <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-sm px-4 py-3 shadow-sm">
            <p className="text-sm text-slate-700 leading-relaxed">{current.title}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <p className="text-[11px] text-slate-400">Pertanyaan {step + 1} dari {steps.length}</p>

          {current.type === "radio" ? (
            <div className="grid gap-2">
              {current.options?.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border text-sm font-medium transition ${value === opt.value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <input
              autoFocus
              type={current.type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={current.placeholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          )}

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            {step > 0 && (
              <button type="button" onClick={back} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-sm">
                Kembali
              </button>
            )}
            <button type="button" onClick={next} disabled={loading} className="flex-1 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm disabled:opacity-50">
              {loading ? "Menyimpan..." : step === steps.length - 1 ? "Selesai" : "Lanjut"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
