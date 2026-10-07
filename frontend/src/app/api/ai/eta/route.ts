import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { callGemini } from '@/lib/gemini'
import { stripMarkdown } from '@/lib/text'
import { countCompleted } from '@/lib/stats'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtId(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${BULAN[m - 1]} ${y}`
}

// kg/minggu dari trend log berat (indeks = hari, sama kaya calcEta di dashboard).
function weeklyRate(weights: { weight: number }[]): number {
  const n = weights.length
  if (n < 2) return 0
  let sx = 0, sy = 0, sxy = 0, sxx = 0
  weights.forEach((w, i) => { sx += i; sy += w.weight; sxy += i * w.weight; sxx += i * i })
  const denom = n * sxx - sx * sx
  if (denom === 0) return 0
  return ((n * sxy - sx * sy) / denom) * 7
}

const FLAGS = ['workout', 'ifCompleted', 'proteinCompleted', 'waterCompleted', 'sleepCompleted', 'noSnack'] as const
const HABIT_LABEL: Record<string, string> = {
  workout: 'latihan', ifCompleted: 'fasting', proteinCompleted: 'protein',
  waterCompleted: 'air', sleepCompleted: 'tidur', noSnack: 'no snack',
}

export async function GET() {
  const userId = await getSessionUserId()
  if (userId == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = todayISO()
  const [user, weights, logs7, workouts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.weightLog.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.dailyLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 7 }),
    prisma.workoutLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 14 }),
  ])

  const target = user?.targetWeight ?? 65
  const current = weights.length ? weights[weights.length - 1].weight : (user?.currentWeight ?? 86)
  const isBulk = user?.goal === 'bulk'
  const remaining = Math.abs(target - current)

  // Belum cukup data → jangan buang panggilan AI.
  if (weights.length < 3) {
    return NextResponse.json({
      date: today,
      insight: 'Belum cukup data berat untuk prediksi. Timbang badanmu 2–3 kali lagi (mingguan) dan aku bisa kasih estimasi tanggal capai target.',
    })
  }

  const rate = weeklyRate(weights.slice(-8))
  const towardTarget = isBulk ? rate > 0 : rate < 0
  const consistency = logs7.length
    ? Math.round((logs7.reduce((s, l) => s + countCompleted(l), 0) / (logs7.length * 6)) * 100)
    : 0

  // Habit yang masih bolong (completion < 60% dari 7 hari terakhir).
  const completion: Record<string, number> = {}
  for (const f of FLAGS) {
    const done = logs7.filter((l) => l[f]).length
    completion[f] = Math.round((done / Math.max(1, logs7.length)) * 100)
  }
  const lagging = FLAGS.filter((f) => completion[f] < 60)
    .map((f) => `${HABIT_LABEL[f]} ${completion[f]}%`)

  // Dua skenario tanggal, dihitung deterministik.
  let dateA: string | null = null
  let dateB: string | null = null
  if (towardTarget && Math.abs(rate) > 0.05 && remaining > 0) {
    const weeks = remaining / Math.abs(rate)
    dateA = addDays(today, Math.round(weeks * 7))
    const factor = Math.max(0.35, consistency / 100)
    dateB = addDays(today, Math.round((weeks / factor) * 7))
  }

  const workoutPerWeek = Math.round((workouts.length / 2) * 10) / 10

  const dataBlock = `
=== DATA PREDIKSI TARGET ===
Nama: ${user?.name ?? 'User'}
Goal: ${isBulk ? 'BULKING (naik berat/otot)' : 'CUTTING (turun berat/lean)'}
Berat sekarang: ${current} kg | Target: ${target} kg | Sisa: ${remaining} kg
Tren berat: ${rate > 0 ? '+' : ''}${Math.round(rate * 100) / 100} kg/minggu ${towardTarget ? '(menuju target)' : '(berlawanan arah target)'}
Konsistensi habit 7 hari: ${consistency}%
Habit yang masih bolong: ${lagging.length ? lagging.join(', ') : 'tidak ada, semua di atas 60%'}
Rata-rata latihan: ${workoutPerWeek}x/minggu
Estimasi tanggal:
- Kalau pace sekarang dipertahankan: ${dateA ? fmtId(dateA) : 'belum bisa dihitung (tren belum cukup/melawan arah)'}
- Kalau bagian yang bolong tidak diperbaiki: ${dateB ? fmtId(dateB) : 'belum bisa dihitung'}
=== END DATA ===
`

  const prompt = `Kamu Lean Mode Coach, personal coach nutrisi & fitness yang hangat dan jujur.

TUGAS: Tulis INSIGHT prediksi target berdasarkan DATA di bawah. Sampaikan sebagai 1 paragraf pendek yang mengalir (bukan list).

ATURAN:
- Buka dengan prediksi realistis: kalau pace sekarang dipertahankan, target ${target} kg kira-kira tercapai ${dateA ? `sekitar ${fmtId(dateA)}` : 'belum bisa dipastikan karena tren belum terbentuk/berlawanan arah'}.
- Lalu sebutkan skenario mundur: kalau habit yang bolong (${lagging.length ? lagging.join(', ') : 'yang sedang tidak konsisten'}) tidak diperbaiki, bisa mundur ${dateB ? `ke sekitar ${fmtId(dateB)}` : 'lebih lama lagi'}.
- Sebut spesifik 1-2 habit yang paling ngefek ke target dan kenapa.
- JANGAN generik, JANGAN motivasi kosong. Pakai angka dari data.
- Hormati goal: kalau BULKING jangan suruh defisit, kalau CUTTING jangan suruh surplus.
- Kalau tren berlawanan arah, jujur bilang dan arahkan.
- Bahasa Indonesia casual, to-the-point, emoji 1-2 aja. Tanpa markdown (tanpa ** atau *). Maksimal 4 kalimat.

${dataBlock}

Sekarang tulis insight prediksi targetnya:`

  const gem = await callGemini({ contents: [{ parts: [{ text: prompt }] }] })
  let insight = ''

  if (gem.ok && gem.res) {
    const data = await gem.res.json()
    insight = stripMarkdown(
      (data.candidates?.[0]?.content?.parts ?? [])
        .filter((p: { text?: string }) => p.text)
        .map((p: { text?: string }) => p.text)
        .join('')
        .trim()
    )
  }

  // Fallback deterministik kalau AI gagal.
  if (!insight) {
    const a = dateA ? `sekitar ${fmtId(dateA)}` : 'belum bisa dipastikan'
    const b = dateB ? `mundur ke sekitar ${fmtId(dateB)}` : 'makin lama'
    insight = `Dengan pace ${Math.abs(Math.round(rate * 100) / 100)} kg/minggu, target ${target} kg bisa tercapai ${a}. Tapi kalau ${lagging.length ? lagging.join(', ') : 'konsistensimu'} nggak diperbaiki, bisa ${b}.`
  }

  return NextResponse.json({ date: today, insight })
}
