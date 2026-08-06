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

  const refreshDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch {
      // API client fallback guarantees data state
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {activeTab === "dashboard" && dashboardData && (
          <DashboardView
            data={dashboardData}
            onNavigateToDaily={() => setActiveTab("daily")}
            onNavigateToAi={() => setActiveTab("aireview")}
          />
        )}

        {activeTab === "daily" && (
          <DailyCheckView onSaved={refreshDashboard} />
        )}

        {activeTab === "progress" && (
          <ProgressView onWeightLogged={refreshDashboard} />
        )}

        {activeTab === "aireview" && (
          <AiReviewView />
        )}

        {activeTab === "settings" && (
          <SettingsView onSaved={refreshDashboard} />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <p>Lean8 Personal Habit Tracker &bull; Built with Next.js & ASP.NET Core 8</p>
      </footer>
    </div>
  );
}
