import { describe, expect, it } from 'vitest'
import { eventDayLabel, isEventOnDate, timedSegmentsForDate } from './eventLayout'
import type { CalendarEvent } from '../types'

const event: CalendarEvent = { id: 'night', title: '야간 작업', startDate: '2026-10-06', endDate: '2026-10-07', allDay: false, startTime: '23:00', endTime: '01:00', color: 'blue', location: '', memo: '', checklist: [], recurrence: null, exceptions: { skipped: [], overrides: {} }, checklistDone: {}, createdAt: '', updatedAt: '' }

describe('multiple-day event layout', () => {
  it('splits a midnight-crossing event across two dates', () => {
    expect(timedSegmentsForDate([event], '2026-10-06')).toMatchObject([{ start: 1380, end: 1440, continuation: false }])
    expect(timedSegmentsForDate([event], '2026-10-07')).toMatchObject([{ start: 0, end: 60, continuation: true }])
  })
  it('includes every date in a spanning event and gives a day position', () => {
    const allDay = { ...event, allDay: true, startDate: '2026-10-30', endDate: '2026-11-01' }
    expect(isEventOnDate(allDay, '2026-10-31')).toBe(true)
    expect(isEventOnDate(allDay, '2026-11-02')).toBe(false)
    expect(eventDayLabel(allDay, '2026-10-31')).toContain('3일 중 2일째')
  })
})
