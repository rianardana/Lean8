import {
  DashboardData,
  DailyLogData,
  WeightLogData,
  UserSettingsData,
  AiReviewData,
} from "@/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// Rich Mock Data Initial State
const mockDashboard: DashboardData = {
  currentWeight: 84.5,
  targetWeight: 65.0,
  startingWeight: 86.0,
  progressPercentage: 7.1,
  activeDays: 14,
  userHandshakeName: "Lean8 User",
};

let mockWeights: WeightLogData[] = [
  { id: 1, date: "2026-07-24", weight: 86.0 },
  { id: 2, date: "2026-07-27", weight: 85.6 },
  { id: 3, date: "2026-07-30", weight: 85.2 },
  { id: 4, date: "2026-08-02", weight: 84.8 },
  { id: 5, date: "2026-08-06", weight: 84.5 },
];

let mockDailyLogs: Record<string, DailyLogData> = {
  "2026-08-06": {
    id: 101,
    date: "2026-08-06",
    workout: true,
    ifCompleted: true,
    proteinCompleted: true,
    waterCompleted: true,
    sleepCompleted: false,
    noSnack: true,
    notes: "Merasa energi melimpah saat fasting, tapi kurang tidur tadi malam.",
    completedCount: 5,
  },
};

let mockSettings: UserSettingsData = {
  name: "Lean8 User",
  heightCm: 175,
  currentWeight: 84.5,
  targetWeight: 65.0,
  workoutTime: "07:00",
  sleepTime: "22:00",
  proteinTargetGrams: 130,
};

async function fetchWithFallback<T>(url: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend API offline -> use mock fallback gracefully
  }

  if (fallbackData !== undefined) {
    return fallbackData;
  }
  throw new Error("Network request failed and no fallback available.");
}

export const api = {
  async getDashboard(): Promise<DashboardData> {
    return fetchWithFallback<DashboardData>(`${API_BASE_URL}/dashboard`, undefined, mockDashboard);
  },

  async getDaily(date: string): Promise<DailyLogData> {
    const fallback = mockDailyLogs[date] || {
      date,
      workout: false,
      ifCompleted: false,
      proteinCompleted: false,
      waterCompleted: false,
      sleepCompleted: false,
      noSnack: false,
      notes: "",
      completedCount: 0,
    };
    return fetchWithFallback<DailyLogData>(`${API_BASE_URL}/daily/${date}`, undefined, fallback);
  },

  async saveDaily(log: DailyLogData): Promise<DailyLogData> {
    let count = 0;
    if (log.workout) count++;
    if (log.ifCompleted) count++;
    if (log.proteinCompleted) count++;
    if (log.waterCompleted) count++;
    if (log.sleepCompleted) count++;
    if (log.noSnack) count++;

    const updatedLog: DailyLogData = { ...log, completedCount: count };
    mockDailyLogs[log.date] = updatedLog;

    return fetchWithFallback<DailyLogData>(
      `${API_BASE_URL}/daily`,
      {
        method: "POST",
        body: JSON.stringify(log),
      },
      updatedLog
    );
  },

  async getWeights(): Promise<WeightLogData[]> {
    return fetchWithFallback<WeightLogData[]>(`${API_BASE_URL}/weights`, undefined, mockWeights);
  },

  async logWeight(weight: number, date?: string): Promise<WeightLogData> {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const newLog: WeightLogData = { id: Date.now(), date: targetDate, weight };

    const existingIdx = mockWeights.findIndex((w) => w.date === targetDate);
    if (existingIdx >= 0) {
      mockWeights[existingIdx] = newLog;
    } else {
      mockWeights.push(newLog);
      mockWeights.sort((a, b) => a.date.localeCompare(b.date));
    }

    mockDashboard.currentWeight = weight;

    return fetchWithFallback<WeightLogData>(
      `${API_BASE_URL}/weights`,
      {
        method: "POST",
        body: JSON.stringify({ weight, date: targetDate }),
      },
      newLog
    );
  },

  async getAiReview(date: string): Promise<AiReviewData> {
    const todayLog = mockDailyLogs[date];
    const fallbackPoints: string[] = [];

    if (!todayLog || !todayLog.sleepCompleted) {
      fallbackPoints.push("Matikan layar 30 menit sebelum jam tidur (22:00) untuk mempermudah recovery harian.");
    }
    if (!todayLog || !todayLog.waterCompleted) {
      fallbackPoints.push("Minum 500ml air putih begitu bangun tidur untuk memicu pembakaran kalori alami.");
    }
    if (!todayLog || !todayLog.proteinCompleted) {
      fallbackPoints.push("Pastikan porsi dada ayam / telur ditambah saat makan malam agar otot terlindungi.");
    }
    if (!todayLog || !todayLog.noSnack) {
      fallbackPoints.push("Singkirkan stok snack manis di meja kerja agar tidak tergoda craving saat kerja.");
    }
    if (!todayLog || !todayLog.workout) {
      fallbackPoints.push("Lakukan jalan santai 15 menit paska makan siang untuk mengontrol gula darah.");
    }

    if (fallbackPoints.length === 0) {
      fallbackPoints.push("Semua habit tercapai sempurna hari ini! Konsistensi 100% terjaga.");
      fallbackPoints.push("Pertahankan waktu tidur disiplin untuk memaksimalkan metabolisme tubuh.");
    }

    const fallback: AiReviewData = {
      date,
      actionablePoints: fallbackPoints.slice(0, 5),
      rawSummary: fallbackPoints.slice(0, 5).join("\n"),
    };

    return fetchWithFallback<AiReviewData>(
      `${API_BASE_URL}/ai/review`,
      {
        method: "POST",
        body: JSON.stringify({ date }),
      },
      fallback
    );
  },

  async getSettings(): Promise<UserSettingsData> {
    return fetchWithFallback<UserSettingsData>(`${API_BASE_URL}/settings`, undefined, mockSettings);
  },

  async saveSettings(settings: UserSettingsData): Promise<UserSettingsData> {
    mockSettings = { ...settings };
    mockDashboard.targetWeight = settings.targetWeight;
    mockDashboard.currentWeight = settings.currentWeight;

    return fetchWithFallback<UserSettingsData>(
      `${API_BASE_URL}/settings`,
      {
        method: "POST",
        body: JSON.stringify(settings),
      },
      mockSettings
    );
  },
};
