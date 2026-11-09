import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'

const ALLOWED: (keyof Prisma.UserUpdateInput)[] = [
  'name',
  'heightCm',
  'currentWeight',
  'targetWeight',
  'sex',
  'birthdate',
  'activityLevel',
  'workoutTime',
  'sleepTime',
  'proteinTargetGrams',
  'calorieTarget',
  'goal',
  'onboardingCompleted',
  'fitnessExperience',
  'workoutFrequency',
  'weeklyReminderEnabled',
  'fastReminderEnabled',
  'workoutReminderEnabled',
  'sleepReminderEnabled',
]

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return NextResponse.json(user)
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const input = (await req.json()) as Record<string, unknown>
  const data: Prisma.UserUpdateInput = {}
  for (const k of ALLOWED) {
    if (k in input) (data as Record<string, unknown>)[k] = input[k]
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  const user = await prisma.user.update({ where: { id: userId }, data })
  return NextResponse.json(user)
}