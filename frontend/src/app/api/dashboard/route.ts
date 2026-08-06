import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Get or seed default single user
    let user = await prisma.user.findUnique({
      where: { id: 1 },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 1,
          name: "Lean8 User",
          heightCm: 175,
          currentWeight: 86,
          targetWeight: 65,
          workoutTime: "07:00",
          sleepTime: "22:00",
          proteinTargetGrams: 120,
        },
      });
    }

    // 2. Fetch weight logs for progress & starting weight
    const latestWeightLog = await prisma.weightLog.findFirst({
      orderBy: { date: "desc" },
    });

    const firstWeightLog = await prisma.weightLog.findFirst({
      orderBy: { date: "asc" },
    });

    const currentWeight = latestWeightLog?.weight ?? user.currentWeight;
    const startingWeight = firstWeightLog?.weight ?? 86.0;
    const targetWeight = user.targetWeight;

    // 3. Calculate progress percentage (86 -> 65kg goal)
    let progressPercentage = 0;
    const totalToLose = startingWeight - targetWeight;
    if (totalToLose > 0) {
      const lost = startingWeight - currentWeight;
      progressPercentage = Math.min(100, Math.max(0, Math.round((lost / totalToLose) * 1000) / 10));
    }

    // 4. Count active days
    const activeDailyLogs = await prisma.dailyLog.count();
    const activeWeightLogs = await prisma.weightLog.count();
    const activeDays = Math.max(1, activeDailyLogs || activeWeightLogs || 1);

    return NextResponse.json({
      currentWeight,
      targetWeight,
      startingWeight,
      progressPercentage,
      activeDays,
      userHandshakeName: user.name,
    });
  } catch {
    // Graceful fallback if database connection is pending env configuration
    return NextResponse.json({
      currentWeight: 86.0,
      targetWeight: 65.0,
      startingWeight: 86.0,
      progressPercentage: 0,
      activeDays: 1,
      userHandshakeName: "Lean8 User",
    });
  }
}
