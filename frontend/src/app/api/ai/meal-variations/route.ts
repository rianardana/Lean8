import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const { names, goal } = (await req.json()) as { names: string[]; goal?: string }
  if (!names || names.length === 0) return NextResponse.json({ error: 'names required' }, { status: 400 })

  const mode = goal === 'bulk' ? 'kalori cukup buat bulking' : 'rendah kalori buat cutting'
  const list = names.map((n, i) => `${i + 1}. ${n}`).join('\n')

  const prompt = `Kamu chef sehat. User meal prep ${names.length} hari, bahan utama dirotasi tiap hari (${mode}):
${list}

TUGAS: Buat resep SIMPLE untuk tiap hari. Untuk tiap hari:
- "name": nama masakan singkat (bumbu/cara masak, 2-4 kata).
- "ingredients": 2-4 bahan pelengkap (bumbu/sayur), tanpa jumlah.
- "steps": cara masak 1 kalimat singkat (maks 15 kata).

Balas HANYA JSON valid, array sesuai urutan hari:
{"days":[{"name":"...","ingredients":["...","..."],"steps":"..."}]}`

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
