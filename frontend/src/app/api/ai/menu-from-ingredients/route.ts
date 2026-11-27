import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const { ingredients, goal, proteinTarget, calorieTarget } = (await req.json()) as {
    ingredients?: string[]
    goal?: string
    proteinTarget?: number
    calorieTarget?: number
  }
  if (!ingredients || ingredients.length === 0) return NextResponse.json({ error: 'ingredients required' }, { status: 400 })

  const mode = goal === 'bulk' ? 'kalori cukup buat bulking' : 'rendah kalori buat cutting'
  const list = ingredients.map((n, i) => `${i + 1}. ${n}`).join('\n')
  const protein = proteinTarget ?? 120
  const kcal = calorieTarget ?? 2000

  const prompt = `Kamu chef sehat. User punya bahan berikut:
${list}

Target: ${protein}g protein/hari, ±${kcal} kcal, mode: ${mode}.

TUGAS: Buat 4-6 menu SIMPLE sehat yang memanfaatkan bahan-bahan di atas (boleh tambah bahan dasar murah: nasi, telur, bumbu). Untuk tiap menu:
- "name": nama masakan singkat (2-4 kata).
- "ingredients": 3-6 bahan dengan perkiraan jumlah (contoh "200g dada ayam").
- "steps": cara masak 1-2 kalimat singkat (maks 25 kata).

Balas HANYA JSON valid:
{"menus":[{"name":"...","ingredients":["..."],"steps":"..."}]}`

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
