import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { callGemini } from '@/lib/gemini'

function dateKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const { userId = 1 } = (await req.json()) as { userId?: number }
  const today = dateKey(0)

  // --- KUMPULIN DATA REAL USER ---
  const [user, todayLog, todayMeals, weights, logs7] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.dailyLog.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.mealLog.findMany({ where: { userId, date: today }, orderBy: { createdAt: 'asc' } }),
    prisma.weightLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 8 }),
    prisma.dailyLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 7 }),
  ])

  // Streak: berapa hari berturut workout TERAKHIR terlewatkan
  let workoutStreakMissed = 0
  for (const l of logs7) {
    if (!l.workout) workoutStreakMissed++
    else break
  }
  const workoutDays7 = logs7.filter((l) => l.workout).length

  // Tren berat
  const latestW = weights[0]?.weight
  const weekAgoW = weights[weights.length - 1]?.weight
  const weightDelta = latestW && weekAgoW ? Math.round((latestW - weekAgoW) * 10) / 10 : null

  // Kalori & protein hari ini
  const kcalToday = todayMeals.reduce((s, m) => s + m.calories, 0)
  const proteinToday = todayMeals.reduce((s, m) => s + m.protein, 0)
  const mealsSummary = todayMeals.length
    ? todayMeals.map((m) => `${m.foodName} (${m.calories}kcal)`).join(', ')
    : 'belum ada makanan tercatat hari ini'

  const dataBlock = `
=== DATA USER HARI INI (${today}) ===
Nama: ${user?.name ?? 'User'}
Berat sekarang: ${latestW ?? user?.currentWeight ?? '?'} kg | Target: ${user?.targetWeight ?? '?'} kg | Tinggi: ${user?.heightCm ?? '?'} cm
Target protein: ${user?.proteinTargetGrams ?? '?'} g/hari

Makanan hari ini: ${mealsSummary}
Total kalori hari ini: ${Math.round(kcalToday)} kcal
Protein masuk hari ini: ${Math.round(proteinToday)} g

Tren berat 7 hari: ${weightDelta === null ? 'data belum cukup' : `${weightDelta > 0 ? '+' : ''}${weightDelta} kg`}

Habit hari ini:
- Workout: ${todayLog?.workout ? '✅' : '❌'}
- Fasting: ${todayLog?.ifCompleted ? '✅' : '❌'}
- Protein target: ${todayLog?.proteinCompleted ? '✅' : '❌'}
- Air 2.5L+: ${todayLog?.waterCompleted ? '✅' : '❌'}
- Tidur 7-8 jam: ${todayLog?.sleepCompleted ? '✅' : '❌'}
- No junk food: ${todayLog?.noSnack ? '✅' : '❌'}

Rekap 7 hari terakhir:
- Hari workout: ${workoutDays7}/7
- Streak tanpa workout di akhir: ${workoutStreakMissed} hari berturut-turut
=== END DATA ===
`

  const prompt = `Kamu Lean8 Coach, personal coach nutrisi & fitness yang hangat dan jujur.

TUGAS: Beri review harian PERSONAL berdasarkan DATA USER di bawah. Bicara NATURAL seperti coach sungguhan yang merhatiin keseharian user — sebutkan hal spesifik yang dia lakukan (misal makanan yang dia makan, berapa hari gak workout, tren beratnya). JANGAN generik, JANGAN motivasi kosong.

ATURAN:
- Buka dengan observasi spesifik dari datanya (max 2 kalimat).
- Lalu 3-4 saran praktis & actionable yang nyambung sama kondisinya hari ini.
- Kalau ada yang bagus, puji singkat. Kalau off-track, tegur halus tapi supportive.
- Bahasa Indonesia casual, to-the-point, pakai emoji secukupnya (1-2 aja).
- Total jawaban max 6 kalimat. Jangan pakai bullet/list, tulis paragraf mengalir.

${dataBlock}

Sekarang beri review harian untuk ${user?.name ?? 'user'}:`

  const gem = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
  })

  if (!gem.ok || !gem.res) {
    return NextResponse.json({ error: 'AI failed', detail: gem.detail }, { status: 502 })
  }

  const data = await gem.res.json()
  const review: string = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((p: { text?: string }) => p.text)
    .map((p: { text?: string }) => p.text)
    .join('')
    .trim()

  return NextResponse.json({ date: today, review: review || 'Gagal memuat review, coba lagi ya.' })
}