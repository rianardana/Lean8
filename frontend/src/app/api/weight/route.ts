import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get('userId') ?? 1)
  const logs = await prisma.weightLog.findMany({ where: { userId }, orderBy: { date: 'asc' } })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get('userId') ?? 1)
  const { date, weight } = (await req.json()) as { date: string; weight: number }
  if (!date || weight == null) return NextResponse.json({ error: 'date & weight required' }, { status: 400 })

  const saved = await prisma.weightLog.upsert({
    where: { userId_date: { userId, date } },
    update: { weight },
    create: { userId, date, weight },
  })
  return NextResponse.json(saved)
}