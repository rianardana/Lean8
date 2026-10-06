"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar, TabType, SECONDARY_TABS } from "@/components/Navbar";
import { DashboardView } from "@/components/DashboardView";
import { DailyCheckView } from "@/components/DailyCheckView";
import { CalorieTracker } from "@/components/CalorieTracker";
import { ProgressView } from "@/components/ProgressView";
import { AiReviewView } from "@/components/AiReviewView";
import { WorkoutView } from "@/components/WorkoutView";
import { FastView } from "@/components/FastView";
import { FastReport } from "@/components/FastReport";
import { SettingsView } from "@/components/SettingsView";
import { BmiVisual } from "@/components/BmiVisual";
import { ConsistencyCard } from "@/components/ConsistencyCard";
import { DashboardData } from "@/types";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OnboardingTour } from "@/components/OnboardingTour";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "1" && localStorage.getItem("leanmode_tour_seen") !== "1") {
      setShowTour(true);
    }
  }, []);

  const handleTourDone = () => {
    localStorage.setItem("leanmode_tour_seen", "1");
    setShowTour(false);
    router.replace("/");
  };

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
            <span className="text-sm font-bold bg-gradient-to-r from-slate-900 via-emerald-600 to-teal-600 bg-clip-text text-transparent">{user?.name ?? "User"}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition"
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
              onNavigateToWorkout={() => setActiveTab("workout")}
              onNavigateToAi={() => setCoachOpen(true)}
            />
            <ConsistencyCard />
          </>
        )}
        {activeTab === "daily" && <DailyCheckView onSaved={refreshDashboard} />}
        {activeTab === "fast" && <FastView />}
        {activeTab === "nutrition" && <CalorieTracker />}
        {activeTab === "progress" && <ProgressView onWeightLogged={refreshDashboard} />}
        {activeTab === "workout" && <WorkoutView />}
        {activeTab === "fastReport" && <FastReport />}
        {activeTab === "settings" && <SettingsView onSaved={refreshDashboard} />}
      </main>

      {/* Bottom Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onOpenMore={() => setMoreOpen(true)} />

      {/* Floating Coach bubble */}
      <button
        onClick={() => setCoachOpen(true)}
        aria-label="Buka Coach AI"
        className="fixed bottom-24 right-4 z-40 group"
      >
        <div className="relative w-14 h-14 rounded-full bg-white border-2 border-emerald-200 shadow-xl shadow-emerald-500/20 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 group-active:scale-95">
          <img src="/mascot.webp" alt="Coach AI" className="w-12 h-12 rounded-full object-cover object-top" />
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        </div>
      </button>

      {/* Coach overlay */}
      {coachOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-50">
          <AiReviewView onClose={() => setCoachOpen(false)} />
        </div>
      )}

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-10 max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Menu Lainnya</h3>
              <button onClick={() => setMoreOpen(false)} className="text-slate-400 text-sm px-2 font-semibold">Tutup</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SECONDARY_TABS.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTab(t.id); setMoreOpen(false); }}
                    className={`flex flex-col items-center gap-2 py-5 rounded-2xl border transition-all ${isActive ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-semibold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <InstallPrompt />

      {showTour && <OnboardingTour onDone={handleTourDone} />}
    </div>
  );
};
