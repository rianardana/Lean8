"use client";

import React from "react";
import { LayoutDashboard, CheckSquare, TrendingDown, Sparkles, Settings } from "lucide-react";

export type TabType = "dashboard" | "daily" | "progress" | "aireview" | "settings";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "daily", label: "Daily Check", icon: CheckSquare },
    { id: "progress", label: "Progress", icon: TrendingDown },
    { id: "aireview", label: "AI Review", icon: Sparkles },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f17]/80 backdrop-blur-xl border-b border-emerald-900/30 px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
             <img src="/logo.png" alt="Lean8 Logo" className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-400 bg-clip-text text-transparent">
              LEAN8
            </h1>
            <p className="text-[10px] text-emerald-400/70 font-mono tracking-wider uppercase">
              Consistency Over Perfection
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner w-full sm:w-auto overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20 scale-[1.02]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
