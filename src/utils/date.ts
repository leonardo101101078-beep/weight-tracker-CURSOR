import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { DateKey } from '../db/indexedDb'

export function toDateKey(d: Date): DateKey {
  return format(d, 'yyyy-MM-dd') as DateKey
}

export function dateKeyToday(now = new Date()): DateKey {
  return toDateKey(startOfDay(now))
}

export function dateKeyAddDays(dateKey: DateKey, days: number): DateKey {
  const d = parseISO(dateKey)
  return toDateKey(addDays(d, days))
}

export function dateKeyYesterday(now = new Date()): DateKey {
  return dateKeyAddDays(dateKeyToday(now), -1)
}

export function lastNDaysKeys(n: number, now = new Date()): DateKey[] {
  const today = dateKeyToday(now)
  const keys: DateKey[] = []
  for (let i = n - 1; i >= 0; i -= 1) keys.push(dateKeyAddDays(today, -i))
  return keys
}

export function formatDateZh(dateKey: DateKey): string {
  return format(parseISO(dateKey), 'yyyy/MM/dd', { locale: zhTW })
}

export function formatWeekdayZh(dateKey: DateKey): string {
  return format(parseISO(dateKey), 'EEEE', { locale: zhTW })
}

