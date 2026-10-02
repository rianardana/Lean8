import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { countCompleted } from '@/lib/stats'

const DAYS = 84

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function key(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export async function GET() {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const from = new Date()
  from.setDate(from.getDate() - (DAYS - 1))

  const logs = await prisma.dailyLog.findMany({
    where: { userId, date: { gte: key(from) } },
    select: {
      date: true, workout: true, ifCompleted: true, proteinCompleted: true,
      waterCompleted: true, sleepCompleted: true, noSnack: true,
    },
  })

  const byDate = new Map(logs.map((l) => [l.date, countCompleted(l)]))

  const days: { date: string; count: number }[] = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const k = key(d)
    days.push({ date: k, count: byDate.get(k) ?? 0 })
  }

  // Streak: hari berturut dengan count >= 4, berakhir hari ini (atau kemarin jika hari ini belum diisi).
  let streak = 0
  for (let i = DAYS - 1; i >= 0; i--) {
    const c = days[i].count
    if (c >= 4) streak++
    else if (i === DAYS - 1 && c === 0) continue // hari ini belum diisi
    else break
  }

  return NextResponse.json({ streak, days })
}
