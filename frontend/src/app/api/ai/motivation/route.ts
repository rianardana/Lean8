import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { callGemini } from '@/lib/gemini'
import { stripMarkdown } from '@/lib/text'
import { countCompleted } from '@/lib/stats'
import { wibDate } from '@/lib/time'

export async function GET() {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = wibDate()
  const [user, weights, logs7] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.weightLog.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.dailyLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 7 }),
  ])

  const target = user?.targetWeight ?? 65
  const current = weights.length ? weights[weights.length - 1].weight : (user?.currentWeight ?? 86)
  const isBulk = user?.goal === 'bulk'
  const remaining = Math.round(Math.abs(target - current) * 10) / 10
  const consistency = logs7.length
    ? Math.round((logs7.reduce((s, l) => s + countCompleted(l), 0) / (logs7.length * 6)) * 100)
    : 0
  const activeDays = logs7.filter((l) => countCompleted(l) > 0).length

  const dataBlock = `
=== DATA USER ===
Nama: ${user?.name ?? 'User'}
Goal: ${isBulk ? 'BULKING (naik berat/otot)' : 'CUTTING (turun berat/lean)'}
Berat sekarang: ${current} kg | Target: ${target} kg | Sisa menuju target: ${remaining} kg
Konsistensi habit 7 hari: ${consistency}%
Hari aktif 7 hari: ${activeDays} hari
=== END DATA ===
`

  const prompt = `Kamu Lean Mode Coach, personal coach nutrisi & fitness yang hangat, jujur, dan memotivasi.

TUGAS: Tulis motivasi harian singkat tentang pentingnya hidup sehat dan konsistensi, dipersonalisasi dari DATA di bawah. Yakinkan user bahwa dia akan sampai ke tujuannya.

ATURAN:
- Grounded ke data: sebut angka spesifiknya (sisa ${remaining} kg, konsistensi ${consistency}%, hari aktif ${activeDays}), bukan pujian kosong.
- Sentuh kenapa hidup sehat itu berharga (energi, disiplin, masa depan, tubuh yang dia impikan), tanpa menggurui.
- Hormati goal: CUTTING = semangat jadi lean/turun; BULKING = semangat naik otot/kuat.
- JANGAN motivasi kosong ("semangat! kamu pasti bisa" tanpa dasar). Pakai datanya sebagai alasan.
- Bahasa Indonesia casual, hangat, to-the-point. Maksimal 2 kalimat. Emoji 1 aja. Tanpa markdown.

${dataBlock}

Sekarang tulis motivasinya:`

  const gem = await callGemini({ contents: [{ parts: [{ text: prompt }] }] })
  let message = ''

  if (gem.ok && gem.res) {
    const data = await gem.res.json()
    message = stripMarkdown(
      (data.candidates?.[0]?.content?.parts ?? [])
        .filter((p: { text?: string }) => p.text)
        .map((p: { text?: string }) => p.text)
        .join('')
        .trim()
    )
  }

  // Fallback deterministik kalau AI gagal / kena rate-limit.
  if (!message) {
    message = `${user?.name ?? 'Kamu'}, kamu tinggal ${remaining} kg dari target ${target} kg — dan konsistensi ${consistency}% minggu ini bukan kebetulan. Hidup sehat itu investasi paling jujur: tiap hari kecil yang kamu jaga, pelan-pelan membentuk versi terbaikmu.`
  }

  return NextResponse.json({ date: today, message })
}
