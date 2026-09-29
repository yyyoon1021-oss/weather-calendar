import { useState } from 'react'
import { endOfMonth, format, startOfMonth, subDays } from 'date-fns'
import { MonthCalendar } from './components/MonthCalendar'
import { DayView } from './components/DayView'
import { EventSheet, newEvent } from './components/EventSheet'
import { useEvents } from './hooks/useEvents'
import type { CalendarEvent } from './types'
import { useWeather } from './hooks/useWeather'
import { sampleEvents } from './lib/sampleEvents'
import { expandEventsForRange } from './lib/recurrence'

export default function App() {
  const today = new Date()
  const [month, setMonth] = useState(startOfMonth(today))
  const [selectedDate, setSelectedDate] = useState(today)
  const [view, setView] = useState<'month' | 'day'>('month')
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const { events, save, remove } = useEvents(sampleEvents)
  const { weather } = useWeather()
  const visibleEvents = view === 'month'
    ? expandEventsForRange(events, format(startOfMonth(month), 'yyyy-MM-dd'), format(endOfMonth(month), 'yyyy-MM-dd'))
    : expandEventsForRange(events, format(selectedDate, 'yyyy-MM-dd'), format(selectedDate, 'yyyy-MM-dd'))

  function saveWithScope(event: CalendarEvent, scope: 'one' | 'after' | 'all', occurrenceDate?: string) {
    if (!event.recurrence || !occurrenceDate || scope === 'all') { save(event); return }
    const base = events.find(item => item.id === event.id)
    if (!base) { save(event); return }
    if (scope === 'one') { save({ ...base, exceptions: { ...base.exceptions, overrides: { ...base.exceptions.overrides, [occurrenceDate]: { title: event.title, allDay: event.allDay, startTime: event.startTime, endTime: event.endTime, color: event.color, location: event.location, memo: event.memo, checklist: event.checklist } } } }); return }
    const until = format(subDays(new Date(`${occurrenceDate}T00:00:00`), 1), 'yyyy-MM-dd')
    save({ ...base, recurrence: { ...base.recurrence!, until } })
    save({ ...event, id: crypto.randomUUID(), startDate: occurrenceDate, endDate: occurrenceDate, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  }
  function deleteWithScope(event: CalendarEvent, scope: 'one' | 'after' | 'all', occurrenceDate?: string) {
    if (!event.recurrence || !occurrenceDate || scope === 'all') { remove(event.id); return }
    const base = events.find(item => item.id === event.id); if (!base) return
    if (scope === 'one') save({ ...base, exceptions: { ...base.exceptions, skipped: [...base.exceptions.skipped, occurrenceDate] } })
    else save({ ...base, recurrence: { ...base.recurrence!, until: format(subDays(new Date(`${occurrenceDate}T00:00:00`), 1), 'yyyy-MM-dd') } })
  }

  return <div className="mx-auto min-h-dvh max-w-[390px] overflow-hidden bg-white shadow-[0_0_32px_rgba(23,25,28,0.08)]">
    {view === 'month' ? <MonthCalendar
      month={month}
      selectedDate={selectedDate}
      events={visibleEvents}
      onMonthChange={setMonth}
      onDateSelect={(date) => { setSelectedDate(date); setView('day') }}
      onAdd={() => setEditingEvent(newEvent(selectedDate))}
      onToday={() => { setMonth(startOfMonth(today)); setSelectedDate(today) }}
      weather={weather}
    /> : <DayView date={selectedDate} events={visibleEvents} weather={weather} onBack={() => setView('month')} onDateSelect={setSelectedDate} onAdd={() => setEditingEvent(newEvent(selectedDate))} onEventClick={setEditingEvent} onEmptyTime={(time) => setEditingEvent(newEvent(selectedDate, time))} />}
    {editingEvent && <EventSheet event={editingEvent} occurrenceDate={format(selectedDate, 'yyyy-MM-dd')} onClose={() => setEditingEvent(null)} onSave={saveWithScope} onDelete={deleteWithScope} />}
  </div>
}
