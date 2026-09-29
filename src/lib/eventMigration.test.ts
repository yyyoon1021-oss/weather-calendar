import { describe, expect, it } from 'vitest'
import { migrateLegacyEvent, readEventsStorage } from './eventMigration'

describe('legacy event migration', () => {
  const now = '2026-09-29T00:00:00.000Z'
  const legacy = { id: 'old-1', title: '기존 일정', date: '2026-10-06', allDay: false, startTime: '09:00', endTime: '10:00', color: 'purple', location: '학교', memo: '메모', checklist: [{ id: 'c1', text: '준비', done: true }] }

  it('converts a v1 event without losing existing fields', () => {
    expect(migrateLegacyEvent(legacy, now)).toMatchObject({ id: 'old-1', startDate: '2026-10-06', endDate: '2026-10-06', recurrence: null, exceptions: { skipped: [], overrides: {} }, checklistDone: {}, createdAt: now, updatedAt: now, checklist: legacy.checklist })
  })

  it('clears times for an all-day event', () => {
    expect(migrateLegacyEvent({ ...legacy, allDay: true, startTime: '09:00', endTime: '10:00' }, now)).toMatchObject({ allDay: true, startTime: '', endTime: '' })
  })

  it('keeps v2 data and marks a legacy array for backup', () => {
    const v2 = JSON.stringify({ version: 2, events: [{ ...migrateLegacyEvent(legacy, now)! }] })
    expect(readEventsStorage(v2, JSON.stringify([legacy]), now)).toMatchObject({ migrated: false, events: [{ id: 'old-1' }] })
    expect(readEventsStorage(null, JSON.stringify([legacy]), now)).toMatchObject({ migrated: true, legacyBackup: JSON.stringify([legacy]), events: [{ startDate: '2026-10-06' }] })
  })
})
