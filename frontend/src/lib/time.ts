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

export function wibHourMinute(d = new Date()): { hour: number; minute: number; date: string } {
  const p = parts(d)
  return {
    hour: Number(p.get('hour') || '0'),
    minute: Number(p.get('minute') || '0'),
    date: `${p.get('year')}-${p.get('month')}-${p.get('day')}`,
  }
}

export function parseHHMM(v: unknown): { hour: number; minute: number } | null {
  if (typeof v !== 'string') return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim())
  if (!m) return null
  const hour = Number(m[1])
  const minute = Number(m[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export function minutesOfDay(hour: number, minute: number) {
  return hour * 60 + minute
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

// Senin (awal minggu, WIB) sebagai YYYY-MM-DD. `d` diterima untuk kompatibilitas; acuan = "sekarang" WIB.
export function wibWeekStart(_d = new Date()): string {
  void _d
  const cur = wibNow()
  const day = cur.getDay() // 0 = Minggu
  const diff = day === 0 ? -6 : 1 - day // mundur ke Senin
  cur.setDate(cur.getDate() + diff)
  return ymd(cur)
}

export function addDaysYmd(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return ymd(d)
}
