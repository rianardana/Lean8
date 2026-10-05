import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'

// MET (intensitas) per tipe aktivitas
const MET: Record<string, number> = {
  gym: 5,
  calisthenics: 6,
  jalan: 3.5,
  lari: 8,
  sepeda: 7.5,
  renang: 7,
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const date = req.nextUrl.searchParams.get('date') || todayKey()
  const logs = await prisma.workoutLog.findMany({ where: { userId, date }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const input = (await req.json()) as { name: string; type: string; minutes: number; date?: string }
  if (!input.name || !input.minutes || input.minutes <= 0) {
    return NextResponse.json({ error: 'name & minutes required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const weight = user?.currentWeight ?? 86
  const met = MET[input.type] ?? 5
  const kcal = Math.round(met * weight * (input.minutes / 60))
  const date = input.date || todayKey()

  const log = await prisma.workoutLog.create({
    data: { userId, date, name: input.name, type: input.type, minutes: input.minutes, kcal },
  })
  return NextResponse.json(log)
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(req.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.workoutLog.deleteMany({ where: { id, userId } })
  return NextResponse.json({ ok: true })
}
