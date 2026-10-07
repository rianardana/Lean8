// WIB (Asia/Jakarta, UTC+7). Server jalan di UTC, tapi user di Batam — jadi
// semua "hari ini" / jam sekarang di server HARUS pakai WIB, bukan new Date().
const TZ = 'Asia/Jakarta'

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hourCycle: 'h23',
})

function parts(d: Date): Map<string, string> {
  const m = new Map<string, string>()
  for (const p of fmt.formatToParts(d)) m.set(p.type, p.value)
  return m
}

// Date yang getHours()/getMinutes()/getDate()/setDate()-nya ngikut jam dinding WIB.
export function wibNow(): Date {
  const p = parts(new Date())
  return new Date(`${p.get('year')}-${p.get('month')}-${p.get('day')}T${p.get('hour')}:${p.get('minute')}:${p.get('second')}`)
}

// "YYYY-MM-DD" versi WIB (hari ini di Batam, bukan UTC).
export function wibDate(d = new Date()): string {
  const p = parts(d)
  return `${p.get('year')}-${p.get('month')}-${p.get('day')}`
}
