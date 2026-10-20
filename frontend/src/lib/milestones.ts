export interface Milestone {
  id: string;
  title: string;
  desc: string;
}

const STREAK_STEPS = [3, 7, 14, 30, 60];
const DAYS_STEPS = [7, 30, 60, 90];
const WEIGHT_STEP = 5; // kg

export function computeMilestones(
  streak: number,
  activeDays: number,
  currentWeight: number,
  startingWeight: number,
  targetWeight: number,
  goal: "cut" | "bulk"
): Milestone[] {
  const out: Milestone[] = [];
  for (const s of STREAK_STEPS) {
    if (streak >= s) out.push({ id: `streak-${s}`, title: `${s} Hari Streak!`, desc: "Konsisten tanpa putus, identitas lean makin kuat." });
  }
  const total = Math.abs(targetWeight - startingWeight);
  const done = Math.abs(currentWeight - startingWeight);
  const verb = goal === "bulk" ? "Naik" : "Turun";
  for (let kg = WEIGHT_STEP; kg <= total; kg += WEIGHT_STEP) {
    if (done >= kg) out.push({ id: `weight-${kg}`, title: `${verb} ${kg} kg!`, desc: `${done.toFixed(1)} kg dari total ${total.toFixed(0)} kg menuju target.` });
  }
  for (const d of DAYS_STEPS) {
    if (activeDays >= d) out.push({ id: `days-${d}`, title: `${d} Hari Aktif!`, desc: `${d} hari mencatat, kebiasaan mulai terbentuk.` });
  }
  return out;
}
