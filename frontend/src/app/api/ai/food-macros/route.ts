import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const { query } = (await req.json()) as { query: string }
  if (!query || query.trim().length < 2) return NextResponse.json({ error: 'query too short' }, { status: 400 })

  const prompt = `Kamu ahli gizi. User mau meal prep dengan bahan utama: "${query}".

TUGAS: Beri estimasi makro per 100 gram (berat matang) bahan ini. Balas HANYA JSON valid:
{"name":"nama bahan","protein":g_per_100g,"kcal":kcal_per_100g,"carbs":g_per_100g,"fat":g_per_100g}

Contoh: "dada ayam" → {"name":"Dada ayam","protein":31,"kcal":165,"carbs":0,"fat":3.6}`

  const gem = await callGemini({ contents: [{ parts: [{ text: prompt }] }] })
  if (!gem.ok || !gem.res) return NextResponse.json({ error: 'AI failed', detail: gem.detail }, { status: 502 })

  const data = await gem.res.json()
  const text = (data.candidates?.[0]?.content?.parts ?? [])
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
