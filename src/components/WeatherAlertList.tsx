import type { CalendarEvent } from '../types'
import type { WeatherAlert } from '../lib/weatherAlerts'

export interface EventAlerts {
  event: CalendarEvent
  alerts: WeatherAlert[]
}

export function WeatherAlertList({ items }: { items: EventAlerts[] }) {
  if (!items.length) return null
  return <section className="mt-4 max-h-[120px] overflow-y-auto rounded-xl border border-[#F2D6B8] bg-[#FFF7ED] px-4 py-3" aria-label="일정 날씨 알림">
    <h2 className="text-[15px] font-bold text-[#7F3D08]">일정 날씨 알림</h2>
    <ul className="mt-2 space-y-3">
      {items.map(({ event, alerts }) => <li key={`${event.id}-${event.startTime}`}>
        <p className="text-[14px] font-semibold text-[#17191C]">{event.startTime}–{event.endTime} {event.title}</p>
        <ul className="mt-1 space-y-0.5">
          {alerts.map(alert => <li key={alert.kind} className="text-[14px] leading-snug text-[#5B3A12]"><span aria-hidden>{alert.icon}</span> <b>{alert.title}</b> ({alert.hours}) · {alert.advice}</li>)}
        </ul>
      </li>)}
    </ul>
  </section>
}
