import { describe, expect, it } from 'vitest'
import { occurrencesInRange } from './recurrence'
import type { CalendarEvent } from '../types'
const weekly: CalendarEvent = { id: 'weekly', title: '반복', startDate: '2026-10-05', endDate: '2026-10-05', allDay: false, startTime: '09:00', endTime: '10:00', color: 'blue', location: '', memo: '', checklist: [], recurrence: { freq: 'weekly', interval: 1, weekdays: [1, 3], until: '2026-10-14' }, exceptions: { skipped: ['2026-10-12'], overrides: {} }, checklistDone: {}, createdAt: '', updatedAt: '' }
describe('recurrence', () => {
  it('creates only selected weekly weekdays and respects until and skips', () => expect(occurrencesInRange(weekly, '2026-10-01', '2026-10-31').map(item => item.occurrenceDate)).toEqual(['2026-10-05', '2026-10-07', '2026-10-14']))
  it('skips missing monthly dates', () => { const monthly = { ...weekly, recurrence: { freq: 'monthly' as const, interval: 1 }, startDate: '2026-01-31', endDate: '2026-01-31', exceptions: { skipped: [], overrides: {} } }; expect(occurrencesInRange(monthly, '2026-01-01', '2026-04-30').map(item => item.occurrenceDate)).toEqual(['2026-01-31', '2026-03-31']) })
})
