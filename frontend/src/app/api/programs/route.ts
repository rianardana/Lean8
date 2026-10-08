import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'

// ProgramEnrollment: user "ikut" program, track hari ke berapa.
// currentDay = hari yang sedang/selanjutnya dikerjakan (1-7), done = selesai.

export async function GET() {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const enrollments = await prisma.programEnrollment.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } })
  return NextResponse.json(enrollments)
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { programId, variant } = (await req.json()) as { programId: string; variant: string }
  if (!programId || !variant) return NextResponse.json({ error: 'programId & variant required' }, { status: 400 })

  const enrollment = await prisma.programEnrollment.upsert({
    where: { userId_programId_variant: { userId, programId, variant } },
    update: {},
    create: { userId, programId, variant },
  })
  return NextResponse.json(enrollment)
}

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { programId, variant } = (await req.json()) as { programId: string; variant: string }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId_programId_variant: { userId, programId, variant } },
  })
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 404 })

  const updated = await prisma.programEnrollment.update({
    where: { id: enrollment.id },
    data: enrollment.currentDay >= 7 ? { done: true } : { currentDay: enrollment.currentDay + 1 },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const programId = req.nextUrl.searchParams.get('programId')
  const variant = req.nextUrl.searchParams.get('variant')
  if (!programId || !variant) return NextResponse.json({ error: 'programId & variant required' }, { status: 400 })

  await prisma.programEnrollment.deleteMany({ where: { userId, programId, variant } })
  return NextResponse.json({ ok: true })
}
