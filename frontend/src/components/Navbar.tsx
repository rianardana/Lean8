"use client";

import React from "react";
import { LayoutDashboard, CheckSquare, Timer, Flame, TrendingDown, Dumbbell, Settings, MoreHorizontal, BarChart3 } from "lucide-react";

export type TabType = "dashboard" | "daily" | "fast" | "nutrition" | "progress" | "workout" | "fastReport" | "settings";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenMore: () => void;
}

export const PRIMARY_TABS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "daily", label: "Habit", icon: CheckSquare },
  { id: "fast", label: "Puasa", icon: Timer },
  { id: "nutrition", label: "Kalori", icon: Flame },
] as const;

export const SECONDARY_TABS = [
  { id: "progress", label: "Progres", icon: TrendingDown },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "fastReport", label: "Report Puasa", icon: BarChart3 },
  { id: "settings", label: "Setting", icon: Settings },
] as const;

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenMore }) => {
  const isMoreActive = SECONDARY_TABS.some((t) => t.id === activeTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-emerald-200 safe-area-pb">
      <div className="max-w-4xl mx-auto flex items-stretch justify-around px-1 py-1.5">
        {PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

        <button
          onClick={onOpenMore}
          className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 ${
            isMoreActive ? "text-emerald-600" : "text-slate-500 hover:text-slate-500"
          }`}
        >
          {isMoreActive && (
            <span className="absolute top-0 w-7 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
          )}
          <MoreHorizontal className={`w-5 h-5 transition-transform ${isMoreActive ? "scale-110" : ""}`} strokeWidth={isMoreActive ? 2.5 : 2} />
          <span className={`text-[10px] font-medium leading-none ${isMoreActive ? "text-emerald-600" : ""}`}>Lainnya</span>
        </button>
      </div>
    </nav>
  );
};
