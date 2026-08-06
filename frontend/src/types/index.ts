export interface DashboardData {
  currentWeight: number;
  targetWeight: number;
  startingWeight: number;
  progressPercentage: number;
  activeDays: number;
  userHandshakeName: string;
}

export interface DailyLogData {
  id?: number;
  date: string;
  workout: boolean;
  ifCompleted: boolean;
  proteinCompleted: boolean;
  waterCompleted: boolean;
  sleepCompleted: boolean;
  noSnack: boolean;
  notes?: string | null;
  completedCount?: number;
}

export interface WeightLogData {
  id?: number;
  date: string;
  weight: number;
}

export interface UserSettingsData {
  name: string;
  heightCm: number;
  currentWeight: number;
  targetWeight: number;
  workoutTime?: string;
  sleepTime?: string;
  proteinTargetGrams: number;
}

export interface AiReviewData {
  date: string;
  actionablePoints: string[];
  rawSummary: string;
}
