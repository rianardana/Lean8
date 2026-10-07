export interface DashboardData {
  currentWeight: number;
  targetWeight: number;
  startingWeight: number;
  progressPercentage: number;
  activeDays: number;
  heightCm: number;
  goal: "cut" | "bulk";
  etaDays?: number | null;
  etaDate?: string | null;
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
  goal?: "cut" | "bulk";
}

export interface AiReviewData {
  date: string;
  actionablePoints: string[];
  rawSummary: string;
}

export interface FoodItemData {
  id?: number; name: string; serving: string;
  calories: number; protein: number; carbs: number; fat: number;
}
export interface MealLogData {
  id?: number; date: string; mealType: string; foodName: string; quantity: number;
  calories: number; protein: number; carbs: number; fat: number;
}

export interface WorkoutLogData {
  id?: number;
  date: string;
  name: string;
  type: string;
  minutes: number;
  kcal: number;
}

export interface FastData {
  id: number;
  startedAt: string;
  endedAt?: string | null;
  planHours: number;
}

export interface EtaInsightData {
  date: string;
  insight: string;
}
