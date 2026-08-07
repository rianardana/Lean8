import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { callGemini } from '@/lib/gemini'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const { messages, userId = 1 } = (await req.json()) as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    userId?: number
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  const [user, todayLog, latestWeight] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.dailyLog.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
    prisma.weightLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
  ])

  const contextBlock = `
=== KONTEKS USER ===
Nama: ${user?.name ?? 'User'}
Berat sekarang: ${latestWeight?.weight ?? user?.currentWeight ?? '?'} kg
Target berat: ${user?.targetWeight ?? '?'} kg
Tinggi: ${user?.heightCm ?? '?'} cm
Target protein: ${user?.proteinTargetGrams ?? '?'} g/hari

Daily log hari ini:
- Workout: ${todayLog?.workout ? '✅' : '❌'}
- Fasting: ${todayLog?.ifCompleted ? '✅' : '❌'}
- Protein target: ${todayLog?.proteinCompleted ? '✅' : '❌'}
- Air 2.5L+: ${todayLog?.waterCompleted ? '✅' : '❌'}
- Tidur 7-8 jam: ${todayLog?.sleepCompleted ? '✅' : '❌'}
- No junk food: ${todayLog?.noSnack ? '✅' : '❌'}
${todayLog?.notes ? `Catatan user: ${todayLog.notes}` : ''}
=== END KONTEKS ===
`

  const systemPrompt = `Kamu adalah Lean8 Coach, ahli nutrisi & diet personal berbasis di Indonesia.

SCOPE (HANYA jawab ini): nutrisi, kalori, masakan Indonesia, diet, IF, exercise, sleep, habit, progress.
DI LUAR SCOPE (TOLAK SOPAN): politik, agama, diagnosa medis serius, pertanyaan personal tentang AI.
STYLE: Bahasa Indonesia casual, to-the-point, pakai konteks user, actionable, max 3-4 kalimat.

${contextBlock}

Ingat: kamu ahli nutrisi & diet, bukan general chatbot.`

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Siap, saya Lean8 Coach. Saya hanya akan menjawab pertanyaan seputar nutrisi, diet, exercise, dan kesehatan. Apa yang bisa saya bantu?' }] },
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
  const reply: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Maaf, saya tidak bisa menjawab itu.'
  return NextResponse.json({ reply })
}