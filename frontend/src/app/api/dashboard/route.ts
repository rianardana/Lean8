import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function diffDays(a: string, b: string) {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000)
}

export async function GET(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get('userId') ?? 1)

  const [user, todayLog, weightLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.dailyLog.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
    prisma.weightLog.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
  ])

  const initialWeight = user?.currentWeight ?? 86
  const targetWeight = user?.targetWeight ?? 65
  const latestWeight = weightLogs.length ? weightLogs[weightLogs.length - 1].weight : initialWeight
  const totalToLose = initialWeight - targetWeight
  const lostSoFar = initialWeight - latestWeight
  const progressPercent = totalToLose > 0 ? Math.round((lostSoFar / totalToLose) * 1000) / 10 : 0
  const dayNumber = weightLogs.length ? diffDays(weightLogs[0].date, todayKey()) + 1 : 1
  const completedCount = todayLog ? [todayLog.workout, todayLog.ifCompleted, todayLog.proteinCompleted, todayLog.waterCompleted, todayLog.sleepCompleted, todayLog.noSnack].filter(Boolean).length : 0

  return NextResponse.json({
    user: {
      name: user?.name ?? (userId === 1 ? 'Rian' : 'Wahyu'),
      heightCm: user?.heightCm ?? 175, currentWeight: latestWeight, targetWeight, initialWeight,
      workoutTime: user?.workoutTime ?? '07:00', sleepTime: user?.sleepTime ?? '22:00', proteinTargetGrams: user?.proteinTargetGrams ?? 120,
    },
    stats: { currentWeight: latestWeight, targetWeight, initialWeight, remainingKg: Math.round((targetWeight - latestWeight) * 10) / 10, lostKg: Math.round(lostSoFar * 10) / 10, progressPercent, dayNumber, completedToday: completedCount, hasTodayLog: !!todayLog },
    weightLogs,
    todayLog: todayLog ?? null,
  })
}