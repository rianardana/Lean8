"use client";

import React, { useState, useEffect, useRef } from "react";
import { WeightLogData, ProgressPhotoData, BodyMeasurementData } from "@/types";
import { api } from "@/lib/api";
import { wibDate } from "@/lib/time";
import { resizeImage } from "@/lib/image";
import { Plus, Calendar, Scale, CheckCircle2, Trash2, Ruler, X, ChevronLeft, ChevronRight } from "lucide-react";

interface ProgressViewProps {
  onWeightLogged?: () => void;
}

type MKey = "waist" | "chest" | "arm" | "thigh";
const MFIELDS: { key: MKey; label: string }[] = [
  { key: "waist", label: "Pinggang (cm)" },
  { key: "chest", label: "Dada (cm)" },
  { key: "arm", label: "Lengan (cm)" },
  { key: "thigh", label: "Paha (cm)" },
];

export const ProgressView: React.FC<ProgressViewProps> = ({ onWeightLogged }) => {
  const [weights, setWeights] = useState<WeightLogData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const todayStr = wibDate();
  const [newWeight, setNewWeight] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const [photos, setPhotos] = useState<ProgressPhotoData[]>([]);
  const [photoLoading, setPhotoLoading] = useState<boolean>(false);
  const [photoMsg, setPhotoMsg] = useState<string>("");
  const [compare, setCompare] = useState<number[]>([]);
  const [showPhotos, setShowPhotos] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const lbTouch = useRef<number | null>(null);

  const [measurements, setMeasurements] = useState<BodyMeasurementData[]>([]);
  const [mForm, setMForm] = useState<Record<MKey, string>>({ waist: "", chest: "", arm: "", thigh: "" });
  const [mDate, setMDate] = useState<string>(todayStr);
  const [mSubmitting, setMSubmitting] = useState<boolean>(false);
  const [mSaved, setMSaved] = useState<boolean>(false);

  const fetchWeights = async () => {
    setLoading(true);
    try { setWeights(await api.getWeights()); } finally { setLoading(false); }
  };

  useEffect(() => { fetchWeights(); }, []);

  const fetchPhotos = async () => {
    try { setPhotos(await api.getProgressPhotos()); } catch { /* ignore */ }
  };

  useEffect(() => { fetchPhotos(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeight);
    if (isNaN(val) || val <= 0) return;
    setSubmitting(true);
    try {
      await api.logWeight(val, selectedDate);
      setNewWeight(""); setSuccessMsg(true);
      await fetchWeights();
      if (onWeightLogged) onWeightLogged();
      setTimeout(() => setSuccessMsg(false), 3000);
    } finally { setSubmitting(false); }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true); setPhotoMsg("");
    try {
      const base64 = await resizeImage(file);
      await api.addProgressPhoto(base64, todayStr);
      await fetchPhotos();
    } catch {
      setPhotoMsg("Upload gagal — coba lagi.");
    }
    setPhotoLoading(false);
    e.target.value = "";
  };

  const removePhoto = async (id: number) => {
    await api.deleteProgressPhoto(id);
    setCompare((c) => c.filter((x) => x !== id));
    await fetchPhotos();
  };

  const toggleCompare = (id: number) => {
    setCompare((c) =>
      c.includes(id) ? c.filter((x) => x !== id) : c.length < 2 ? [...c, id] : [c[1], id]
    );
  };

  const openLightbox = (idx: number) => setLightbox(idx);
  const lightboxPrev = () => setLightbox((i) => (i === null ? null : (i + photos.length - 1) % photos.length));
  const lightboxNext = () => setLightbox((i) => (i === null ? null : (i + 1) % photos.length));
  const onLbPointerDown = (e: React.PointerEvent) => { lbTouch.current = e.clientX; };
  const onLbPointerUp = (e: React.PointerEvent) => {
    if (lbTouch.current === null) return;
    const dx = e.clientX - lbTouch.current;
    lbTouch.current = null;
    if (Math.abs(dx) > 50) (dx < 0 ? lightboxNext() : lightboxPrev());
  };

  const fetchMeasurements = async () => {
    try { setMeasurements(await api.getMeasurements()); } catch { /* ignore */ }
  };

  useEffect(() => { fetchMeasurements(); }, []);

  const handleMeasurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pick = (s: string) => (s.trim() === "" ? null : Number(s));
    const body: BodyMeasurementData = {
      date: mDate,
      waist: pick(mForm.waist),
      chest: pick(mForm.chest),
      arm: pick(mForm.arm),
      thigh: pick(mForm.thigh),
    };
    if (body.waist == null && body.chest == null && body.arm == null && body.thigh == null) return;
    setMSubmitting(true);
    try {
      await api.logMeasurement(body);
      setMForm({ waist: "", chest: "", arm: "", thigh: "" });
      setMSaved(true);
      await fetchMeasurements();
      setTimeout(() => setMSaved(false), 3000);
    } finally { setMSubmitting(false); }
  };

  const minWeight = weights.length ? Math.min(...weights.map((w) => w.weight)) - 1 : 60;
  const maxWeight = weights.length ? Math.max(...weights.map((w) => w.weight)) + 1 : 90;
  const range = Math.max(1, maxWeight - minWeight);
  const points = weights.map((w, index) => {
    const x = (index / Math.max(1, weights.length - 1)) * 300;
    const y = 120 - ((w.weight - minWeight) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <div>
            <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Weight Logger</span>
            <h3 className="text-xl font-bold text-slate-900">Catat Berat Badan</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Tanggal Log</label>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-xs text-slate-800 focus:outline-none w-full cursor-pointer" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Berat (kg)</label>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <Scale className="w-4 h-4 text-emerald-600" />
                <input type="number" step="0.1" placeholder="Contoh: 84.5" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="bg-transparent text-xs text-slate-800 focus:outline-none w-full" required />
              </div>
            </div>
            {successMsg && (<p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Berat berhasil tercatat!</p>)}
            <button type="submit" disabled={submitting || !newWeight} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /><span>{submitting ? "Menyimpan..." : "Simpan Log Berat"}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Trend Visualizer</span>
              <h3 className="text-xl font-bold text-slate-900">Grafik Perjalanan Berat Badan</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Terbaru</span>
              <p className="text-lg font-black text-emerald-600">{weights.length ? `${weights[weights.length - 1].weight} kg` : "-"}</p>
            </div>
          </div>
          <div className="relative w-full h-44 bg-slate-50 rounded-2xl border border-slate-200 p-4 flex items-center justify-center">
            {loading ? (<span className="text-xs text-slate-500 animate-pulse">Memuat grafik...</span>)
              : weights.length < 2 ? (<span className="text-xs text-slate-500">Minimal 2 entri berat untuk menampilkan trend grafik.</span>)
              : (
              <svg viewBox="0 0 300 140" className="w-full h-full overflow-visible">
                <defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity="0.4" /><stop offset="100%" stopColor="#10B981" stopOpacity="0.0" /></linearGradient></defs>
                <polygon points={`0,140 ${points} 300,140`} fill="url(#chartGradient)" />
                <polyline fill="none" stroke="#10B981" strokeWidth="2.5" points={points} />
                {weights.map((w, index) => {
                  const x = (index / Math.max(1, weights.length - 1)) * 300;
                  const y = 120 - ((w.weight - minWeight) / range) * 100;
                  return (<g key={w.id || index}><circle cx={x} cy={y} r="4" fill="#ffffff" stroke="#10B981" strokeWidth="2" /></g>);
                })}
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Riwayat Penimbangan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px]">
              <tr><th className="py-2.5 px-4 rounded-l-xl">Tanggal</th><th className="py-2.5 px-4">Berat (kg)</th><th className="py-2.5 px-4 rounded-r-xl">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {weights.map((w) => (
                <tr key={w.id || w.date} className="hover:bg-slate-100 transition-colors">
                  <td className="py-3 px-4 font-mono">{w.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{w.weight} kg</td>
                  <td className="py-3 px-4"><span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-mono border border-emerald-500/30">Tercatat</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Body Measurements</span>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">Ukuran Tubuh <Ruler className="w-4 h-4 text-emerald-600" /></h3>
          <p className="text-[11px] text-slate-400">Lingkar dalam cm. Kosongkan yang ga diukur.</p>
        </div>
        <form onSubmit={handleMeasurementSubmit} className="space-y-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} className="bg-transparent text-xs text-slate-800 focus:outline-none w-full cursor-pointer" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MFIELDS.map((f) => (
              <div key={f.key} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <input type="number" step="0.1" placeholder={f.label} value={mForm[f.key]} onChange={(e) => setMForm({ ...mForm, [f.key]: e.target.value })} className="bg-transparent text-xs text-slate-800 focus:outline-none w-full" />
              </div>
            ))}
          </div>
          {mSaved && (<p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ukuran tersimpan!</p>)}
          <button type="submit" disabled={mSubmitting} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" /><span>{mSubmitting ? "Menyimpan..." : "Simpan Ukuran"}</span>
          </button>
        </form>
        {measurements.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px]">
                <tr><th className="py-2.5 px-3 rounded-l-xl">Tanggal</th><th className="py-2.5 px-3">Pinggang</th><th className="py-2.5 px-3">Dada</th><th className="py-2.5 px-3">Lengan</th><th className="py-2.5 px-3 rounded-r-xl">Paha</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {measurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-100 transition-colors">
                    <td className="py-2.5 px-3 font-mono">{m.date}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.waist ?? "-"}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.chest ?? "-"}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.arm ?? "-"}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.thigh ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-emerald-600 uppercase tracking-wider">Progress Photos</span>
            <h3 className="text-xl font-bold text-slate-900">Foto Progres Badan</h3>
          </div>
          <button
            onClick={() => setShowPhotos((s) => !s)}
            role="switch"
            aria-checked={showPhotos}
            className={`relative w-12 h-7 rounded-full transition-colors ${showPhotos ? "bg-emerald-500" : "bg-slate-300"}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${showPhotos ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {showPhotos && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 cursor-pointer hover:border-emerald-500 active:scale-95 transition">
                <img src="/cameraP.webp" alt="Camera" className="w-full h-36 object-contain" />
                <span className="block text-center text-xs font-semibold text-slate-700 py-1.5">{photoLoading ? "Menyimpan..." : "Kamera"}</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} disabled={photoLoading} />
              </label>
              <label className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 cursor-pointer hover:border-emerald-500 active:scale-95 transition">
                <img src="/galeryP.webp" alt="Gallery" className="w-full h-36 object-contain" />
                <span className="block text-center text-xs font-semibold text-slate-700 py-1.5">Galeri</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={photoLoading} />
              </label>
            </div>

            {photoMsg && <span className="text-[11px] text-rose-600">{photoMsg}</span>}

            {compareMode && compare.length === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {compare.map((id) => {
                  const p = photos.find((x) => x.id === id);
                  return p ? (
                    <div key={id}>
                      <img src={p.url} alt={p.date} className="w-full aspect-[3/4] object-cover rounded-2xl border-2 border-emerald-500" />
                      <span className="block text-center text-[11px] font-mono text-slate-500 mt-1">{p.date}</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {photos.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada foto. Ambil foto dari depan tiap minggu biar progres makin keliatan.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setCompareMode((c) => !c); setCompare([]); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${compareMode ? "bg-emerald-500 text-slate-950 border-emerald-500" : "text-slate-600 border-slate-200 hover:border-slate-300"}`}
                  >
                    {compareMode ? "Selesai Banding" : "Bandingkan 2 Foto"}
                  </button>
                  <span className="text-[10px] text-slate-400">{compareMode ? "Pilih 2 foto" : "Ketuk foto untuk lihat besar"}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {photos.map((p, idx) => (
                    <div key={p.id} className={`relative rounded-2xl overflow-hidden border-2 transition ${compareMode && compare.includes(p.id!) ? "border-emerald-500" : "border-slate-200"}`}>
                      <button onClick={() => (compareMode ? toggleCompare(p.id!) : openLightbox(idx))} className="block w-full">
                        <img src={p.url} alt={p.date} className="w-full aspect-[3/4] object-cover" />
                      </button>
                      <span className="absolute bottom-1 left-1 text-[10px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded">{p.date}</span>
                      <button onClick={() => removePhoto(p.id!)} className="absolute top-1 right-1 bg-black/60 text-white p-1.5 rounded-full hover:bg-rose-600 transition" aria-label="Hapus foto">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Lightbox gallery */}
      {lightbox !== null && photos[lightbox] && (
        <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-xs font-mono text-white/70">{photos[lightbox].date}</span>
            <span className="text-xs font-mono text-white/70">{lightbox + 1} / {photos.length}</span>
            <button onClick={() => setLightbox(null)} aria-label="Tutup" className="p-2 rounded-full hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-2">
            <button onClick={lightboxPrev} aria-label="Sebelumnya" className="absolute left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <img
              src={photos[lightbox].url}
              alt={photos[lightbox].date}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
              onPointerDown={onLbPointerDown}
              onPointerUp={onLbPointerUp}
            />
            <button onClick={lightboxNext} aria-label="Berikutnya" className="absolute right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};