import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { DailyLog } from '@prisma/client'

const DEFAULT_DAILY = {
  workout: false,
  ifCompleted: false,
  proteinCompleted: false,
  waterCompleted: false,
  sleepCompleted: false,
  noSnack: false,
  notes: null,
}

function countCompleted(log: DailyLog) {
  return [
    log.workout, log.ifCompleted, log.proteinCompleted,
    log.waterCompleted, log.sleepCompleted, log.noSnack,
  ].filter(Boolean).length
}

// GET /api/daily?date=2026-08-06
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const log = await prisma.dailyLog.findUnique({ where: { date } })

  if (!log) {
    return NextResponse.json({
      id: 0, date, ...DEFAULT_DAILY, completedCount: 0,
    })
  }

  return NextResponse.json({ ...log, completedCount: countCompleted(log) })
}

// POST /api/daily  (upsert)
export async function POST(req: NextRequest) {
  const input = await req.json()
  if (!input.date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const saved = await prisma.dailyLog.upsert({
    where: { date: input.date },
    update: {
      workout: input.workout ?? false,
      ifCompleted: input.ifCompleted ?? false,
      proteinCompleted: input.proteinCompleted ?? false,
      waterCompleted: input.waterCompleted ?? false,
      sleepCompleted: input.sleepCompleted ?? false,
      noSnack: input.noSnack ?? false,
      notes: input.notes ?? null,
    },
    create: {
      date: input.date,
      workout: input.workout ?? false,
      ifCompleted: input.ifCompleted ?? false,
      proteinCompleted: input.proteinCompleted ?? false,
      waterCompleted: input.waterCompleted ?? false,
      sleepCompleted: input.sleepCompleted ?? false,
      noSnack: input.noSnack ?? false,
      notes: input.notes ?? null,
    },
  })

  return NextResponse.json({ ...saved, completedCount: countCompleted(saved) })
}