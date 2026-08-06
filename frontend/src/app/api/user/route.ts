import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get('userId') ?? 1)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return NextResponse.json(user)
}

export async function POST(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get('userId') ?? 1)
  const input = (await req.json()) as Record<string, unknown>
  const user = await prisma.user.update({ where: { id: userId }, data: input })
  return NextResponse.json(user)
}