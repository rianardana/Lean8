import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { countCompleted } from '@/lib/stats'
import { addDaysYmd, wibDate } from '@/lib/time'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = wibDate()
  const startDate = addDaysYmd(today, -29)
  const endExclusive = addDaysYmd(today, 1)
  const startAt = new Date(`${startDate}T00:00:00+07:00`)
  const endAt = new Date(`${endExclusive}T00:00:00+07:00`)

  try {
    const [dailyLogs, weights, workouts, meals, fasts, measurements, photos] = await Promise.all([
      prisma.dailyLog.findMany({
        where: { userId, date: { gte: startDate, lte: today } },
        select: { date: true, workout: true, ifCompleted: true, proteinCompleted: true, waterCompleted: true, sleepCompleted: true, noSnack: true },
      }),
      prisma.weightLog.findMany({ where: { userId, date: { gte: startDate, lte: today } }, select: { date: true, weight: true } }),
      prisma.workoutLog.findMany({ where: { userId, date: { gte: startDate, lte: today } }, select: { date: true } }),
      prisma.mealLog.findMany({ where: { userId, date: { gte: startDate, lte: today } }, select: { date: true } }),
      prisma.fast.findMany({
        where: { userId, endedAt: { gte: startAt, lt: endAt } },
        select: { endedAt: true },
      }),
      prisma.bodyMeasurement.findMany({ where: { userId, date: { gte: startDate, lte: today } }, select: { date: true } }),
      prisma.progressPhoto.findMany({ where: { userId, date: { gte: startDate, lte: today } }, select: { date: true } }),
    ])

    const byDate = new Map<string, {
      date: string
      hasHabitLog: boolean
      habitCount: number
      habits: { workout: boolean; ifCompleted: boolean; proteinCompleted: boolean; waterCompleted: boolean; sleepCompleted: boolean; noSnack: boolean } | null
      weight: number | null
      workoutCount: number
      mealCount: number
      fastCount: number
      hasMeasurement: boolean
      photoCount: number
    }>()

    for (let offset = 0; offset < 30; offset++) {
      const date = addDaysYmd(startDate, offset)
      byDate.set(date, {
        date, hasHabitLog: false, habitCount: 0, habits: null, weight: null,
        workoutCount: 0, mealCount: 0, fastCount: 0, hasMeasurement: false, photoCount: 0,
      })
    }

    for (const log of dailyLogs) {
      const day = byDate.get(log.date)
      if (!day) continue
      day.hasHabitLog = true
      day.habitCount = countCompleted(log)
      day.habits = {
        workout: log.workout,
        ifCompleted: log.ifCompleted,
        proteinCompleted: log.proteinCompleted,
        waterCompleted: log.waterCompleted,
        sleepCompleted: log.sleepCompleted,
        noSnack: log.noSnack,
      }
    }
    for (const log of weights) {
      const day = byDate.get(log.date)
      if (day) day.weight = log.weight
    }
    for (const log of workouts) {
      const day = byDate.get(log.date)
      if (day) day.workoutCount++
    }
    for (const log of meals) {
      const day = byDate.get(log.date)
      if (day) day.mealCount++
    }
    for (const fast of fasts) {
      if (!fast.endedAt) continue
      const day = byDate.get(wibDate(fast.endedAt))
      if (day) day.fastCount++
    }
    for (const measurement of measurements) {
      const day = byDate.get(measurement.date)
      if (day) day.hasMeasurement = true
    }
    for (const photo of photos) {
      const day = byDate.get(photo.date)
      if (day) day.photoCount++
    }

    return NextResponse.json({ startDate, endDate: today, days: Array.from(byDate.values()) })
  } catch (err) {
    console.error('progress-calendar GET failed:', err)
    return NextResponse.json({ error: 'Failed to load progress calendar' }, { status: 500 })
  }
}
