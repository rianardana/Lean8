"use client";

import React, { useState, useEffect } from "react";
import { UserSettingsData } from "@/types";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { calcCaloriePlan, ageFromBirthdate, ActivityLevel, Goal } from "@/lib/tdde";
import { Save, CheckCircle2, User, Target, Dumbbell, Moon, Utensils, Ruler, Scale, TrendingDown, TrendingUp, Calendar, Activity } from "lucide-react";

interface SettingsViewProps {
  onSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSaved }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [settings, setSettings] = useState<UserSettingsData>({
    name: "Lean Mode User", heightCm: 175, currentWeight: 86, targetWeight: 65,
    sex: "male", birthdate: "", activityLevel: "moderate",
    workoutTime: "07:00", sleepTime: "22:00", proteinTargetGrams: 120, goal: "cut",
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getSettings().then((data) => {
      if (isMounted) { setSettings(data); setLoading(false); }
    });
    return () => { isMounted = false; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: UserSettingsData = { ...settings, birthdate: settings.birthdate || null };
      if (plan.target > 0) payload.calorieTarget = plan.target;
      const updated = await api.saveSettings(payload);
      setSettings(updated); setSuccessMsg(true);
      if (onSaved) onSaved();
      setTimeout(() => setSuccessMsg(false), 3000);
    } finally { setSaving(false); }
  };

  const plan = calcCaloriePlan({
    sex: (settings.sex as "male" | "female") ?? "male",
    weightKg: settings.currentWeight,
    heightCm: settings.heightCm,
    age: ageFromBirthdate(settings.birthdate),
    activity: (settings.activityLevel as ActivityLevel) ?? "moderate",
    goal: (settings.goal ?? "cut") as Goal,
  });

  if (loading) return <div className="text-center py-12 text-slate-500 text-sm animate-pulse">Memuat pengaturan...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Preferences</span>
          <h2 className="text-2xl font-bold text-slate-900">Pengaturan Personal</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">Mode Goal</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, goal: "cut" })}
                className={`flex flex-col items-start gap-0.5 px-4 py-3 rounded-2xl border text-left transition-all ${settings.goal === "cut" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >
                <span className="text-xs font-bold flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> Cutting</span>
                <span className="text-[10px]">Turun berat / lean</span>
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, goal: "bulk" })}
                className={`flex flex-col items-start gap-0.5 px-4 py-3 rounded-2xl border text-left transition-all ${settings.goal === "bulk" ? "bg-amber-500/10 border-amber-500/40 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >
                <span className="text-xs font-bold flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Bulking</span>
                <span className="text-[10px]">Naik berat / otot</span>
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">Data Tubuh (buat hitung kalori)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, sex: "male" })}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition ${settings.sex === "male" ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >Laki-laki</button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, sex: "female" })}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition ${settings.sex === "female" ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >Perempuan</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Tanggal Lahir</label>
                <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <input type="date" value={settings.birthdate ?? ""} onChange={(e) => setSettings({ ...settings, birthdate: e.target.value })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full cursor-pointer" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Tingkat Aktivitas</label>
                <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <select value={settings.activityLevel ?? "moderate"} onChange={(e) => setSettings({ ...settings, activityLevel: e.target.value })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full cursor-pointer">
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Lightly active</option>
                    <option value="moderate">Moderately active</option>
                    <option value="active">Very active</option>
                    <option value="very">Ekstra aktif</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div>
                <p className="text-[10px] font-semibold text-slate-400">BMR</p>
                <p className="text-lg font-black text-slate-900 font-mono">{plan.bmr || "—"}</p>
                <p className="text-[9px] text-slate-400 font-mono">kcal/hari</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400">TDEE</p>
                <p className="text-lg font-black text-slate-900 font-mono">{plan.tdee || "—"}</p>
                <p className="text-[9px] text-slate-400 font-mono">kcal/hari</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-emerald-600">Target Kalori</p>
                <p className="text-lg font-black text-emerald-600 font-mono">{plan.target || "—"}</p>
                <p className="text-[9px] text-slate-400 font-mono">kcal/hari</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400">Batas Aman</p>
                <p className="text-lg font-black text-slate-900 font-mono">{plan.floor || "—"}</p>
                <p className="text-[9px] text-slate-400 font-mono">kcal/hari</p>
              </div>
            </div>
            {plan.target === 0 && <p className="text-[11px] text-amber-600">Isi tanggal lahir buat lihat hitungan BMR/TDEE.</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Nama</label>
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
              <User className="w-4 h-4 text-emerald-600" />
              <input type="text" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Berat Badan (kg)</label>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
                <Scale className="w-4 h-4 text-emerald-600" />
                <input type="number" step="0.5" value={settings.currentWeight} onChange={(e) => setSettings({ ...settings, currentWeight: parseFloat(e.target.value) || 0 })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Tinggi Badan (cm)</label>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
                <Ruler className="w-4 h-4 text-emerald-600" />
                <input type="number" value={settings.heightCm} onChange={(e) => setSettings({ ...settings, heightCm: parseFloat(e.target.value) || 0 })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Target Berat (kg)</label>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
                <Target className="w-4 h-4 text-emerald-600" />
                <input type="number" step="0.5" value={settings.targetWeight} onChange={(e) => setSettings({ ...settings, targetWeight: parseFloat(e.target.value) || 0 })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full" required />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Jam Latihan</label>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
                <Dumbbell className="w-4 h-4 text-emerald-600" />
                <input type="time" value={settings.workoutTime || "07:00"} onChange={(e) => setSettings({ ...settings, workoutTime: e.target.value })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full cursor-pointer" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Jam Tidur</label>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
                <Moon className="w-4 h-4 text-emerald-600" />
                <input type="time" value={settings.sleepTime || "22:00"} onChange={(e) => setSettings({ ...settings, sleepTime: e.target.value })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full cursor-pointer" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Target Protein (g)</label>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
                <Utensils className="w-4 h-4 text-emerald-600" />
                <input type="number" value={settings.proteinTargetGrams} onChange={(e) => setSettings({ ...settings, proteinTargetGrams: parseInt(e.target.value) || 0 })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {successMsg ? (<span className="text-xs font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Pengaturan berhasil disimpan!</span>) : <span />}
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50">
              <Save className="w-4 h-4" /><span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Ganti Password */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Keamanan</span>
          <h2 className="text-2xl font-bold text-slate-900">Ganti Password</h2>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setChangingPw(true);
            setPwMsg(null);
            const { error } = await authClient.changePassword({ currentPassword, newPassword });
            if (error) {
              setPwMsg({ ok: false, text: error.message ?? "Gagal mengganti password" });
            } else {
              setPwMsg({ ok: true, text: "Password berhasil diganti!" });
              setCurrentPassword("");
              setNewPassword("");
            }
            setChangingPw(false);
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password Saat Ini</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password Baru</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500" />
          </div>
          {pwMsg && <p className={`text-xs ${pwMsg.ok ? "text-emerald-600" : "text-rose-600"}`}>{pwMsg.text}</p>}
          <button type="submit" disabled={changingPw} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50">
            {changingPw ? "Menyimpan..." : "Ganti Password"}
          </button>
        </form>
      </div>
    </div>
  );
};