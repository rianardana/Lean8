import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MODEL = 'gemini-3.5-flash'

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

  // --- FETCH USER CONTEXT (buat personalized advice) ---
  const [user, todayLog, latestWeight] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.dailyLog.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
    prisma.weightLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
  ])

  const contextBlock = `
=== KONTEKS USER (gunakan untuk jawaban personalized) ===
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

TUGAS UTAMA:
Bantu user mencapai target berat badan & membangun habit sehat konsisten.

SCOPE JAWABAN (HANYA jawab ini):
- Nutrisi & kalori makanan (khususnya masakan Indonesia)
- Diet, defisit kalori, intermittent fasting
- Exercise, strength training, recovery
- Sleep quality & lifestyle sehat
- Progress tracking & habit building
- Motivasi berbasis data (bukan motivasi kosong)

DI LUAR SCOPE (TOLAK SOPAN):
- Politik, agama, gosip, cuaca
- Saran medis serius (diagnosa penyakit, dosis obat)
- Pertanyaan personal tentang kamu sebagai AI
- Topik yang gak relevan dengan kesehatan/fitness

STYLE KOMUNIKASI:
- Bahasa Indonesia casual & to-the-point
- Pakai data user (konteks di atas) buat saran yang relevan
- Kasih actionable advice, bukan teori doang
- Jujur kalau user lagi off-track, tapi tetap supportive
- Jawaban maksimal 3-4 kalimat, jangan panjang lebar

${contextBlock}

Ingat: Kamu ahli nutrisi & diet, bukan general chatbot. Stay on topic.`

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Siap, saya Lean8 Coach. Saya hanya akan menjawab pertanyaan seputar nutrisi, diet, exercise, dan kesehatan. Apa yang bisa saya bantu?' }] },
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    }
  )

  if (!res.ok) {
  const detail = await res.text()
  console.error('GEMINI ERROR:', res.status, detail)
  return NextResponse.json({ error: 'AI failed', detail, status: res.status }, { status: 502 })
}

  const data = await res.json()
  const reply: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Maaf, saya tidak bisa menjawab itu.'
  return NextResponse.json({ reply })
}