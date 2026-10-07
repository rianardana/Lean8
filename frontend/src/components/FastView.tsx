"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { FastData } from "@/types";
import { Play, Check, History, Flame, Pencil, Plus, X, Trash2 } from "lucide-react";

const PLANS = [14, 16, 18, 20];

// Ambang batas dalam jam sejak mulai puasa → fase tubuh.
type Stage = { hours: number; emoji: string; label: string; range: string; desc: string; motivation: string };

const STAGES: Stage[] = [
  { hours: 0, emoji: "🍽️", label: "Fase Anabolik", range: "0–4 jam",
    desc: "Tubuh masih mencerna makanan terakhir. Gula darah & insulin naik untuk mengangkut nutrisi ke sel.",
    motivation: "Fase paling gampang — kamu masih kenyang. Tetap aktif, jangan mikirin makan dulu." },
  { hours: 4, emoji: "🍬", label: "Gula Darah Turun", range: "4–8 jam",
    desc: "Pencernaan selesai, insulin mulai turun. Gula darah kembali ke level normal dan stabil.",
    motivation: "Masuk zona transisi. Kalau lapar ringan muncul, itu tanda tubuh belajar pakai cadangan energi." },
  { hours: 8, emoji: "🔋", label: "Transisi Lemak", range: "8–12 jam",
    desc: "Simpanan glikogen (gula) mulai menipis, tubuh beralih ke pembakaran lemak sebagai bahan bakar.",
    motivation: "Titik baliknya — sebentar lagi tubuh kamu jadi mesin pembakar lemak. Tahan dulu." },
  { hours: 12, emoji: "🔥", label: "Ketosis Ringan", range: "12–14 jam",
    desc: "Gula darah & insulin turun signifikan. Hati mulai memproduksi keton, pembakaran lemak meningkat.",
    motivation: "Lapar biasanya datang di sini. Minum air atau teh tanpa gula — craving reda dalam 15 menit." },
  { hours: 14, emoji: "⚡", label: "Pembakaran Lemak", range: "14–16 jam",
    desc: "Ketosis makin dalam, growth hormone naik. Lemak jadi sumber energi utama.",
    motivation: "Mayoritas puasa 16:8 udah lewat — kamu hampir menang. Nikmati energi yang justru naik." },
  { hours: 16, emoji: "🔱", label: "Fat Burning Optimal", range: "16–18 jam",
    desc: "Pembakaran lemak di puncak, hormon pertumbuhan meningkat tajam sambil melindungi otot.",
    motivation: "Target 16:8 tercapai! Setiap jam tambahan adalah bonus buat tubuh kamu." },
  { hours: 18, emoji: "🧬", label: "Autophagy", range: "18–24 jam",
    desc: "Sel mulai membersihkan komponen rusak & memperbaiki diri (proses autophagy).",
    motivation: "Ini 'detox' alami tubuh. Sel-sel lama didaur ulang — kamu literally memperbarui diri." },
  { hours: 24, emoji: "✨", label: "Autophagy Meningkat", range: "24+ jam",
    desc: "Keton tinggi, autophagy meningkat, pemecahan lemak maksimal.",
    motivation: "Puasa panjang level lanjutan. Tetap terhidrasi, jaga elektrolit, dan dengarkan tubuh." },
];

const fmtHMS = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const fmtShort = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}j ${m}m`;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

// Wheel picker jam:menit (scroll-snap, ala apps enterprise).
const WHEEL_ITEM = 40;

const TimeWheel: React.FC<{ hours: number; minutes: number; onChange: (h: number, m: number) => void }> = ({ hours, minutes, onChange }) => {
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hourRef.current?.scrollTo({ top: hours * WHEEL_ITEM });
    minRef.current?.scrollTo({ top: (minutes / 5) * WHEEL_ITEM });
  }, []);

  const onHourScroll = () => {
    const el = hourRef.current;
    if (!el) return;
    const h = Math.min(23, Math.max(0, Math.round(el.scrollTop / WHEEL_ITEM)));
    onChange(h, minutes);
  };
  const onMinScroll = () => {
    const el = minRef.current;
    if (!el) return;
    const m = Math.min(55, Math.max(0, Math.round(el.scrollTop / WHEEL_ITEM) * 5));
    onChange(hours, m);
  };

  const wheel = (ref: React.RefObject<HTMLDivElement | null>, onScroll: () => void, values: number[]) => (
    <div className="relative w-20 h-44">
      <div ref={ref} onScroll={onScroll} className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar">
        <div style={{ height: 68 }} />
        {values.map((v) => (
          <div key={v} style={{ height: WHEEL_ITEM }} className="flex items-center justify-center snap-center text-lg font-bold text-slate-700">{pad2(v)}</div>
        ))}
        <div style={{ height: 68 }} />
      </div>
      <div className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 h-10 border-y-2 border-emerald-500/40 bg-emerald-500/5 rounded-lg" />
    </div>
  );

  return (
    <div className="flex justify-center items-center gap-2 py-1">
      {wheel(hourRef, onHourScroll, Array.from({ length: 24 }, (_, i) => i))}
      <span className="text-lg font-bold text-slate-400">:</span>
      {wheel(minRef, onMinScroll, Array.from({ length: 12 }, (_, i) => i * 5))}
    </div>
  );
};

// Picker durasi horizontal (geser kiri–kanan) — 12–24 jam.
const DUR_MIN = 12;
const DUR_MAX = 24;
const DUR_ITEM = 56; // lebar satu item (w-14)

const DurationWheel: React.FC<{ value: number; onChange: (h: number) => void }> = ({ value, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const values = Array.from({ length: DUR_MAX - DUR_MIN + 1 }, (_, i) => DUR_MIN + i);
  useEffect(() => {
    const v = Math.min(DUR_MAX, Math.max(DUR_MIN, value));
    ref.current?.scrollTo({ left: (v - DUR_MIN) * DUR_ITEM });
  }, []);
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const h = Math.min(DUR_MAX, Math.max(DUR_MIN, Math.round(el.scrollLeft / DUR_ITEM) + DUR_MIN));
    onChange(h);
  };
  return (
    <div className="relative w-full max-w-xs mx-auto h-16">
      <div ref={ref} onScroll={onScroll} className="h-full overflow-x-auto snap-x snap-mandatory no-scrollbar flex">
        <div className="shrink-0" style={{ width: `calc(50% - ${DUR_ITEM / 2}px)` }} />
        {values.map((v) => (
          <div
            key={v}
            style={{ width: DUR_ITEM }}
            className={`shrink-0 snap-center h-full flex items-center justify-center text-lg font-bold transition ${v === value ? "text-emerald-700" : "text-slate-400"}`}
          >
            {v}
          </div>
        ))}
        <div className="shrink-0" style={{ width: `calc(50% - ${DUR_ITEM / 2}px)` }} />
      </div>
      <div className="pointer-events-none absolute inset-y-1 left-1/2 -translate-x-1/2 w-14 border-x-2 border-emerald-500/40 bg-emerald-500/5 rounded-xl" />
    </div>
  );
};

const stageAt = (hours: number) => {
  let current = STAGES[0];
  for (const s of STAGES) if (hours >= s.hours) current = s;
  return current;
};

const Ring: React.FC<{ pct: number; center: string; sub: string }> = ({ pct, center, sub }) => {
  const R = 84;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r={R} fill="none" stroke="#e2e8f0" strokeWidth="13" />
        <circle
          cx="100" cy="100" r={R} fill="none" stroke="#10B981" strokeWidth="13" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, Math.max(0, pct)))}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black text-slate-900 font-mono">{center}</span>
        <span className="text-[11px] text-slate-500 font-medium mt-1">{sub}</span>
      </div>
    </div>
  );
};

export const FastView: React.FC = () => {
  const [active, setActive] = useState<FastData | null>(null);
  const [history, setHistory] = useState<FastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [planHours, setPlanHours] = useState(16);
  const [customHours, setCustomHours] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editHour, setEditHour] = useState(7);
  const [editMinute, setEditMinute] = useState(0);
  const [editPlan, setEditPlan] = useState(16);
  const [logging, setLogging] = useState(false);
  const [logStart, setLogStart] = useState("");
  const [logEnd, setLogEnd] = useState("");
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [endHour, setEndHour] = useState(7);
  const [endMinute, setEndMinute] = useState(0);

  const refresh = async () => {
    const data = await api.getFast();
    setActive(data.active);
    setHistory(data.history);
  };

  useEffect(() => {
    let mounted = true;
    api.getFast().then((d) => { if (mounted) { setActive(d.active); setHistory(d.history); } }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Tick tiap detik supaya countdown jalan live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = async () => {
    const hours = customHours ?? planHours;
    if (!hours || hours <= 0) return;
    setBusy(true);
    try {
      setActive(await api.startFast(hours));
      setCustomHours(null);
    } catch { /* ignore */ } finally { setBusy(false); }
  };

  const openEnd = () => {
    const d = new Date();
    setEndDate(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
    setEndHour(d.getHours());
    setEndMinute(d.getMinutes());
    setEnding(true);
  };

  const confirmEnd = async () => {
    if (!endDate) return;
    setBusy(true);
    try {
      await api.endFast(new Date(`${endDate}T${pad2(endHour)}:${pad2(endMinute)}`).toISOString());
      setEnding(false);
      await refresh();
    } catch { /* ignore */ } finally { setBusy(false); }
  };

  const deleteFast = async (id: number) => {
    await api.deleteFast(id);
    await refresh();
  };

  const openEdit = () => {
    if (!active) return;
    const d = new Date(active.startedAt);
    setEditDate(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
    setEditHour(d.getHours());
    setEditMinute(d.getMinutes());
    setEditPlan(active.planHours);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!active) return;
    setBusy(true);
    try {
      const startedAt = editDate ? new Date(`${editDate}T${pad2(editHour)}:${pad2(editMinute)}`).toISOString() : undefined;
      const patch: { startedAt?: string; planHours?: number } = {};
      if (startedAt) patch.startedAt = startedAt;
      if (editPlan && editPlan > 0) patch.planHours = editPlan;
      setActive(await api.editFast(active.id, patch));
      setEditing(false);
    } catch { /* ignore */ } finally { setBusy(false); }
  };

  const saveLog = async () => {
    if (!logStart || !logEnd) return;
    setBusy(true);
    try {
      await api.logFast({ startedAt: new Date(logStart).toISOString(), endedAt: new Date(logEnd).toISOString() });
      setLogStart(""); setLogEnd(""); setLogging(false);
      await refresh();
    } catch { /* ignore */ } finally { setBusy(false); }
  };

  if (loading) return <div className="text-center py-16 text-slate-500 text-sm animate-pulse">Memuat tracker puasa...</div>;

  // ===== Sesi aktif =====
  if (active) {
    const startMs = new Date(active.startedAt).getTime();
    const targetMs = active.planHours * 3600 * 1000;
    const elapsed = now - startMs;
    const remaining = Math.max(0, targetMs - elapsed);
    const pct = Math.min(1, elapsed / targetMs);
    const elapsedHours = elapsed / 3600000;
    const stage = stageAt(elapsedHours);
    const done = remaining <= 0;

    return (
      <>
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Puasa Aktif · {active.planHours}:{24 - active.planHours}</span>
              <h2 className="text-2xl font-bold text-slate-900">{done ? "Puasa Selesai!" : "Sedang Berpuasa"}</h2>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600"><Flame className="w-6 h-6" /></div>
          </div>

          <Ring
            pct={pct}
            center={done ? "00:00:00" : fmtHMS(remaining)}
            sub={done ? "Waktunya makan" : "sisa waktu"}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Sudah berjalan</span>
            <span className="font-bold text-slate-900 font-mono">{fmtShort(elapsed)}</span>
          </div>

          {/* Tahap saat ini */}
          <button
            onClick={() => setJourneyOpen(true)}
            className="w-full text-left rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-2 hover:bg-emerald-500/10 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none animate-float">{stage.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{stage.label}</p>
                <p className="text-[11px] text-slate-500 font-mono">{stage.range} · Jam ke-{Math.min(active.planHours, Math.floor(elapsedHours) + 1)}</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">Lihat semua →</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{stage.desc}</p>
            <p className="text-[11px] text-emerald-700 leading-relaxed italic">💬 {stage.motivation}</p>
          </button>

          {editing ? (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Tanggal</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Jam Mulai Puasa</label>
                <TimeWheel hours={editHour} minutes={editMinute} onChange={(h, m) => { setEditHour(h); setEditMinute(m); }} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Durasi Puasa (jam)</label>
                <DurationWheel value={editPlan} onChange={setEditPlan} />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={busy} className="flex-1 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm hover:opacity-95 disabled:opacity-50 transition">Simpan Perubahan</button>
                <button onClick={() => setEditing(false)} className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition">Batal</button>
              </div>
            </div>
          ) : (
            <button onClick={openEdit} className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition">
              <Pencil className="w-4 h-4" /> Edit Waktu / Durasi
            </button>
          )}

          {ending ? (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Tanggal</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Jam Buka Puasa</label>
                <TimeWheel hours={endHour} minutes={endMinute} onChange={(h, m) => { setEndHour(h); setEndMinute(m); }} />
              </div>
              <div className="flex gap-2">
                <button onClick={confirmEnd} disabled={busy || !endDate} className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 transition">Konfirmasi Akhiri</button>
                <button onClick={() => setEnding(false)} className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition">Batal</button>
              </div>
            </div>
          ) : (
            <button
              onClick={openEnd}
              disabled={busy}
              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Akhiri Puasa
            </button>
          )}
        </div>

        <HistoryList history={history} onDelete={deleteFast} />
      </div>
      {journeyOpen && <JourneySheet current={stage} onClose={() => setJourneyOpen(false)} />}
      </>
    );
  }

  // ===== Belum ada sesi aktif =====
  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-lg">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Intermittent Fasting</span>
          <h2 className="text-2xl font-bold text-slate-900">Pilih Durasi Puasa</h2>
          <p className="text-xs text-slate-500 mt-1">Fast : Eat window. Tekan mulai untuk menyalakan timer.</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {PLANS.map((h) => (
            <button
              key={h}
              onClick={() => { setPlanHours(h); setCustomHours(null); }}
              className={`py-4 rounded-2xl border text-center transition-all ${planHours === h && customHours === null ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              <span className="block text-lg font-black">{h}:{24 - h}</span>
              <span className="block text-[10px] font-medium">{h} jam puasa</span>
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Durasi Kustom (jam)</label>
          <DurationWheel key={customHours === null ? `p-${planHours}` : "c"} value={customHours ?? planHours} onChange={setCustomHours} />
        </div>

        <button
          onClick={start}
          disabled={busy}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" /> {busy ? "Memulai..." : "Mulai Puasa"}
        </button>

        {logging ? (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Jam Mulai Puasa</label>
              <input type="datetime-local" value={logStart} onChange={(e) => setLogStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Jam Selesai Puasa</label>
              <input type="datetime-local" value={logEnd} onChange={(e) => setLogEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveLog} disabled={busy || !logStart || !logEnd} className="flex-1 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm hover:opacity-95 disabled:opacity-50 transition">Simpan Puasa Lampau</button>
              <button onClick={() => setLogging(false)} className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition">Batal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setLogging(true)} className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition">
            <Plus className="w-4 h-4" /> Catat Puasa Lampau
          </button>
        )}
      </div>

      <HistoryList history={history} onDelete={deleteFast} />
    </div>
  );
};

const HistoryList: React.FC<{ history: FastData[]; onDelete: (id: number) => void }> = ({ history, onDelete }) => {
  if (history.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-emerald-600" />
        <h3 className="text-lg font-bold text-slate-900">Riwayat Puasa</h3>
      </div>
      <div className="space-y-2">
        {history.map((f) => {
          const start = new Date(f.startedAt);
          const end = f.endedAt ? new Date(f.endedAt) : null;
          const dur = end ? end.getTime() - start.getTime() : 0;
          const time = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
          return (
            <div key={f.id} className="flex items-center justify-between py-2.5 px-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-900">{start.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                <p className="text-[11px] text-slate-500 font-mono">{time(start)} – {end ? time(end) : "sekarang"}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-emerald-600 font-mono">{fmtShort(dur)}</span>
                <button onClick={() => onDelete(f.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition" aria-label="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const JourneySheet: React.FC<{ current: Stage; onClose: () => void }> = ({ current, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-white rounded-t-3xl overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Pembelajaran Intermittent Fasting</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tahapan yang terjadi di tubuhmu selama berpuasa.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-3">
          {STAGES.map((s) => {
            const isCurrent = current.hours === s.hours;
            return (
              <div
                key={s.hours}
                className={`rounded-2xl border p-4 space-y-2 ${isCurrent ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-200 bg-slate-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl leading-none">{s.emoji}</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{s.label}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{s.range}</span>
                  </div>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-[10px] font-mono">Sekarang</span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                <p className="text-[11px] text-emerald-700 leading-relaxed italic">💬 {s.motivation}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
