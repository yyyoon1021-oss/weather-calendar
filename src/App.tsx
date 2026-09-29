import { useState } from 'react'
import { startOfMonth } from 'date-fns'
import { MonthCalendar } from './components/MonthCalendar'
import { DayView } from './components/DayView'
import { EventSheet, newEvent } from './components/EventSheet'
import { useEvents } from './hooks/useEvents'
import type { CalendarEvent } from './types'
import { useWeather } from './hooks/useWeather'
import { sampleEvents } from './lib/sampleEvents'

export default function App() {
  const today = new Date()
  const [month, setMonth] = useState(startOfMonth(today))
  const [selectedDate, setSelectedDate] = useState(today)
  const [view, setView] = useState<'month' | 'day'>('month')
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const { events, save, remove } = useEvents(sampleEvents)
  const { weather } = useWeather()

  return <div className="mx-auto min-h-dvh max-w-[390px] overflow-hidden bg-white shadow-[0_0_32px_rgba(23,25,28,0.08)]">
    {view === 'month' ? <MonthCalendar
      month={month}
      selectedDate={selectedDate}
      events={events}
      onMonthChange={setMonth}
      onDateSelect={(date) => { setSelectedDate(date); setView('day') }}
      onAdd={() => setEditingEvent(newEvent(selectedDate))}
      onToday={() => { setMonth(startOfMonth(today)); setSelectedDate(today) }}
      weather={weather}
    /> : <DayView date={selectedDate} events={events} weather={weather} onBack={() => setView('month')} onDateSelect={setSelectedDate} onAdd={() => setEditingEvent(newEvent(selectedDate))} onEventClick={setEditingEvent} onEmptyTime={(time) => setEditingEvent(newEvent(selectedDate, time))} />}
    {editingEvent && <EventSheet event={editingEvent} onClose={() => setEditingEvent(null)} onSave={save} onDelete={remove} />}
  </div>
}
