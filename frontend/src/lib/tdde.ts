export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very";
export type Goal = "cut" | "bulk";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
};

export function ageFromBirthdate(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

// Mifflin-St Jeor
export function calcBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "female" ? base - 161 : base + 5);
}

export function calcCaloriePlan(opts: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number | null;
  activity: ActivityLevel;
  goal: Goal;
}): { bmr: number; tdee: number; target: number } {
  if (opts.age == null || opts.age < 10 || opts.weightKg <= 0 || opts.heightCm <= 0) {
    return { bmr: 0, tdee: 0, target: 0 };
  }
  const bmr = calcBmr(opts.sex, opts.weightKg, opts.heightCm, opts.age);
  const tdee = Math.round(bmr * (ACTIVITY_FACTORS[opts.activity] ?? 1.2));
  // cut: defisit ~500 kcal/hari (≈0.5 kg/minggu), tapi jangan turun di bawah BMR (batas aman).
  const target = opts.goal === "cut" ? Math.max(bmr, tdee - 500) : tdee + 300;
  return { bmr, tdee, target };
}
