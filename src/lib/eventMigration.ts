import type { CalendarEvent, ChecklistItem, EventsStorageV2 } from '../types'

export const legacyEventsStorageKey = 'weather-calendar-events-v1'
export const eventsStorageKey = 'weather-calendar-events-v2'

type LegacyEvent = {
  id?: unknown
  title?: unknown
  date?: unknown
  allDay?: unknown
  startTime?: unknown
  endTime?: unknown
  color?: unknown
  location?: unknown
  memo?: unknown
  checklist?: unknown
}

function isDate(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) }
function text(value: unknown) { return typeof value === 'string' ? value : '' }
function checklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const candidate = item as { id?: unknown; text?: unknown; done?: unknown }
    return typeof candidate.id === 'string' && typeof candidate.text === 'string' ? [{ id: candidate.id, text: candidate.text, done: candidate.done === true }] : []
  })
}

export function migrateLegacyEvent(value: LegacyEvent, now = new Date().toISOString()): CalendarEvent | null {
  if (typeof value.id !== 'string' || typeof value.title !== 'string' || !isDate(value.date)) return null
  const allDay = value.allDay === true
  return {
    id: value.id,
    title: value.title,
    startDate: value.date,
    endDate: value.date,
    allDay,
    startTime: allDay ? '' : text(value.startTime),
    endTime: allDay ? '' : text(value.endTime),
    color: value.color === 'purple' || value.color === 'orange' || value.color === 'green' ? value.color : 'blue',
    location: text(value.location),
    memo: text(value.memo),
    checklist: checklist(value.checklist),
    recurrence: null,
    exceptions: { skipped: [], overrides: {} },
    checklistDone: {},
    createdAt: now,
    updatedAt: now,
  }
}

export function migrateLegacyEvents(value: unknown, now = new Date().toISOString()): CalendarEvent[] {
  return Array.isArray(value) ? value.flatMap(event => {
    const migrated = migrateLegacyEvent(event as LegacyEvent, now)
    return migrated ? [migrated] : []
  }) : []
}

export function isEventsStorageV2(value: unknown): value is EventsStorageV2 {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { version?: unknown; events?: unknown }
  return candidate.version === 2 && Array.isArray(candidate.events)
}

export function readEventsStorage(rawV2: string | null, rawLegacy: string | null, now = new Date().toISOString()) {
  try {
    const v2 = rawV2 ? JSON.parse(rawV2) : null
    if (isEventsStorageV2(v2)) return { events: v2.events as CalendarEvent[], migrated: false, legacyBackup: null as string | null }
  } catch { /* fall through to the legacy copy */ }
  try {
    const legacy = rawLegacy ? JSON.parse(rawLegacy) : null
    return { events: migrateLegacyEvents(legacy, now), migrated: Array.isArray(legacy), legacyBackup: Array.isArray(legacy) ? rawLegacy : null }
  } catch { return { events: [], migrated: false, legacyBackup: null as string | null } }
}

export function toEventsStorage(events: CalendarEvent[]): EventsStorageV2 { return { version: 2, events } }
