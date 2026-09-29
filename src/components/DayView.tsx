import { addDays, format, isSameDay, isToday, startOfWeek, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useEffect, useMemo, useRef } from 'react'
import type { CalendarEvent, EventColor } from '../types'
import { ChevronLeft, Plus } from './Icons'
import type { WeatherData } from '../lib/weather'
import { weatherInfo } from '../lib/weather'
import { WeatherCard } from './WeatherCard'
import { eventDayLabel, isEventOnDate, timedSegmentsForDate } from '../lib/eventLayout'

const colorClasses: Record<EventColor, string> = {
  blue: 'border-[#bed3f5] bg-[#DCE8FB] text-[#1A4488]',
  purple: 'border-[#daceef] bg-[#ECE3F8] text-[#4E2F85]',
  orange: 'border-[#f2d6b8] bg-[#FCE6D2] text-[#7F3D08]',
  green: 'border-[#c6e3ce] bg-[#DDF0E2] text-[#1F5C31]',
}

function minutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function timeLabel(hour: number) { return `${hour}시` }

function eventLanes(events: CalendarEvent[]) {
  const lanes: number[] = []
  return events.map(event => {
    const start = minutes(event.startTime)
    const end = minutes(event.endTime)
    let lane = lanes.findIndex(laneEnd => laneEnd <= start)
    if (lane === -1) { lane = lanes.length; lanes.push(end) } else lanes[lane] = end
    return { event, lane, lanes: 1 }
  }).map(item => ({ ...item, lanes: lanes.length }))
}

interface Props {
  date: Date
  events: CalendarEvent[]
  onBack: () => void
  onDateSelect: (date: Date) => void
  onAdd: () => void
  onEventClick: (event: CalendarEvent) => void
  onEmptyTime: (time: string) => void
  weather: WeatherData | null
}

export function DayView({ date, events, onBack, onDateSelect, onAdd, onEventClick, onEmptyTime, weather }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const swipeStartX = useRef<number | null>(null)
  const week = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [date])
  const dayKey = format(date, 'yyyy-MM-dd')
  const dayEvents = events.filter(event => isEventOnDate(event, dayKey))
  const timedEvents = eventLanes(timedSegmentsForDate(dayEvents, dayKey).map(segment => ({ ...segment.event, startTime: `${String(Math.floor(segment.start / 60)).padStart(2, '0')}:${String(segment.start % 60).padStart(2, '0')}`, endTime: segment.end === 1440 ? '24:00' : `${String(Math.floor(segment.end / 60)).padStart(2, '0')}:${String(segment.end % 60).padStart(2, '0')}`, __continuation: segment.continuation } as CalendarEvent & { __continuation: boolean })).sort((a, b) => a.startTime.localeCompare(b.startTime)))
  const allDayEvents = dayEvents.filter(event => event.allDay)

  useEffect(() => { scrollRef.current?.scrollTo({ top: isToday(date) ? new Date().getHours() * 60 - 100 : 8 * 60 }) }, [date])

  return <main className="flex h-dvh flex-col bg-white">
    <header className="shrink-0 border-b border-[#E3E6EB]">
      <div className="flex h-[76px] items-center justify-between px-5">
        <button onClick={onBack} className="flex min-h-11 items-center gap-1 text-[24px] font-semibold text-[#1F5FD1]"><ChevronLeft className="size-6" />{format(date, 'M월')}</button>
        <button onClick={onAdd} className="grid size-11 place-items-center text-[#1F5FD1]" aria-label="일정 추가"><Plus className="size-8" /></button>
      </div>
      <div className="grid grid-cols-7 px-4 pb-4 text-center" onPointerDown={e => { swipeStartX.current = e.clientX }} onPointerUp={e => { if (swipeStartX.current === null) return; const delta = e.clientX - swipeStartX.current; if (Math.abs(delta) > 45) onDateSelect(delta > 0 ? subDays(date, 7) : addDays(date, 7)); swipeStartX.current = null }}>
        {week.map(day => {
          const selected = isSameDay(day, date)
          const dayOfWeek = day.getDay()
          return <button key={day.toISOString()} onClick={() => onDateSelect(day)} className="flex min-h-[82px] flex-col items-center gap-1 pt-1">
            <span className={`text-[15px] font-semibold ${dayOfWeek === 0 ? 'text-[#D0342C]' : dayOfWeek === 6 ? 'text-[#1F5FD1]' : 'text-[#5B6270]'}`}>{format(day, 'E', { locale: ko })}</span>
            <span className={`grid size-10 place-items-center rounded-full text-[23px] font-semibold ${selected ? 'bg-[#1F5FD1] text-white' : dayOfWeek === 0 ? 'text-[#D0342C]' : dayOfWeek === 6 ? 'text-[#1F5FD1]' : 'text-[#17191C]'}`}>{format(day, 'd')}</span>
            {weather?.daily[format(day, 'yyyy-MM-dd')] && <span className="-mt-1 text-sm">{weatherInfo(weather.daily[format(day, 'yyyy-MM-dd')].code).emoji}</span>}
          </button>
        })}
      </div>
    </header>

    <div className="shrink-0 px-5 pt-5">
      <WeatherCard date={date} weather={weather?.daily[dayKey]} />
      {allDayEvents.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{allDayEvents.map(event => <div key={event.id} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold ${colorClasses[event.color]}`}>{eventDayLabel(event, dayKey)}</div>)}</div>}
      <h2 className="mt-8 text-[23px] font-bold">일정</h2>
    </div>

    <div ref={scrollRef} className="relative mt-3 flex-1 overflow-y-auto pb-24" aria-label="시간별 일정">
      <div className="relative min-h-[1440px]" onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); const minute = Math.max(0, Math.min(1439, Math.round((e.clientY - rect.top) / 30) * 30)); onEmptyTime(`${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`) }}>
        {Array.from({ length: 24 }, (_, hour) => { const hourWeather = weather?.hourly[dayKey]?.[hour]; return <div key={hour} className="relative h-[60px] pl-[70px] pr-5"><span className="absolute left-3 top-[-12px] text-[13px] font-medium text-[#5B6270]">{timeLabel(hour)}{hourWeather && <small className="mt-0.5 block whitespace-nowrap text-[12px]">{weatherInfo(hourWeather.code, hour >= 19 || hour < 6).emoji} {Math.round(hourWeather.temperature)}°</small>}</span><div className="h-px bg-[#E3E6EB]" /></div> })}
        {timedEvents.map(({ event, lane, lanes }) => {
          const start = minutes(event.startTime)
          const end = minutes(event.endTime)
          const top = start
          const height = Math.max(end - start, 30)
          const width = `calc((100% - 84px) / ${lanes})`
          const left = `calc(70px + ((100% - 84px) / ${lanes}) * ${lane})`
          const short = height < 60
          const complete = event.checklist.filter(item => item.done).length
          return <button key={event.id} onClick={e => { e.stopPropagation(); onEventClick(event) }} style={{ top, height, width, left }} className={`absolute overflow-hidden rounded-lg border px-3 py-2 text-left ${colorClasses[event.color]}`}>
            <span className={`block truncate text-[16px] font-bold ${short ? 'inline' : ''}`}>{(event as CalendarEvent & { __continuation: boolean }).__continuation ? '(이어짐) ' : ''}{event.title}</span>
            <span className={`text-[14px] font-medium ${short ? 'ml-1 inline' : 'mt-1 block'}`}>{event.startTime} – {event.endTime}</span>
            {event.checklist.length > 0 && !short && <span className="absolute right-2 top-2 rounded-full bg-white px-1.5 py-0.5 text-xs font-semibold">☑ {complete}/{event.checklist.length}</span>}
          </button>
        })}
        {isToday(date) && <div style={{ top: new Date().getHours() * 60 + new Date().getMinutes() }} className="absolute left-[70px] right-4 z-10 flex items-center"><span className="size-2.5 -translate-x-1/2 rounded-full bg-[#1F5FD1]" /><span className="h-0.5 flex-1 bg-[#1F5FD1]" /></div>}
      </div>
    </div>
    <nav className="absolute bottom-0 left-1/2 flex h-20 w-full max-w-[390px] -translate-x-1/2 items-center border-t border-[#E3E6EB] bg-white px-7"><button onClick={() => onDateSelect(new Date())} className="min-h-11 text-[24px] font-semibold text-[#1F5FD1]">오늘</button></nav>
  </main>
}
