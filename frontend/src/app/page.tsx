"use client";

import React, { useState, useEffect } from "react";
import { Navbar, TabType } from "@/components/Navbar";
import { DashboardView } from "@/components/DashboardView";
import { DailyCheckView } from "@/components/DailyCheckView";
import { CalorieTracker } from "@/components/CalorieTracker";
import { ProgressView } from "@/components/ProgressView";
import { AiReviewView } from "@/components/AiReviewView";
import { SettingsView } from "@/components/SettingsView";
import { BmiVisual } from "@/components/BmiVisual";
import { DashboardData } from "@/types";
import { api } from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeUserId, setActiveUserId] = useState<1 | 2>(1); // 1=Rian, 2=Wahyu

  const refreshDashboard = async () => {
    try {
      const data = await api.getDashboard(activeUserId);
      setDashboardData(data);
    } catch { /* handled */ }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await api.getDashboard(activeUserId);
        if (isMounted) setDashboardData(data);
      } catch { /* handled */ }
    })();
    return () => { isMounted = false; };
  }, [activeTab, activeUserId]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Header: Toggle User + Brand */}
      <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-800/60 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Lean8 Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-400 bg-clip-text text-transparent leading-tight">
                LEAN8
              </h1>
              <p className="text-[9px] text-emerald-400/70 font-mono tracking-wider uppercase">Consistency Over Perfection</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {([1, 2] as const).map((uid) => (
              <button
                key={uid}
                onClick={() => setActiveUserId(uid)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  activeUserId === uid ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {uid === 1 ? "Rian" : "Wahyu"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content — pb-24 biar gak ketutupan bottom nav */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-5 pb-24 sm:pb-28 space-y-6">
        {activeTab === "dashboard" && dashboardData && (
          <>
            <BmiVisual weight={dashboardData.currentWeight} heightCm={dashboardData.heightCm} />
            <DashboardView
              data={dashboardData}
              onNavigateToDaily={() => setActiveTab("daily")}
              onNavigateToAi={() => setActiveTab("aireview")}
            />
          </>
        )}
        {activeTab === "daily" && <DailyCheckView userId={activeUserId} onSaved={refreshDashboard} />}
        {activeTab === "nutrition" && <CalorieTracker userId={activeUserId} />}
        {activeTab === "progress" && <ProgressView userId={activeUserId} onWeightLogged={refreshDashboard} />}
        {activeTab === "aireview" && <AiReviewView userId={activeUserId} />}
        {activeTab === "settings" && <SettingsView userId={activeUserId} onSaved={refreshDashboard} />}
      </main>

      {/* Bottom Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};