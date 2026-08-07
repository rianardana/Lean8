import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { callGemini } from '@/lib/gemini'

const MAX_PHOTO_PER_DAY = 100

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const { image, userId = 1 } = (await req.json()) as { image: string; userId?: number }
  if (!image) return NextResponse.json({ error: 'image required' }, { status: 400 })

  const used = await prisma.mealLog.count({
    where: { userId, date: todayKey(), foodName: { startsWith: '📸' } },
  })
  if (used >= MAX_PHOTO_PER_DAY) {
    return NextResponse.json(
      { error: `Limit foto hari ini habis (${MAX_PHOTO_PER_DAY}/${MAX_PHOTO_PER_DAY}). Pakai input manual dulu ya!` },
      { status: 429 }
    )
  }

  const base64 = image.split(',')[1] ?? image

  const gem = await callGemini({
    contents: [{
      parts: [
        { text: 'Kamu ahli gizi spesialis masakan Indonesia. Analisa foto makanan ini. Balas HANYA dengan JSON format: {"name":"nama makanan","serving":"perkiraan porsi","calories":angka,"protein":angka,"carbs":angka,"fat":angka}. Beberapa lauk = estimasi satu paket. Kalori kcal, makro gram.' },
        { inline_data: { mime_type: 'image/jpeg', data: base64 } },
      ],
    }],
  })

  if (!gem.ok || !gem.res) {
    console.error('GEMINI ERROR:', gem.status, gem.detail)
    return NextResponse.json({ error: 'AI failed', detail: gem.detail }, { status: 502 })
  }

  const data = await gem.res.json()
  const text: string = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((p: { text?: string }) => p.text)
    .map((p: { text?: string }) => p.text)
    .join('')

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return NextResponse.json({ error: 'parse failed', raw: text }, { status: 502 })

  try {
    const parsed = JSON.parse(match[0])
    return NextResponse.json({ ...parsed, remaining: MAX_PHOTO_PER_DAY - used - 1 })
  } catch {
    return NextResponse.json({ error: 'parse failed', raw: text }, { status: 502 })
  }
}