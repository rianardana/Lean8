import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/weight  → semua weight log (terurut)
export async function GET() {
  const logs = await prisma.weightLog.findMany({ orderBy: { date: 'asc' } })
  return NextResponse.json(logs)
}

// POST /api/weight  { date, weight }
export async function POST(req: NextRequest) {
  const { date, weight } = await req.json()
  if (!date || weight == null) return NextResponse.json({ error: 'date & weight required' }, { status: 400 })

  const saved = await prisma.weightLog.upsert({
    where: { date },
    update: { weight },
    create: { date, weight },
  })
  return NextResponse.json(saved)
}