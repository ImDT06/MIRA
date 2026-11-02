export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

export const uid = () => Math.random().toString(36).slice(2, 10)

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const addDays = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export const dueLabel = (iso: string) => {
  if (iso === addDays(0)) return 'Hôm nay'
  if (iso === addDays(1)) return 'Ngày mai'
  const [, month, day] = iso.split('-')
  return `${day}/${month}`
}

export const clockNow = () => {
  const now = new Date()
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
export const WEEKDAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export const longDate = (date = new Date()) =>
  `${WEEKDAYS[date.getDay()]}, ngày ${date.getDate()} tháng ${date.getMonth() + 1}`

export const parseISODate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const shiftISODate = (iso: string, days: number) => {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

// Tuần bắt đầu từ Thứ Hai.
export const weekDates = (iso: string) => {
  const offset = (parseISODate(iso).getDay() + 6) % 7
  return Array.from({ length: 7 }, (_, index) => shiftISODate(iso, index - offset))
}

export const dayMonth = (iso: string) => {
  const [, month, day] = iso.split('-')
  return `${day}/${month}`
}

export const dateTimeLabel = (iso: string) => {
  const date = new Date(iso)
  return `${dueLabel(toISODate(date))}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const fromMinutes = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
