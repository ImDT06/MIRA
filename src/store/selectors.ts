import { parseISODate } from '../lib/utils'
import type { CalendarEvent, Priority } from './types'

export const occursOn = (event: CalendarEvent, iso: string) =>
  event.weekday === parseISODate(iso).getDay() && (event.recurring || !event.date || event.date === iso)

export const PRIORITY_RANK: Record<Priority, number> = { Cao: 0, Vừa: 1, Thấp: 2 }
