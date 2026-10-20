import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { wibDate } from '@/lib/time'

export async function GET() {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const list = await prisma.bodyMeasurement.findMany({ where: { userId }, orderBy: { date: 'desc' } })
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const input = (await req.json()) as { date?: string; waist?: number | null; chest?: number | null; arm?: number | null; thigh?: number | null }
  const date = input.date || wibDate()
  const data = {
    waist: input.waist ?? null,
    chest: input.chest ?? null,
    arm: input.arm ?? null,
    thigh: input.thigh ?? null,
  }
  const m = await prisma.bodyMeasurement.upsert({
    where: { userId_date: { userId, date } },
    update: data,
    create: { userId, date, ...data },
  })
  return NextResponse.json(m)
}
