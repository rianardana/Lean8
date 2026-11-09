import { prisma } from "@/lib/prisma";
import { countCompleted } from "@/lib/stats";
import { wibNow, wibWeekStart, addDaysYmd, ymd } from "@/lib/time";

export type WeeklyTargetConfigShape = {
  weekStart: string;
  workoutSessions: number;
  fastSessions: number;
  fastMinHours: number;
  activeDays: number;
};

export function normalizeTargetConfig(input: Partial<WeeklyTargetConfigShape> & { weekStart?: string }): WeeklyTargetConfigShape {
  const clamp = (n: unknown, max = 14) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));
  return {
    weekStart: input.weekStart && /^\d{4}-\d{2}-\d{2}$/.test(input.weekStart) ? input.weekStart : wibWeekStart(),
    workoutSessions: clamp(input.workoutSessions, 21),
    fastSessions: clamp(input.fastSessions, 14),
    fastMinHours: Math.max(1, Math.min(48, Math.round(Number(input.fastMinHours) || 16))),
    activeDays: clamp(input.activeDays, 7),
  };
}

function weekWindow(weekStart: string) {
  const weekEnd = addDaysYmd(weekStart, 6);
  // Minggu berjalan: jangan hitung melewati "hari ini" (WIB)
  const today = ymd(wibNow());
  const to = weekEnd > today ? today : weekEnd;
  return { weekStart, weekEnd, to };
}

export async function getWeeklyTargetData(userId: number, weekStartInput?: string) {
  const weekStart = weekStartInput && /^\d{4}-\d{2}-\d{2}$/.test(weekStartInput) ? weekStartInput : wibWeekStart();
  const { weekEnd, to } = weekWindow(weekStart);

  const [target, user, workouts, fasts, logs] = await Promise.all([
    prisma.weeklyTarget.findUnique({ where: { userId_weekStart: { userId, weekStart } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { weeklyReminderEnabled: true } }),
    prisma.workoutLog.findMany({ where: { userId, date: { gte: weekStart, lte: to } }, select: { id: true } }),
    prisma.fast.findMany({
      where: {
        userId,
        endedAt: { not: null, gte: new Date(weekStart + "T00:00:00Z"), lte: new Date(addDaysYmd(to, 1) + "T00:00:00Z") },
      },
      select: { startedAt: true, endedAt: true, planHours: true },
    }),
    prisma.dailyLog.findMany({
      where: { userId, date: { gte: weekStart, lte: to } },
      select: { date: true, workout: true, ifCompleted: true, proteinCompleted: true, waterCompleted: true, sleepCompleted: true, noSnack: true },
    }),
  ]);

  const config: WeeklyTargetConfigShape = normalizeTargetConfig({
    weekStart,
    workoutSessions: target?.workoutSessions ?? 0,
    fastSessions: target?.fastSessions ?? 0,
    fastMinHours: target?.fastMinHours ?? 16,
    activeDays: target?.activeDays ?? 0,
  });

  const workoutCount = workouts.length;
  const fastCount = fasts.filter((f) => {
    if (!f.endedAt) return false;
    const hours = (f.endedAt.getTime() - f.startedAt.getTime()) / 3600000;
    return hours >= config.fastMinHours - 0.01; // toleransi pembulatan menit
  }).length;
  const activeDaysCount = logs.filter((l) => countCompleted(l) > 0).length;

  const progress = (
    [
      config.workoutSessions > 0
        ? {
            key: "workout" as const,
            label: "Workout",
            detail: `${workoutCount}/${config.workoutSessions} sesi`,
            target: config.workoutSessions,
            current: workoutCount,
            done: workoutCount >= config.workoutSessions,
          }
        : null,
      config.fastSessions > 0
        ? {
            key: "fast" as const,
            label: "Puasa",
            detail: `${fastCount}/${config.fastSessions} sesi · ≥${config.fastMinHours} jam`,
            target: config.fastSessions,
            current: fastCount,
            done: fastCount >= config.fastSessions,
          }
        : null,
      config.activeDays > 0
        ? {
            key: "activeDays" as const,
            label: "Hari aktif",
            detail: `${activeDaysCount}/${config.activeDays} hari`,
            target: config.activeDays,
            current: activeDaysCount,
            done: activeDaysCount >= config.activeDays,
          }
        : null,
    ] as const
  ).filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    weekStart,
    weekEnd,
    config,
    progress,
    reminderEnabled: !!user?.weeklyReminderEnabled,
  };
}

export async function upsertWeeklyTarget(userId: number, input: Record<string, unknown>) {
  const config = normalizeTargetConfig(input as Partial<WeeklyTargetConfigShape>);
  const data = {
    workoutSessions: config.workoutSessions,
    fastSessions: config.fastSessions,
    fastMinHours: config.fastMinHours,
    activeDays: config.activeDays,
  };
  return prisma.weeklyTarget.upsert({
    where: { userId_weekStart: { userId, weekStart: config.weekStart } },
    update: data,
    create: { userId, weekStart: config.weekStart, ...data },
  });
}
