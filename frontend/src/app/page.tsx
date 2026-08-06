"use client";

import React, { useState, useEffect } from "react";
import { Navbar, TabType } from "@/components/Navbar";
import { DashboardView } from "@/components/DashboardView";
import { DailyCheckView } from "@/components/DailyCheckView";
import { ProgressView } from "@/components/ProgressView";
import { AiReviewView } from "@/components/AiReviewView";
import { SettingsView } from "@/components/SettingsView";
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
    } catch { /* fallback handled in api */ }
  };

  useEffect(() => { refreshDashboard(); }, [activeTab, activeUserId]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Toggle Rian / Wahyu */}
      <div className="flex justify-center gap-2 pt-4">
        {([1, 2] as const).map((uid) => (
          <button
            key={uid}
            onClick={() => setActiveUserId(uid)}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition ${
              activeUserId === uid ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {uid === 1 ? "🟢 Rian" : "🔵 Wahyu"}
          </button>
        ))}
      </div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {activeTab === "dashboard" && dashboardData && (
          <DashboardView data={dashboardData} onNavigateToDaily={() => setActiveTab("daily")} onNavigateToAi={() => setActiveTab("aireview")} />
        )}
        {activeTab === "daily" && <DailyCheckView userId={activeUserId} onSaved={refreshDashboard} />}
        {activeTab === "progress" && <ProgressView userId={activeUserId} onWeightLogged={refreshDashboard} />}
        {activeTab === "aireview" && <AiReviewView userId={activeUserId} />}
        {activeTab === "settings" && <SettingsView userId={activeUserId} onSaved={refreshDashboard} />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <p>Lean8 Personal Habit Tracker &bull; Rian vs Wahyu</p>
      </footer>
    </div>
  );
}