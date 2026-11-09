export const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
]

export async function callGemini(body: unknown): Promise<{ ok: boolean; status?: number; detail?: string; res?: Response }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { ok: false, status: 500, detail: 'GEMINI_API_KEY is not set' }

  let lastStatus = 502
  let lastDetail = ''
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      )
      if (res.ok) return { ok: true, res }
      lastStatus = res.status
      lastDetail = await res.text()
    } catch (err) {
      lastStatus = 502
      lastDetail = err instanceof Error ? err.message : String(err)
    }
  }
  return { ok: false, status: lastStatus, detail: lastDetail }
}
