import { addDays, addMonths, addWeeks, addYears, format, getDay, startOfWeek } from 'date-fns'
import type { CalendarEvent } from '../types'

export interface EventOccurrence { event: CalendarEvent; occurrenceDate: string; resolved: CalendarEvent }
const date = (value: string) => new Date(`${value}T00:00:00`)

function matches(event: CalendarEvent, candidate: Date) {
  const rule = event.recurrence
  if (!rule) return format(candidate, 'yyyy-MM-dd') === event.startDate
  const start = date(event.startDate)
  if (candidate < start) return false
  if (rule.freq === 'daily') return Math.round((candidate.getTime() - start.getTime()) / 86400000) % rule.interval === 0
  if (rule.freq === 'weekly') {
    const weeks = Math.round((startOfWeek(candidate, { weekStartsOn: 0 }).getTime() - startOfWeek(start, { weekStartsOn: 0 }).getTime()) / 604800000)
    return weeks >= 0 && weeks % rule.interval === 0 && (rule.weekdays?.length ? rule.weekdays : [getDay(start)]).includes(getDay(candidate))
  }
  if (rule.freq === 'monthly') return candidate.getDate() === start.getDate() && (candidate.getFullYear() - start.getFullYear()) * 12 + candidate.getMonth() - start.getMonth() >= 0 && ((candidate.getFullYear() - start.getFullYear()) * 12 + candidate.getMonth() - start.getMonth()) % rule.interval === 0
  return candidate.getDate() === start.getDate() && candidate.getMonth() === start.getMonth() && candidate.getFullYear() >= start.getFullYear() && (candidate.getFullYear() - start.getFullYear()) % rule.interval === 0
}

export function occurrencesInRange(event: CalendarEvent, from: string, to: string): EventOccurrence[] {
  if (!event.recurrence) return event.startDate <= to && event.endDate >= from ? [{ event, occurrenceDate: event.startDate, resolved: event }] : []
  const rule = event.recurrence
  const start = date(event.startDate); const end = date(to); const results: EventOccurrence[] = []
  let cursor = start; let index = 0
  while (cursor <= end && index < 2000) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (rule.until && key > rule.until) break
    if (matches(event, cursor)) {
      index += 1
      if (rule.count && index > rule.count) break
      if (key >= from && !event.exceptions.skipped.includes(key)) {
        const override = event.exceptions.overrides[key] ?? {}
        results.push({ event, occurrenceDate: key, resolved: { ...event, ...override, startDate: (override.startDate as string | undefined) ?? key, endDate: (override.endDate as string | undefined) ?? key } })
      }
    }
    cursor = addDays(cursor, 1)
  }
  return results
}

export function expandEventsForRange(events: CalendarEvent[], from: string, to: string) { return events.flatMap(event => occurrencesInRange(event, from, to).map(item => item.resolved)) }

export function checklistDoneFor(event: CalendarEvent, occurrenceDate: string, itemId: string) { return event.recurrence ? event.checklistDone[occurrenceDate]?.includes(itemId) ?? false : event.checklist.find(item => item.id === itemId)?.done ?? false }
