import {
  DashboardData,
  DailyLogData,
  WeightLogData,
  UserSettingsData,
  AiReviewData,
} from "@/types";

// Sekarang semua lewat Next.js API routes (Prisma -> Neon), satu domain.
// Gak perlu API_BASE_URL / mock lagi.

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${url} failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // ---- Dashboard: gabungin user + weight + daily hari ini ----
  async getDashboard(): Promise<DashboardData> {
    const data = await request<{
      user: { name: string; currentWeight: number; targetWeight: number; initialWeight: number };
      stats: {
        currentWeight: number; targetWeight: number; startingWeight?: number;
        progressPercent: number; dayNumber: number;
      };
    }>("/api/dashboard");

    return {
      currentWeight: data.stats.currentWeight,
      targetWeight: data.stats.targetWeight,
      startingWeight: data.user.initialWeight,
      progressPercentage: data.stats.progressPercent,
      activeDays: data.stats.dayNumber,
      userHandshakeName: data.user.name,
    };
  },

  // ---- Daily log ----
  async getDaily(date: string): Promise<DailyLogData> {
    return request<DailyLogData>(`/api/daily?date=${date}`);
  },

  async saveDaily(log: DailyLogData): Promise<DailyLogData> {
    return request<DailyLogData>("/api/daily", {
      method: "POST",
      body: JSON.stringify(log),
    });
  },

  // ---- Weight ----
  async getWeights(): Promise<WeightLogData[]> {
    return request<WeightLogData[]>("/api/weight");
  },

  async logWeight(weight: number, date?: string): Promise<WeightLogData> {
    const targetDate = date || new Date().toISOString().split("T")[0];
    return request<WeightLogData>("/api/weight", {
      method: "POST",
      body: JSON.stringify({ weight, date: targetDate }),
    });
  },

  // ---- Settings / User ----
  async getSettings(): Promise<UserSettingsData> {
    const user = await request<UserSettingsData>("/api/user");
    return user;
  },

  async saveSettings(settings: UserSettingsData): Promise<UserSettingsData> {
    return request<UserSettingsData>("/api/user", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  },

  // ---- AI Review (sementara tetap client-side logic, gak butuh DB) ----
  async getAiReview(date: string): Promise<AiReviewData> {
    const todayLog = await this.getDaily(date).catch(() => null);
    const points: string[] = [];

    if (!todayLog || !todayLog.sleepCompleted) points.push("Matikan layar 30 menit sebelum jam tidur (22:00) untuk mempermudah recovery harian.");
    if (!todayLog || !todayLog.waterCompleted) points.push("Minum 500ml air putih begitu bangun tidur untuk memicu pembakaran kalori alami.");
    if (!todayLog || !todayLog.proteinCompleted) points.push("Pastikan porsi dada ayam / telur ditambah saat makan malam agar otot terlindungi.");
    if (!todayLog || !todayLog.noSnack) points.push("Singkirkan stok snack manis di meja kerja agar tidak tergoda craving saat kerja.");
    if (!todayLog || !todayLog.workout) points.push("Lakukan jalan santai 15 menit paska makan siang untuk mengontrol gula darah.");

    if (points.length === 0) {
      points.push("Semua habit tercapai sempurna hari ini! Konsistensi 100% terjaga.");
      points.push("Pertahankan waktu tidur disiplin untuk memaksimalkan metabolisme tubuh.");
    }

    return {
      date,
      actionablePoints: points.slice(0, 5),
      rawSummary: points.slice(0, 5).join("\n"),
    };
  },
};