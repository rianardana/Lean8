import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { callGemini } from '@/lib/gemini'
import { stripMarkdown, stripEmoji } from '@/lib/text'
import { countCompleted } from '@/lib/stats'
import { wibDate } from '@/lib/time'

export async function GET() {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dates: string[] = []
  for (let i = 6; i >= 0; i--) dates.push(wibDate(new Date(Date.now() - i * 86400000)))
  const from = dates[0]
  const to = dates[6]

  const [user, weights, logs, workouts, fasts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.weightLog.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.dailyLog.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.workoutLog.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.fast.findMany({ where: { userId, startedAt: { gte: new Date(Date.now() - 6 * 86400000) } } }),
  ])

  const isBulk = user?.goal === 'bulk'
  const target = user?.targetWeight ?? 65
  const current = weights.length ? weights[weights.length - 1].weight : (user?.currentWeight ?? 86)

  const weekWeights = weights.filter((w) => w.date >= from && w.date <= to)
  const firstW = weekWeights.length ? weekWeights[0].weight : (weights[0]?.weight ?? current)
  const lastW = weekWeights.length ? weekWeights[weekWeights.length - 1].weight : current
  const delta = Math.round((lastW - firstW) * 10) / 10

  const consistency = logs.length
    ? Math.round((logs.reduce((s, l) => s + countCompleted(l), 0) / (logs.length * 6)) * 100)
    : 0
  const activeDays = logs.filter((l) => countCompleted(l) > 0).length
  const workoutCount = workouts.length
  const workoutMinutes = workouts.reduce((s, w) => s + w.minutes, 0)
  const fastCount = fasts.length
  const avgFastHours = fasts.length ? Math.round((fasts.reduce((s, f) => s + f.planHours, 0) / fasts.length) * 10) / 10 : 0

  const dataBlock = `
Rentang: ${from} s/d ${to}
Goal: ${isBulk ? 'BULKING (naik otot)' : 'CUTTING (turun berat/lean)'}
Berat: ${firstW} -> ${lastW} kg (${delta >= 0 ? '+' : ''}${delta} kg) | Target: ${target} kg
Konsistensi habit: ${consistency}% (${activeDays}/7 hari aktif)
Workout: ${workoutCount} sesi, ${workoutMinutes} menit total
Puasa (IF): ${fastCount} sesi, rata-rata ${avgFastHours} jam
`

  const prompt = `Kamu Lean Mode Coach, personal coach nutrisi & fitness yang hangat, jujur, dan memotivasi.

TUGAS: Tulis rekap mingguan singkat (7 hari terakhir) untuk user, berdasarkan DATA di bawah. Fokus ke apa yang udah dicapai + 2-3 rekomendasi konkret untuk minggu depan.

ATURAN:
- Grounded ke data: sebut angka spesifik (konsistensi, workout, puasa, tren berat), bukan pujian kosong.
- Hormati goal: CUTTING = fokus turun berat/lean; BULKING = fokus naik otot.
- Kalau ada metrik 0/kosong, jangan pura-pura prestasi — dorong user untuk mulai.
- Bahasa Indonesia casual, hangat, to-the-point. Format: 3-5 poin pendek, tiap poin diawali "•", tanpa markdown lain. JANGAN pakai emoji sama sekali.

=== DATA MINGGU INI ===
${dataBlock}=== END DATA ===

Tulis rekapnya:`

  const gem = await callGemini({ contents: [{ parts: [{ text: prompt }] }] })
  let recap = ''

  if (gem.ok && gem.res) {
    const data = await gem.res.json()
    recap = stripEmoji(
      stripMarkdown(
        (data.candidates?.[0]?.content?.parts ?? [])
          .filter((p: { text?: string }) => p.text)
          .map((p: { text?: string }) => p.text)
          .join('')
          .trim()
      )
    )
  }

  if (!recap) {
    recap = `• Konsistensi habit minggu ini ${consistency}% (${activeDays}/7 hari aktif).\n• ${workoutCount} sesi workout (${workoutMinutes} menit), ${fastCount} sesi puasa (rata-rata ${avgFastHours} jam).\n• Berat ${delta >= 0 ? `naik ${delta} kg` : `turun ${Math.abs(delta)} kg`} (${firstW} → ${lastW} kg).\n• Pertahankan ritmenya minggu depan — konsistensi kecil tiap hari yang bikin beda.`
  }

  return NextResponse.json({
    rangeStart: from,
    rangeEnd: to,
    recap,
    stats: { consistency, activeDays, workoutCount, workoutMinutes, fastCount, avgFastHours },
  })
}
