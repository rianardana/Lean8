"use client";

import React, { useState, useEffect } from "react";
import { UserSettingsData } from "@/types";
import { api } from "@/lib/api";
import { firebaseAuth } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { calcCaloriePlan, ageFromBirthdate, ActivityLevel, Goal } from "@/lib/tdde";
import { ensurePushSubscription, pushSupported, removePushSubscription, sendTestPush } from "@/lib/push";
import { Save, CheckCircle2, User, Target, Dumbbell, Moon, Utensils, Ruler, Scale, TrendingDown, TrendingUp, Calendar, Activity, Bell, Target as TargetIcon, Smartphone } from "lucide-react";

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
    weeklyReminderEnabled: false,
  });
  const [weekly, setWeekly] = useState({ workoutSessions: 0, fastSessions: 0, fastMinHours: 16, activeDays: 0 });
  const [weeklySaving, setWeeklySaving] = useState(false);
  const [weeklyMsg, setWeeklyMsg] = useState(false);
  const [pushMsg, setPushMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([api.getSettings(), api.getWeeklyTarget()]).then(([s, w]) => {
      if (!isMounted) return;
      if (s.status === "fulfilled") setSettings(s.value);
      if (w.status === "fulfilled") {
        setWeekly({
          workoutSessions: w.value.config.workoutSessions ?? 0,
          fastSessions: w.value.config.fastSessions ?? 0,
          fastMinHours: w.value.config.fastMinHours ?? 16,
          activeDays: w.value.config.activeDays ?? 0,
        });
        setSettings((prev) => ({ ...prev, weeklyReminderEnabled: w.value.reminderEnabled }));
      }
      setLoading(false);
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

  const reminderEnabled = !!settings.weeklyReminderEnabled;

  const toggleSchedule = async (key: "fastReminderEnabled" | "workoutReminderEnabled" | "sleepReminderEnabled") => {
    const next = !settings[key];
    setScheduleBusy(key);
    setPushMsg(null);
    setSettings((s) => ({ ...s, [key]: next }));
    try {
      if (next) {
        const sub = await ensurePushSubscription();
        if (!sub.ok) {
          const text =
            sub.reason === "unsupported"
              ? "Push tidak didukung di browser/perangkat ini. Gunakan Android Chrome PWA (Add to Home Screen)."
              : sub.reason === "denied"
              ? "Izin notifikasi ditolak. Aktifkan di setelan Android/browser untuk Lean Mode."
              : sub.reason === "vapid_missing"
              ? "Server belum dikonfigurasi VAPID. Push background belum bisa."
              : "Gagal mendaftarkan push subscription. Coba lagi.";
          setPushMsg({ ok: false, text });
          setSettings((s) => ({ ...s, [key]: !next }));
          return;
        }
      }
      await api.saveSettings({ [key]: next } as unknown as UserSettingsData);
      if (next) setPushMsg({ ok: true, text: "Notifikasi jadwal aktif. Pastikan jam terkait sudah benar & PWA terpasang di Android." });
    } catch {
      setSettings((s) => ({ ...s, [key]: !next }));
      setPushMsg({ ok: false, text: "Gagal menyimpan pengaturan notifikasi." });
    } finally {
      setScheduleBusy(null);
    }
  };

  const toggleReminder = async () => {
    const next = !reminderEnabled;
    setSettings((s) => ({ ...s, weeklyReminderEnabled: next }));
    setPushMsg(null);
    try {
      if (next) {
        const sub = await ensurePushSubscription();
        if (!sub.ok) {
          const text =
            sub.reason === "unsupported"
              ? "Push tidak didukung di browser/perangkat ini. Gunakan Android Chrome PWA (Add to Home Screen)."
              : sub.reason === "denied"
              ? "Izin notifikasi ditolak. Aktifkan di setelan Android/browser untuk Lean Mode."
              : sub.reason === "vapid_missing"
              ? "Server belum dikonfigurasi VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY). Push background belum bisa."
              : "Gagal mendaftarkan push subscription. Coba lagi.";
          setPushMsg({ ok: false, text });
          // Keep reminder toggle intent saved? Prefer rollback to avoid false-active state.
          setSettings((s) => ({ ...s, weeklyReminderEnabled: !next }));
          return;
        }
      } else {
        await removePushSubscription().catch(() => {});
      }
      await api.saveWeeklyTarget({ reminderEnabled: next, ...weekly });
      if (next) setPushMsg({ ok: true, text: "Reminder & push Android aktif. Tes notifikasi untuk memastikan." });
    } catch {
      setSettings((s) => ({ ...s, weeklyReminderEnabled: !next })); // rollback
      setPushMsg({ ok: false, text: "Gagal menyimpan pengaturan reminder." });
    }
  };

  const handleTestPush = async () => {
    setPushBusy(true);
    setPushMsg(null);
    try {
      const sub = await ensurePushSubscription();
      if (!sub.ok) {
        setPushMsg({ ok: false, text: sub.reason === "vapid_missing" ? "VAPID belum dikonfigurasi di server." : "Push belum siap di perangkat ini." });
        return;
      }
      const r = await sendTestPush();
      if (r.ok) setPushMsg({ ok: true, text: "Notifikasi tes dikirim. Kalau app tertutup, cek panel notifikasi Android (getar/suara mengikuti setelan sistem/DND)." });
      else setPushMsg({ ok: false, text: r.status === 503 ? "VAPID belum dikonfigurasi di server." : "Gagal mengirim tes push." });
    } finally {
      setPushBusy(false);
    }
  };

  const saveWeekly = async () => {
    setWeeklySaving(true);
    setWeeklyMsg(false);
    try {
      await api.saveWeeklyTarget({ ...weekly, reminderEnabled });
      setWeeklyMsg(true);
      if (onSaved) onSaved();
      setTimeout(() => setWeeklyMsg(false), 3000);
    } finally {
      setWeeklySaving(false);
    }
  };

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

      {/* Target Minggu Ini */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Weekly Target</span>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Target Minggu Ini <TargetIcon className="w-5 h-5 text-emerald-600" /></h2>
            <p className="text-[11px] text-slate-400 mt-1">Pilih target yang mau kamu kejar minggu ini (Senin–Minggu, WIB). Isi 0 kalau tidak dipasang.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Target Sesi Workout</label>
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
              <Dumbbell className="w-4 h-4 text-emerald-600" />
              <input type="number" min={0} max={21} value={weekly.workoutSessions} onChange={(e) => setWeekly({ ...weekly, workoutSessions: Math.max(0, parseInt(e.target.value) || 0) })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full" />
              <span className="text-[10px] text-slate-400 whitespace-nowrap">sesi/minggu</span>
            </div>
            <p className="text-[10px] text-slate-400">Mis. 3 = target 3 sesi workout minggu ini.</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Target Hari Aktif (Habit)</label>
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
              <Activity className="w-4 h-4 text-emerald-600" />
              <input type="number" min={0} max={7} value={weekly.activeDays} onChange={(e) => setWeekly({ ...weekly, activeDays: Math.max(0, Math.min(7, parseInt(e.target.value) || 0)) })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full" />
              <span className="text-[10px] text-slate-400 whitespace-nowrap">hari/minggu</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Target Sesi Puasa</label>
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
              <Moon className="w-4 h-4 text-emerald-600" />
              <input type="number" min={0} max={14} value={weekly.fastSessions} onChange={(e) => setWeekly({ ...weekly, fastSessions: Math.max(0, parseInt(e.target.value) || 0) })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full" />
              <span className="text-[10px] text-slate-400 whitespace-nowrap">sesi/minggu</span>
            </div>
            <p className="text-[10px] text-slate-400">Mis. 3 = target 3 hari puasa minggu ini.</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Minimal Durasi Puasa</label>
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
              <Moon className="w-4 h-4 text-emerald-600" />
              <input type="number" min={1} max={48} value={weekly.fastMinHours} onChange={(e) => setWeekly({ ...weekly, fastMinHours: Math.max(1, Math.min(48, parseInt(e.target.value) || 16)) })} className="bg-transparent text-xs text-slate-900 focus:outline-none w-full" />
              <span className="text-[10px] text-slate-400 whitespace-nowrap">jam/sesi</span>
            </div>
            <p className="text-[10px] text-slate-400">Sesi puasa dihitung kalau durasinya ≥ nilai ini (mis. 16 jam).</p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 mt-0.5"><Bell className="w-4 h-4" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Reminder Target Mingguan (Android PWA)</p>
                <p className="text-[11px] text-slate-500">
                  Maksimalkan notifikasi: popup, badge, aksi, dan pola getar via Web Push/Service Worker. Suara &amp; getar saat app tertutup
                  mengikuti <span className="font-semibold">setelan notifikasi Android (channel/DND)</span> perangkat — Lean Mode mengirim opsi maksimal.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleReminder}
              role="switch"
              aria-checked={reminderEnabled}
              aria-label="Toggle reminder target mingguan"
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${reminderEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${reminderEnabled ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTestPush}
              disabled={pushBusy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-emerald-400 disabled:opacity-50"
            >
              <Smartphone className="w-3.5 h-3.5" />
              {pushBusy ? "Mengirim..." : "Tes Notifikasi Push"}
            </button>
            <span className="text-[10px] text-slate-400">
              {pushSupported() ? "Untuk hasil terbaik: install ke Home Screen (Android Chrome)." : "Push butuh Service Worker + PushManager."}
            </span>
          </div>

          {pushMsg && (
            <p className={`text-[11px] ${pushMsg.ok ? "text-emerald-600" : "text-rose-600"}`}>{pushMsg.text}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          {weeklyMsg ? (<span className="text-xs font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Target mingguan disimpan!</span>) : <span />}
          <button type="button" onClick={saveWeekly} disabled={weeklySaving} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50">
            <Save className="w-4 h-4" /><span>{weeklySaving ? "Menyimpan..." : "Simpan Target Minggu Ini"}</span>
          </button>
        </div>
      </div>

      {/* Notifikasi Jadwal (pakai setting yang sudah ada) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Schedule Notifications</span>
          <h2 className="text-2xl font-bold text-slate-900">Notifikasi Jadwal</h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Push Android saat app tertutup (butuh PWA terpasang, izin notifikasi, VAPID, dan cron server). Akurasi mengikuti interval cron (±15 menit) &amp; waktu WIB. Suara/getar nyata mengikuti setelan Android/DND.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              key: "fastReminderEnabled" as const,
              icon: <Moon className="w-4 h-4" />,
              title: "Buka Puasa",
              desc: "Kirim notif saat target puasa aktif tercapai (berdasarkan jam mulai + durasi puasa yang sedang berjalan).",
            },
            {
              key: "workoutReminderEnabled" as const,
              icon: <Dumbbell className="w-4 h-4" />,
              title: "Jadwal Workout",
              desc: `Ingatkan pada Jam Latihan (${settings.workoutTime || "belum disetel"} WIB) jika hari itu belum ada workout tercatat.`,
            },
            {
              key: "sleepReminderEnabled" as const,
              icon: <Moon className="w-4 h-4" />,
              title: "Jadwal Tidur",
              desc: `Ingatkan pada Jam Tidur (${settings.sleepTime || "belum disetel"} WIB) jika habit tidur hari itu belum dicentang.`,
            },
          ].map((item) => {
            const enabled = !!settings[item.key];
            return (
              <div key={item.key} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 mt-0.5">{item.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSchedule(item.key)}
                  role="switch"
                  aria-checked={enabled}
                  disabled={scheduleBusy === item.key}
                  aria-label={`Toggle ${item.title}`}
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-60 ${enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-400">
          Ubah <span className="font-semibold">Jam Latihan</span> / <span className="font-semibold">Jam Tidur</span> di Pengaturan Personal lalu Simpan Perubahan agar jadwal notif mengikuti jam terbaru.
        </p>
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
            try {
              const user = firebaseAuth.currentUser;
              if (!user || !user.email) throw new Error("Tidak ada user");
              const cred = EmailAuthProvider.credential(user.email, currentPassword);
              await reauthenticateWithCredential(user, cred);
              await updatePassword(user, newPassword);
              setPwMsg({ ok: true, text: "Password berhasil diganti!" });
              setCurrentPassword("");
              setNewPassword("");
            } catch (err: unknown) {
              setPwMsg({ ok: false, text: err instanceof Error ? err.message : "Gagal mengganti password" });
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