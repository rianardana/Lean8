"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar, TabType } from "@/components/Navbar";
import { DashboardView } from "@/components/DashboardView";
import { DailyCheckView } from "@/components/DailyCheckView";
import { CalorieTracker } from "@/components/CalorieTracker";
import { ProgressView } from "@/components/ProgressView";
import { AiReviewView } from "@/components/AiReviewView";
import { SettingsView } from "@/components/SettingsView";
import { BmiVisual } from "@/components/BmiVisual";
import { ConsistencyCard } from "@/components/ConsistencyCard";
import { DashboardData } from "@/types";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const refreshDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch { /* handled */ }
  };

  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    (async () => {
      try {
        const data = await api.getDashboard();
        if (isMounted) setDashboardData(data);
      } catch { /* handled */ }
    })();
    return () => { isMounted = false; };
  }, [activeTab, session]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm animate-pulse">
        Memuat...
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-600">
      {/* Header: Brand + User */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/Logo_LeanMode.png" alt="Lean Mode Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">
                Lean Mode
              </h1>
              <p className="text-[9px] text-emerald-500 font-mono tracking-wider uppercase">Consistency Over Perfection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">{user?.name ?? "User"}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-500 hover:bg-slate-100 transition"
            >
              Logout
            </button>
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
            <ConsistencyCard />
          </>
        )}
        {activeTab === "daily" && <DailyCheckView onSaved={refreshDashboard} />}
        {activeTab === "nutrition" && <CalorieTracker />}
        {activeTab === "progress" && <ProgressView onWeightLogged={refreshDashboard} />}
        {activeTab === "aireview" && <AiReviewView />}
        {activeTab === "settings" && <SettingsView onSaved={refreshDashboard} />}
      </main>

      {/* Bottom Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <InstallPrompt />
    </div>
  );
};
