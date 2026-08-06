import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_USER = {
  name: 'Lean8 User',
  heightCm: 175,
  currentWeight: 86,
  targetWeight: 65,
  workoutTime: '07:00',
  sleepTime: '22:00',
  proteinTargetGrams: 120,
}

// GET /api/user — selalu balik object (auto-create kalau belum ada)
export async function GET() {
  let user = await prisma.user.findUnique({ where: { id: 1 } })

  if (!user) {
    user = await prisma.user.create({ data: { id: 1, ...DEFAULT_USER } })
  }

  return NextResponse.json(user)
}

// POST /api/user — update setting
export async function POST(req: NextRequest) {
  const input = (await req.json()) as Partial<typeof DEFAULT_USER>

  const user = await prisma.user.upsert({
    where: { id: 1 },
    update: input,
    create: { id: 1, ...DEFAULT_USER, ...input },
  })

  return NextResponse.json(user)
}