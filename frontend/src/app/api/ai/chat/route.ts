import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { callGemini } from '@/lib/gemini'
import { stripMarkdown } from '@/lib/text'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { messages } = (await req.json()) as {
    messages: { role: 'user' | 'assistant'; content: string }[]
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  const [user, todayLog, todayMeals, weights, logs7] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.dailyLog.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
    prisma.mealLog.findMany({ where: { userId, date: todayKey() }, orderBy: { createdAt: 'asc' } }),
    prisma.weightLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 8 }),
    prisma.dailyLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 7 }),
  ])

  let workoutStreakMissed = 0
  for (const l of logs7) {
    if (!l.workout) workoutStreakMissed++
    else break
  }
  const workoutDays7 = logs7.filter((l) => l.workout).length
  const isBulk = user?.goal === 'bulk'
  const hourNow = new Date().getHours()
  const partOfDay = hourNow < 11 ? 'pagi' : hourNow < 15 ? 'siang' : hourNow < 19 ? 'sore' : 'malam'
  const timeNow = `${String(hourNow).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')} (${partOfDay})`
  const newUser = logs7.length === 0
  const rekapBlock = newUser
    ? 'User BARU — belum ada history minggu ini.'
    : `- Hari workout: ${workoutDays7}/${logs7.length}\n- Streak tanpa workout di akhir: ${workoutStreakMissed} hari berturut-turut`

  const latestW = weights[0]?.weight
  const weekAgoW = weights[weights.length - 1]?.weight
  const weightDelta = latestW && weekAgoW ? Math.round((latestW - weekAgoW) * 10) / 10 : null

  const kcalToday = todayMeals.reduce((s, m) => s + m.calories, 0)
  const proteinToday = todayMeals.reduce((s, m) => s + m.protein, 0)
  const mealsSummary = todayMeals.length
    ? todayMeals.map((m) => `${m.foodName} (${m.calories}kcal)`).join(', ')
    : 'belum ada makanan tercatat hari ini'

  const contextBlock = `
=== KONTEKS USER ===
Nama: ${user?.name ?? 'User'}
Goal: ${isBulk ? 'BULKING (naik berat/otot)' : 'CUTTING (turun berat/lean)'}
Berat sekarang: ${latestW ?? user?.currentWeight ?? '?'} kg
Target berat: ${user?.targetWeight ?? '?'} kg
Tinggi: ${user?.heightCm ?? '?'} cm
Target protein: ${user?.proteinTargetGrams ?? '?'} g/hari

Waktu sekarang: ${timeNow}
Makanan hari ini: ${mealsSummary}
Total kalori hari ini: ${Math.round(kcalToday)} kcal
Protein masuk hari ini: ${Math.round(proteinToday)} g
Tren berat 7 hari: ${weightDelta === null ? 'data belum cukup' : `${weightDelta > 0 ? '+' : ''}${weightDelta} kg`}

Daily log hari ini:
- Workout: ${todayLog?.workout ? '✅' : '❌'}
- ${isBulk ? 'Kalori surplus' : 'Fasting'}: ${todayLog?.ifCompleted ? '✅' : '❌'}
- Protein target: ${todayLog?.proteinCompleted ? '✅' : '❌'}
- Air 2.5L+: ${todayLog?.waterCompleted ? '✅' : '❌'}
- Tidur 7-8 jam: ${todayLog?.sleepCompleted ? '✅' : '❌'}
- ${isBulk ? 'Snack tambahan' : 'No junk food'}: ${todayLog?.noSnack ? '✅' : '❌'}

Rekap 7 hari terakhir:
${rekapBlock}
${todayLog?.notes ? `Catatan user: ${todayLog.notes}` : ''}
=== END KONTEKS ===
`

  const systemPrompt = `Kamu adalah Lean Mode Coach, ahli nutrisi & diet personal berbasis di Indonesia.

SCOPE (HANYA jawab ini): nutrisi, kalori, masakan Indonesia, diet, IF, exercise, sleep, habit, progress.
DI LUAR SCOPE (TOLAK SOPAN): politik, agama, diagnosa medis serius, pertanyaan personal tentang AI.
STYLE: Bahasa Indonesia casual, to-the-point, pakai konteks user, actionable, max 3-4 kalimat, tanpa markdown (no ** atau *).

PENTING:
- Hormati Goal user: BULKING jangan suruh defisit/puas, CUTTING jangan suruh surplus.
- Perhatikan Waktu sekarang. Kalau masih pagi/siang, jangan simpulkan user kurang makan/kalori — hari belum selesai.
- Kalau user BARU (belum ada history), jangan vonis "seminggu buruk".

${contextBlock}

Ingat: kamu ahli nutrisi & diet, bukan general chatbot.`

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Siap, saya Lean Mode Coach. Saya hanya akan menjawab pertanyaan seputar nutrisi, diet, exercise, dan kesehatan. Apa yang bisa saya bantu?' }] },
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
  ]

  const gem = await callGemini({ contents })

  if (!gem.ok || !gem.res) {
    return NextResponse.json({ error: 'AI failed', detail: gem.detail }, { status: 502 })
  }

  const data = await gem.res.json()
  const reply: string = stripMarkdown(data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Maaf, saya tidak bisa menjawab itu.')
  return NextResponse.json({ reply })
}