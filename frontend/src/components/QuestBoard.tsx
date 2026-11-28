"use client";

import React, { useEffect, useState } from "react";
import { Check, Circle, LoaderCircle, Sparkles, Target, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { QuestBoardData, QuestItemData } from "@/types";

interface QuestBoardProps {
  onXpClaimed?: () => void;
}

export const QuestBoard: React.FC<QuestBoardProps> = ({ onXpClaimed }) => {
  const [data, setData] = useState<QuestBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    api.getQuests()
      .then((quests) => { if (mounted) setData(quests); })
      .catch(() => { if (mounted) setError("Misi belum bisa dimuat."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const claim = async (quest: QuestItemData) => {
    setClaimingId(quest.id);
    setError("");
    try {
      const result = await api.claimQuest(quest.id);
      setData((current) => current ? {
        ...current,
        daily: current.daily.id === quest.id ? { ...current.daily, claimed: true } : current.daily,
        weekly: current.weekly.map((item) => item.id === quest.id ? { ...item, claimed: true } : item),
      } : current);
      setNotice(result.xpGained > 0 ? `Misi selesai! +${result.xpGained} XP` : "Hadiah misi ini sudah diklaim.");
      if (result.xpGained > 0) onXpClaimed?.();
    } catch {
      setError("Hadiah belum bisa diklaim. Coba lagi sebentar.");
    } finally {
      setClaimingId(null);
    }
  };

  const renderQuest = (quest: QuestItemData, kind: "daily" | "weekly") => {
    const percent = Math.min(100, Math.round((quest.current / Math.max(1, quest.target)) * 100));
    const isClaiming = claimingId === quest.id;
    return (
      <div key={quest.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-xl p-2 ${quest.claimed ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
            {quest.claimed ? <Check className="h-4 w-4" /> : kind === "daily" ? <Target className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900">{quest.title}</h4>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-700">
                <Sparkles className="h-3 w-3" /> +{quest.rewardXp} XP
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{quest.description}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className={quest.completed ? "text-emerald-700" : "text-slate-500"}>
              {quest.claimed ? "Hadiah sudah diklaim" : quest.completed ? "Misi tercapai" : "Progres"}
            </span>
            <span className="font-mono text-slate-500">{Math.min(quest.current, quest.target)} / {quest.target}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div className={`h-full rounded-full transition-all ${quest.completed ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`} style={{ width: `${percent}%` }} />
          </div>
        </div>
        {quest.completed && !quest.claimed && (
          <button
            onClick={() => claim(quest)}
            disabled={isClaiming}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60"
          >
            {isClaiming ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Klaim {quest.rewardXp} XP
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white" aria-label="Memuat misi" />;
  }

  if (!data) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500">{error || "Misi belum tersedia."}</div>;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="quest-board-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-600">Quest Board</span>
          <h3 id="quest-board-title" className="text-xl font-bold text-slate-900">Misi &amp; Hadiah</h3>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600"><Trophy className="h-5 w-5" /></div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Circle className="h-3.5 w-3.5 text-emerald-600" /> Misi Harian
          </div>
          {renderQuest(data.daily, "daily")}
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Target className="h-3.5 w-3.5 text-emerald-600" /> Tantangan Mingguan
          </div>
          <div className="space-y-2">{data.weekly.map((quest) => renderQuest(quest, "weekly"))}</div>
        </div>
      </div>

      {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-500/10 px-3 py-2 text-center text-xs font-bold text-emerald-700">{notice}</p>}
      {error && <p role="alert" className="mt-3 text-center text-xs font-semibold text-rose-600">{error}</p>}
      <p className="mt-3 text-center text-[10px] text-slate-400">Hadiah memberi XP untuk konsistensi mengikuti rencanamu.</p>
    </section>
  );
};
