import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MODEL = 'gemini-2.5-flash' // free tier. Kalau error model, ganti 'gemini-2.0-flash'
const MAX_PHOTO_PER_DAY = 100

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const { image, userId = 1 } = (await req.json()) as { image: string; userId?: number }
  if (!image) return NextResponse.json({ error: 'image required' }, { status: 400 })

  // --- LIMIT 3 FOTO/HARI (dihitung dari DB, gak bisa diakali) ---
  const used = await prisma.mealLog.count({
    where: { userId, date: todayKey(), foodName: { startsWith: '📸' } },
  })
  if (used >= MAX_PHOTO_PER_DAY) {
  return NextResponse.json(
    { error: `Limit foto hari ini habis (${MAX_PHOTO_PER_DAY}/${MAX_PHOTO_PER_DAY}). Pakai input manual dulu ya!` },
    { status: 429 }
  )
}

  const base64 = image.split(',')[1] ?? image // buang prefix data:image/...

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Kamu ahli gizi spesialis masakan Indonesia. Analisa foto makanan ini, lalu balas HANYA dengan JSON valid format: {"name":"nama makanan","serving":"perkiraan porsi","calories":angka,"protein":angka,"carbs":angka,"fat":angka}. Jika ada beberapa lauk, estimasi sebagai satu paket makan. Kalori dalam kcal, makro dalam gram.' },
            { inline_data: { mime_type: 'image/jpeg', data: base64 } },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 300 },
      }),
    }
  )

  if (!res.ok) return NextResponse.json({ error: 'AI failed' }, { status: 502 })

  const data = await res.json()
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json({ ...parsed, remaining: MAX_PHOTO_PER_DAY - used - 1 })
  } catch {
    return NextResponse.json({ error: 'parse failed' }, { status: 502 })
  }
}