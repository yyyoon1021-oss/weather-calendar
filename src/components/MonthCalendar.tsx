import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { CalendarEvent } from '../types'
import type { WeatherData } from '../lib/weather'
import { weatherInfo } from '../lib/weather'
import { ChevronLeft, ChevronRight, Pin, Plus } from './Icons'
import { eventBarClass, isEventOnDate } from '../lib/eventLayout'

const weekDays = ['일', '월', '화', '수', '목', '금', '토']
const colorClasses = {
  blue: 'bg-[#DCE8FB] text-[#1A4488]',
  purple: 'bg-[#ECE3F8] text-[#4E2F85]',
  orange: 'bg-[#FCE6D2] text-[#7F3D08]',
  green: 'bg-[#DDF0E2] text-[#1F5C31]',
}

interface Props {
  month: Date
  selectedDate: Date
  events: CalendarEvent[]
  onMonthChange: (month: Date) => void
  onDateSelect: (date: Date) => void
  onAdd: () => void
  onToday: () => void
  weather: WeatherData | null
}

export function MonthCalendar({ month, selectedDate, events, onMonthChange, onDateSelect, onAdd, onToday, weather }: Props) {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const last = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: first, end: last })
  const today = new Date()

  return <main className="min-h-dvh bg-white pb-24">
    <header className="px-6 pt-9 pb-5">
      <div className="flex items-center justify-between">
        <h1 className="flex items-baseline gap-2 text-[#17191C]"><span className="text-[54px] font-bold leading-none tracking-[-0.06em]">{format(month, 'M월')}</span><span className="text-[28px] font-medium text-[#5B6270]">{format(month, 'yyyy')}</span></h1>
        <div className="flex items-center gap-2 text-[#1F5FD1]">
          <button className="grid size-11 place-items-center rounded-full" aria-label="이전 달" onClick={() => onMonthChange(subMonths(month, 1))}><ChevronLeft className="size-7" /></button>
          <button className="grid size-11 place-items-center rounded-full" aria-label="다음 달" onClick={() => onMonthChange(addMonths(month, 1))}><ChevronRight className="size-7" /></button>
          <button className="grid size-11 place-items-center rounded-full" aria-label="일정 추가" onClick={onAdd}><Plus className="size-8" /></button>
        </div>
      </div>
      <div className="mt-5 flex items-start gap-2 text-[20px] font-medium text-[#5B6270]"><Pin className="mt-0.5 size-6 shrink-0" /><div>{weather?.locationName ?? '위치 확인 중'}{weather?.permissionFallback && <p className="mt-1 text-xs font-normal">위치 권한을 허용하면 현재 위치 날씨가 보여요</p>}</div></div>
    </header>
    <div className="grid grid-cols-7 border-b border-[#E3E6EB] px-5 pb-4 text-center text-[21px] font-semibold text-[#5B6270]">
      {weekDays.map((day, index) => <div key={day} className={index === 0 ? 'text-[#D0342C]' : index === 6 ? 'text-[#1F5FD1]' : ''}>{day}</div>)}
    </div>
    <section className="grid grid-cols-7">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd')
        const dayEvents = events.filter(event => isEventOnDate(event, key)).sort((a, b) => a.allDay === b.allDay ? a.startTime.localeCompare(b.startTime) : a.allDay ? -1 : 1)
        const muted = !isSameMonth(day, month)
        const weekday = day.getDay()
        const dailyWeather = weather?.daily[key]
        return <button key={key} onClick={() => onDateSelect(day)} className={`min-h-36 border-b border-[#E3E6EB] px-1.5 py-3 text-left align-top ${muted ? 'opacity-0 pointer-events-none' : ''}`}>
          <div className="flex items-center"><span className={`grid size-10 place-items-center rounded-full text-[27px] font-semibold leading-none ${isSameDay(day, today) ? 'bg-[#1F5FD1] text-white' : weekday === 0 ? 'text-[#D0342C]' : weekday === 6 ? 'text-[#1F5FD1]' : 'text-[#17191C]'}`}>{format(day, 'd')}</span>{dailyWeather && <span className="text-lg">{weatherInfo(dailyWeather.code, isSameDay(day, today) && new Date().getHours() >= 19).emoji}</span>}</div>
          <div className="mt-1 space-y-1">
            {dayEvents.slice(0, 3).map(event => <div key={event.id} className={`truncate px-1.5 py-0.5 text-[14px] font-semibold ${eventBarClass(event, key)} ${colorClasses[event.color]}`}>{event.startDate === key ? event.title : '↳ 이어짐'}</div>)}
            {dayEvents.length > 3 && <div className="pl-1 text-sm font-semibold text-[#5B6270]">+{dayEvents.length - 3}</div>}
          </div>
        </button>
      })}
    </section>
    <nav className="fixed bottom-0 left-1/2 flex h-20 w-full max-w-[390px] -translate-x-1/2 items-center border-t border-[#E3E6EB] bg-white px-7">
      <button onClick={onToday} className="min-h-11 text-[24px] font-semibold text-[#1F5FD1]">오늘</button>
    </nav>
  </main>
}
