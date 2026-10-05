"use client";

import React from "react";
import { LayoutDashboard, CheckSquare, Flame, TrendingDown, Sparkles, Settings, Dumbbell } from "lucide-react";

export type TabType = "dashboard" | "daily" | "nutrition" | "progress" | "aireview" | "workout" | "settings";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const TABS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "daily", label: "Habit", icon: CheckSquare },
  { id: "nutrition", label: "Kalori", icon: Flame },
  { id: "progress", label: "Progres", icon: TrendingDown },
  { id: "aireview", label: "Coach", icon: Sparkles },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "settings", label: "Setting", icon: Settings },
] as const;

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-emerald-200 safe-area-pb">
      <div className="max-w-4xl mx-auto flex items-stretch justify-around px-1 py-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 ${
                isActive ? "text-emerald-600" : "text-slate-500 hover:text-slate-500"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-7 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium leading-none ${isActive ? "text-emerald-600" : ""}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};