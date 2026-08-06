import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/user
export async function GET() {
  const user = await prisma.user.findUnique({ where: { id: 1 } })
  return NextResponse.json(user)
}

// POST /api/user  (update profile/target)
export async function POST(req: NextRequest) {
  const input = await req.json()
  const user = await prisma.user.upsert({
    where: { id: 1 },
    update: input,
    create: { id: 1, ...input },
  })
  return NextResponse.json(user)
}