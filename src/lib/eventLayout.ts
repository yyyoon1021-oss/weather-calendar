import type { CalendarEvent } from '../types'

export function compareDate(a: string, b: string) { return a.localeCompare(b) }
export function isEventOnDate(event: CalendarEvent, date: string) { return compareDate(event.startDate, date) <= 0 && compareDate(event.endDate, date) >= 0 }
export function minutesOf(time: string) { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute }

export interface TimedSegment { event: CalendarEvent; start: number; end: number; continuation: boolean }

export function timedSegmentsForDate(events: CalendarEvent[], date: string): TimedSegment[] {
  return events.flatMap(event => {
    if (event.allDay || !isEventOnDate(event, date)) return []
    const startsToday = event.startDate === date
    const endsToday = event.endDate === date
    return [{ event, start: startsToday ? minutesOf(event.startTime) : 0, end: endsToday ? minutesOf(event.endTime) : 1440, continuation: !startsToday }]
  })
}

export function eventDayLabel(event: CalendarEvent, date: string) {
  if (event.startDate === event.endDate) return event.title
  const start = new Date(`${event.startDate}T00:00:00`)
  const current = new Date(`${date}T00:00:00`)
  const end = new Date(`${event.endDate}T00:00:00`)
  const total = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  const position = Math.round((current.getTime() - start.getTime()) / 86400000) + 1
  return `${event.startDate.slice(5).replace('-', '월 ')}일 ~ ${event.endDate.slice(5).replace('-', '월 ')}일 (${total}일 중 ${position}일째)`
}

export function eventBarClass(event: CalendarEvent, date: string) {
  if (event.startDate === event.endDate) return 'rounded-md'
  if (event.startDate === date) return 'rounded-l-md rounded-r-none'
  if (event.endDate === date) return 'rounded-r-md rounded-l-none'
  return 'rounded-none'
}
