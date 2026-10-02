import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const date = req.nextUrl.searchParams.get('date')
  const meals = await prisma.mealLog.findMany({
    where: { userId, ...(date ? { date } : {}) },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(meals)
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const input = (await req.json()) as {
    date: string; mealType: string; foodName: string; quantity?: number
    calories: number; protein: number; carbs: number; fat: number
  }
  const saved = await prisma.mealLog.create({
    data: { userId, quantity: 1, ...input },
  })
  return NextResponse.json(saved)
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(req.nextUrl.searchParams.get('id'))
  await prisma.mealLog.deleteMany({ where: { id, userId } })
  return NextResponse.json({ ok: true })
}