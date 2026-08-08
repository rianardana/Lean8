import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const { query } = (await req.json()) as { query: string }
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'query too short' }, { status: 400 })
  }

  const prompt = `Kamu ahli gizi. User input: "${query}"

TUGAS:
1. Parse input: ekstrak NAMA MAKANAN dan JUMLAH/PORSI.
   - "donat cokelat 3" → name="Donat Cokelat", quantity=3
   - "mie goreng jumbo" → name="Mie Goreng Jumbo", quantity=1 (jumbo = porsi besar, kalori sudah dinaikkan)
   - "nasi padang 2 porsi" → name="Nasi Padang", quantity=2
   - Kalau tidak ada angka, quantity=1.
2. Estimasi kalori PER PORSI standar (dalam kcal) + makro per porsi (gram).
3. Kalikan dengan quantity untuk total.

Balas HANYA JSON valid:
{"name":"nama makanan bersih","quantity":angka,"calories":total_kcal,"protein":total_g,"carbs":total_g,"fat":total_g,"perServing":kcal_per_porsi}

Contoh: "donat cokelat 3" → {"name":"Donat Cokelat","quantity":3,"calories":750,"protein":9,"carbs":90,"fat":42,"perServing":250}`

  const gem = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
  })

  if (!gem.ok || !gem.res) {
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
    return NextResponse.json(JSON.parse(match[0]))
  } catch {
    return NextResponse.json({ error: 'parse failed', raw: text }, { status: 502 })
  }
}