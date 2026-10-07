import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { wibDate } from '@/lib/time'

const clampPlan = (n?: number) => Math.min(72, Math.max(4, Math.round(n || 16)))

// Auto-centang habit IF hari ini (hanya saat mode cut, karena di bulk "ifCompleted" berarti surplus).
async function markIfToday(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.goal !== 'cut') return
  const date = wibDate()
  await prisma.dailyLog.upsert({
    where: { userId_date: { userId, date } },
    update: { ifCompleted: true },
    create: { userId, date, ifCompleted: true },
  })
}

export async function GET() {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const active = await prisma.fast.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: 'desc' },
  })
  const history = await prisma.fast.findMany({
    where: { userId, endedAt: { not: null } },
    orderBy: { startedAt: 'desc' },
  })
  return NextResponse.json({ active, history })
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const input = (await req.json()) as {
    action: string; id?: number; startedAt?: string; endedAt?: string; planHours?: number
  }

  if (input.action === 'start') {
    const planHours = clampPlan(input.planHours)
    const startedAt = input.startedAt ? new Date(input.startedAt) : new Date()
    if (isNaN(startedAt.getTime())) return NextResponse.json({ error: 'invalid startedAt' }, { status: 400 })
    await prisma.fast.updateMany({ where: { userId, endedAt: null }, data: { endedAt: new Date() } })
    const fast = await prisma.fast.create({ data: { userId, startedAt, planHours } })
    await markIfToday(userId)
    return NextResponse.json(fast)
  }

  if (input.action === 'edit') {
    if (!input.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const data: { startedAt?: Date; planHours?: number } = {}
    if (input.startedAt) {
      const d = new Date(input.startedAt)
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'invalid startedAt' }, { status: 400 })
      data.startedAt = d
    }
    if (input.planHours) data.planHours = clampPlan(input.planHours)
    const fast = await prisma.fast.update({ where: { id: input.id }, data })
    return NextResponse.json(fast)
  }

  if (input.action === 'log') {
    const startedAt = new Date(input.startedAt || '')
    const endedAt = new Date(input.endedAt || '')
    if (isNaN(startedAt.getTime()) || isNaN(endedAt.getTime())) {
      return NextResponse.json({ error: 'startedAt & endedAt required' }, { status: 400 })
    }
    if (endedAt.getTime() <= startedAt.getTime()) {
      return NextResponse.json({ error: 'endedAt must be after startedAt' }, { status: 400 })
    }
    const planHours = input.planHours
      ? clampPlan(input.planHours)
      : clampPlan(Math.round((endedAt.getTime() - startedAt.getTime()) / 3600000))
    const fast = await prisma.fast.create({ data: { userId, startedAt, endedAt, planHours } })
    if (wibDate(endedAt) === wibDate()) await markIfToday(userId)
    return NextResponse.json(fast)
  }

  // end
  const active = await prisma.fast.findFirst({ where: { userId, endedAt: null }, orderBy: { startedAt: 'desc' } })
  if (!active) return NextResponse.json({ error: 'No active fast' }, { status: 400 })
  const endedAt = input.endedAt ? new Date(input.endedAt) : new Date()
  if (isNaN(endedAt.getTime())) return NextResponse.json({ error: 'invalid endedAt' }, { status: 400 })
  if (endedAt.getTime() <= active.startedAt.getTime()) return NextResponse.json({ error: 'endedAt must be after startedAt' }, { status: 400 })
  const fast = await prisma.fast.update({ where: { id: active.id }, data: { endedAt } })
  await markIfToday(userId)
  return NextResponse.json(fast)
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(req.nextUrl.searchParams.get('id'))
  await prisma.fast.deleteMany({ where: { id, userId } })
  return NextResponse.json({ ok: true })
}
