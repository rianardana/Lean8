import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { addDaysYmd, wibDate, wibWeekStart } from '@/lib/time'
import { getWeeklyTargetData } from '@/lib/weekly-target'
import { awardXp } from '@/lib/xp'

type DailyHabitKey = 'workout' | 'ifCompleted' | 'proteinCompleted' | 'waterCompleted' | 'sleepCompleted' | 'noSnack'

type Quest = {
  id: string
  title: string
  description: string
  current: number
  target: number
  rewardXp: number
  completed: boolean
  claimed: boolean
}

const HABITS: { key: DailyHabitKey; title: string }[] = [
  { key: 'workout', title: 'Gerak hari ini' },
  { key: 'ifCompleted', title: 'Ikuti target nutrisi hari ini' },
  { key: 'proteinCompleted', title: 'Penuhi target protein' },
  { key: 'waterCompleted', title: 'Penuhi target air putih' },
  { key: 'sleepCompleted', title: 'Jaga waktu tidur' },
  { key: 'noSnack', title: 'Ikuti rencana snack hari ini' },
]

async function getQuests(userId: number) {
  const today = wibDate()
  const weekStart = wibWeekStart()
  const [user, recentLogs, todayLog, weekly] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { goal: true } }),
    prisma.dailyLog.findMany({
      where: { userId, date: { gte: addDaysYmd(today, -7), lt: today } },
      select: { workout: true, ifCompleted: true, proteinCompleted: true, waterCompleted: true, sleepCompleted: true, noSnack: true },
    }),
    prisma.dailyLog.findUnique({ where: { userId_date: { userId, date: today } } }),
    getWeeklyTargetData(userId, weekStart),
  ])

  const habitChoices = user?.goal === 'bulk'
    ? HABITS.map((habit) => habit.key === 'ifCompleted'
      ? { ...habit, title: 'Capai surplus kalori terencana' }
      : habit)
    : HABITS.map((habit) => habit.key === 'ifCompleted'
      ? { ...habit, title: 'Ikuti jendela puasa terencana' }
      : habit)

  let dailyTitle = 'Selesaikan 3 habit hari ini'
  let dailyDescription = 'Bangun momentum dengan menyelesaikan tiga kebiasaan pilihanmu.'
  let dailyCurrent = todayLog
    ? [todayLog.workout, todayLog.ifCompleted, todayLog.proteinCompleted, todayLog.waterCompleted, todayLog.sleepCompleted, todayLog.noSnack].filter(Boolean).length
    : 0
  let dailyTarget = 3

  if (recentLogs.length >= 3) {
    const weakestHabit = habitChoices
      .map((habit, index) => ({
        ...habit,
        index,
        completions: recentLogs.filter((log) => log[habit.key]).length,
      }))
      .sort((a, b) => a.completions - b.completions || a.index - b.index)[0]
    dailyTitle = weakestHabit.title
    dailyDescription = 'Habit ini paling jarang tercapai dalam catatanmu belakangan ini.'
    dailyCurrent = Number(Boolean(todayLog?.[weakestHabit.key]))
    dailyTarget = 1
  }

  const dailyQuest: Quest = {
    id: `daily:${today}`,
    title: dailyTitle,
    description: dailyDescription,
    current: dailyCurrent,
    target: dailyTarget,
    rewardXp: 10,
    completed: dailyCurrent >= dailyTarget,
    claimed: false,
  }

  let weeklyQuests: Quest[]
  if (weekly.progress.length === 0) {
    const workoutCount = await prisma.workoutLog.count({ where: { userId, date: { gte: weekStart, lte: today } } })
    weeklyQuests = [{
      id: `weekly:${weekStart}:workout`,
      title: 'Gerak 3 kali minggu ini',
      description: 'Catat tiga sesi workout atau aktivitas gerak minggu ini.',
      current: workoutCount,
      target: 3,
      rewardXp: 30,
      completed: workoutCount >= 3,
      claimed: false,
    }]
  } else {
    weeklyQuests = weekly.progress.map((item) => ({
      id: `weekly:${weekStart}:${item.key}`,
      title: item.key === 'workout'
        ? `Selesaikan ${item.target} sesi workout`
        : item.key === 'fast'
          ? `Ikuti target ${item.target} sesi puasa`
          : `Aktif selama ${item.target} hari`,
      description: item.key === 'fast'
        ? `Ikuti rencana yang dipasang (minimal ${weekly.config.fastMinHours} jam per sesi).`
        : item.key === 'workout'
          ? 'Kumpulkan sesi latihan sepanjang minggu ini.'
          : 'Catat setidaknya satu habit pada hari tersebut.',
      current: item.current,
      target: item.target,
      rewardXp: 20,
      completed: item.done,
      claimed: false,
    }))
  }

  const allQuests = [dailyQuest, ...weeklyQuests]
  const claims = await prisma.xpEvent.findMany({
    where: { userId, kind: 'quest', refKey: { in: allQuests.map((quest) => `quest:${quest.id}`) } },
    select: { refKey: true },
  })
  const claimedKeys = new Set(claims.map((claim) => claim.refKey))
  for (const quest of allQuests) quest.claimed = claimedKeys.has(`quest:${quest.id}`)

  return { date: today, weekStart, daily: dailyQuest, weekly: weeklyQuests }
}

export async function GET() {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await getQuests(userId))
  } catch (err) {
    console.error('quests GET failed:', err)
    return NextResponse.json({ error: 'Failed to load quests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const input = await req.json().catch(() => ({})) as { id?: unknown }
  if (typeof input.id !== 'string') return NextResponse.json({ error: 'Quest id required' }, { status: 400 })

  try {
    const data = await getQuests(userId)
    const quest = [data.daily, ...data.weekly].find((item) => item.id === input.id)
    if (!quest) return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    if (!quest.completed) return NextResponse.json({ error: 'Quest belum selesai' }, { status: 409 })

    const xpGained = quest.claimed ? 0 : await awardXp(userId, 'quest', `quest:${quest.id}`, quest.rewardXp)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } })
    return NextResponse.json({
      ok: true,
      claimed: true,
      xpGained,
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
    })
  } catch (err) {
    console.error('quests POST failed:', err)
    return NextResponse.json({ error: 'Failed to claim quest' }, { status: 500 })
  }
}
