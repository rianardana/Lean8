import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { wibDate, wibNow } from '@/lib/time'

function diffDays(a: string, b: string) {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000)
}

function calcEta(weights: { weight: number }[], target: number): { etaDays: number; etaDate: string } | null {
  if (weights.length < 2) return null
  const n = weights.length
  let sx = 0, sy = 0, sxy = 0, sxx = 0
  weights.forEach((w, i) => { sx += i; sy += w.weight; sxy += i * w.weight; sxx += i * i })
  const denom = n * sxx - sx * sx
  if (denom === 0) return null
  const slope = (n * sxy - sx * sy) / denom // kg per log, positif = naik, negatif = turun
  if (Math.abs(slope) < 1e-9) return null
  const etaDays = Math.round((target - weights[n - 1].weight) / slope)
  if (etaDays <= 0) return null
  const d = wibNow()
  d.setDate(d.getDate() + etaDays)
  return { etaDays, etaDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
}

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user, todayLog, weightLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.dailyLog.findUnique({ where: { userId_date: { userId, date: wibDate() } } }),
    prisma.weightLog.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
  ])

  const initialWeight = user?.currentWeight ?? 86
  const targetWeight = user?.targetWeight ?? 65
  const latestWeight = weightLogs.length ? weightLogs[weightLogs.length - 1].weight : initialWeight
  const goalDelta = targetWeight - initialWeight // + = naik (bulk), - = turun (cut)
  const achieved = latestWeight - initialWeight
  const progressPercent = goalDelta !== 0 ? Math.min(100, Math.max(0, Math.round((achieved / goalDelta) * 1000) / 10)) : 0
  const dayNumber = weightLogs.length ? diffDays(weightLogs[0].date, wibDate()) + 1 : 1
  const completedCount = todayLog ? [todayLog.workout, todayLog.ifCompleted, todayLog.proteinCompleted, todayLog.waterCompleted, todayLog.sleepCompleted, todayLog.noSnack].filter(Boolean).length : 0
  const eta = calcEta(weightLogs, targetWeight)

  return NextResponse.json({
    user: {
      name: user?.name ?? 'User',
      heightCm: user?.heightCm ?? 175, currentWeight: latestWeight, targetWeight, initialWeight,
      workoutTime: user?.workoutTime ?? '07:00', sleepTime: user?.sleepTime ?? '22:00', proteinTargetGrams: user?.proteinTargetGrams ?? 120,
      goal: user?.goal ?? 'cut',
    },
    stats: { currentWeight: latestWeight, targetWeight, initialWeight, remainingKg: Math.round(Math.abs(targetWeight - latestWeight) * 10) / 10, kgChange: Math.round(achieved * 10) / 10, progressPercent, dayNumber, completedToday: completedCount, hasTodayLog: !!todayLog, eta },
    weightLogs,
    todayLog: todayLog ?? null,
  })
}