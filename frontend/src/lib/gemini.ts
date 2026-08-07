export const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
]

export async function callGemini(body: unknown): Promise<{ ok: boolean; status?: number; detail?: string; res?: Response }> {
  let lastStatus = 502
  let lastDetail = ''
  for (const model of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    if (res.ok) return { ok: true, res }
    lastStatus = res.status
    lastDetail = await res.text()
  }
  return { ok: false, status: lastStatus, detail: lastDetail }
}