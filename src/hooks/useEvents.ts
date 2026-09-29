import { useEffect, useState } from 'react'
import type { CalendarEvent } from '../types'
import { eventsStorageKey, legacyEventsStorageKey, readEventsStorage, toEventsStorage } from '../lib/eventMigration'

export function useEvents(seed: CalendarEvent[]) {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const result = readEventsStorage(localStorage.getItem(eventsStorageKey), localStorage.getItem(legacyEventsStorageKey))
    if (result.legacyBackup) localStorage.setItem(`${legacyEventsStorageKey}-backup-${Date.now()}`, result.legacyBackup)
    return result.events.length ? result.events : seed
  })

  useEffect(() => { localStorage.setItem(eventsStorageKey, JSON.stringify(toEventsStorage(events))) }, [events])

  function save(event: CalendarEvent) {
    setEvents(current => current.some(item => item.id === event.id) ? current.map(item => item.id === event.id ? { ...event, updatedAt: new Date().toISOString() } : item) : [...current, { ...event, createdAt: event.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }])
  }
  function remove(id: string) { setEvents(current => current.filter(item => item.id !== id)) }
  return { events, save, remove }
}
