import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { countCompleted } from '@/lib/stats'

const DEFAULT_DAILY = {
  workout: false, ifCompleted: false, proteinCompleted: false,
  waterCompleted: false, sleepCompleted: false, noSnack: false, notes: null,
}

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const log = await prisma.dailyLog.findUnique({ where: { userId_date: { userId, date } } })
  if (!log) return NextResponse.json({ id: 0, userId, date, ...DEFAULT_DAILY, completedCount: 0 })
  return NextResponse.json({ ...log, completedCount: countCompleted(log) })
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const input = (await req.json()) as { date: string; workout?: boolean; ifCompleted?: boolean; proteinCompleted?: boolean; waterCompleted?: boolean; sleepCompleted?: boolean; noSnack?: boolean; notes?: string | null }
  if (!input.date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const saved = await prisma.dailyLog.upsert({
    where: { userId_date: { userId, date: input.date } },
    update: {
      workout: input.workout ?? false, ifCompleted: input.ifCompleted ?? false,
      proteinCompleted: input.proteinCompleted ?? false, waterCompleted: input.waterCompleted ?? false,
      sleepCompleted: input.sleepCompleted ?? false, noSnack: input.noSnack ?? false, notes: input.notes ?? null,
    },
    create: {
      userId, date: input.date,
      workout: input.workout ?? false, ifCompleted: input.ifCompleted ?? false,
      proteinCompleted: input.proteinCompleted ?? false, waterCompleted: input.waterCompleted ?? false,
      sleepCompleted: input.sleepCompleted ?? false, noSnack: input.noSnack ?? false, notes: input.notes ?? null,
    },
  })
  return NextResponse.json({ ...saved, completedCount: countCompleted(saved) })
}