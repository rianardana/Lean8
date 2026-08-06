import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/dashboard
 * Menggabungkan data User + WeightLog + DailyLog hari ini
 * untuk kebutuhan DashboardView (menggantikan endpoint ASP.NET lama).
 */
export async function GET() {
  // Ambil semua data yang dibutuhin dashboard dalam 1 kali jalan
  const [user, todayLog, weightLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: 1 } }),
    prisma.dailyLog.findUnique({ where: { date: todayKey() } }),
    prisma.weightLog.findMany({ orderBy: { date: 'asc' } }),
  ])

  // --- User (pakai default kalau belum ada record di Neon) ---
  const initialWeight = user?.currentWeight ?? 86
  const targetWeight = user?.targetWeight ?? 65

  // --- Berat sekarang = entri WeightLog terbaru, fallback ke user.currentWeight ---
  const latestWeight = weightLogs.length > 0
    ? weightLogs[weightLogs.length - 1].weight
    : initialWeight

  // --- Progress Goal (%) ---
  const totalToLose = initialWeight - targetWeight
  const lostSoFar = initialWeight - latestWeight
  const progressPercent = totalToLose > 0
    ? Math.round((lostSoFar / totalToLose) * 1000) / 10   // 1 desimal
    : 0

  // --- Hari ke- (streak): hitung dari WeightLog pertama sampai hari ini ---
  const dayNumber = weightLogs.length > 0
    ? diffDays(weightLogs[0].date, todayKey()) + 1
    : 1

  // --- Daily log hari ini (buat card "Isi Daily Checklist") ---
  const completedCount = todayLog
    ? [
        todayLog.workout, todayLog.ifCompleted, todayLog.proteinCompleted,
        todayLog.waterCompleted, todayLog.sleepCompleted, todayLog.noSnack,
      ].filter(Boolean).length
    : 0

  return NextResponse.json({
    user: {
      name: user?.name ?? 'Lean8 User',
      heightCm: user?.heightCm ?? 175,
      currentWeight: latestWeight,
      targetWeight,
      initialWeight,
      workoutTime: user?.workoutTime ?? '07:00',
      sleepTime: user?.sleepTime ?? '22:00',
      proteinTargetGrams: user?.proteinTargetGrams ?? 120,
    },
    stats: {
      currentWeight: latestWeight,
      targetWeight,
      initialWeight,
      remainingKg: Math.round((targetWeight - latestWeight) * 10) / 10,
      lostKg: Math.round(lostSoFar * 10) / 10,
      progressPercent,
      dayNumber,
      completedToday: completedCount,
      hasTodayLog: !!todayLog,
    },
    weightLogs,
    todayLog: todayLog ?? null,
  })
}

// ---- helpers ----

// format tanggal lokal YYYY-MM-DD (sesuai format kolom `date` di schema)
function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// selisih hari antara dua key YYYY-MM-DD
function diffDays(fromKey: string, toKey: string): number {
  const from = new Date(fromKey + 'T00:00:00')
  const to = new Date(toKey + 'T00:00:00')
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}