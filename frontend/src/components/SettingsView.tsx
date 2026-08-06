"use client";

import React, { useState, useEffect } from "react";
import { UserSettingsData } from "@/types";
import { api } from "@/lib/api";
import { Save, CheckCircle2, User, Target, Dumbbell, Moon, Utensils, Ruler } from "lucide-react";

interface SettingsViewProps {
  onSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSaved }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const [settings, setSettings] = useState<UserSettingsData>({
    name: "Lean8 User",
    heightCm: 175,
    currentWeight: 86,
    targetWeight: 65,
    workoutTime: "07:00",
    sleepTime: "22:00",
    proteinTargetGrams: 120,
  });

  useEffect(() => {
    let isMounted = true;
    api.getSettings().then((data) => {
      if (isMounted) {
        setSettings(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.saveSettings(settings);
      setSettings(updated);
      setSuccessMsg(true);
      if (onSaved) onSaved();
      setTimeout(() => setSuccessMsg(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-sm animate-pulse">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Preferences</span>
          <h2 className="text-2xl font-bold text-slate-100">Pengaturan Personal</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* User Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Nama</label>
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-2xl border border-slate-800 focus-within:border-emerald-500 transition-colors">
              <User className="w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="bg-transparent text-xs text-slate-100 focus:outline-none w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Height */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Tinggi Badan (cm)</label>
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-2xl border border-slate-800 focus-within:border-emerald-500 transition-colors">
                <Ruler className="w-4 h-4 text-emerald-400" />
                <input
                  type="number"
                  value={settings.heightCm}
                  onChange={(e) => setSettings({ ...settings, heightCm: parseFloat(e.target.value) || 0 })}
                  className="bg-transparent text-xs text-slate-100 focus:outline-none w-full"
                  required
                />
              </div>
            </div>

            {/* Target Weight */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Berat (kg)</label>
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-2xl border border-slate-800 focus-within:border-emerald-500 transition-colors">
                <Target className="w-4 h-4 text-emerald-400" />
                <input
                  type="number"
                  step="0.5"
                  value={settings.targetWeight}
                  onChange={(e) => setSettings({ ...settings, targetWeight: parseFloat(e.target.value) || 0 })}
                  className="bg-transparent text-xs text-slate-100 focus:outline-none w-full"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Workout Time */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Jam Latihan</label>
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-2xl border border-slate-800 focus-within:border-emerald-500 transition-colors">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <input
                  type="time"
                  value={settings.workoutTime || "07:00"}
                  onChange={(e) => setSettings({ ...settings, workoutTime: e.target.value })}
                  className="bg-transparent text-xs text-slate-100 focus:outline-none w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Sleep Time */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Jam Tidur</label>
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-2xl border border-slate-800 focus-within:border-emerald-500 transition-colors">
                <Moon className="w-4 h-4 text-emerald-400" />
                <input
                  type="time"
                  value={settings.sleepTime || "22:00"}
                  onChange={(e) => setSettings({ ...settings, sleepTime: e.target.value })}
                  className="bg-transparent text-xs text-slate-100 focus:outline-none w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Protein Target */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Protein (g)</label>
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-2xl border border-slate-800 focus-within:border-emerald-500 transition-colors">
                <Utensils className="w-4 h-4 text-emerald-400" />
                <input
                  type="number"
                  value={settings.proteinTargetGrams}
                  onChange={(e) => setSettings({ ...settings, proteinTargetGrams: parseInt(e.target.value) || 0 })}
                  className="bg-transparent text-xs text-slate-100 focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {successMsg ? (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Pengaturan berhasil disimpan!
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
