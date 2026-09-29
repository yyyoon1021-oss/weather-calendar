export type EventColor = 'blue' | 'purple' | 'orange' | 'green'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Recurrence {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  weekdays?: number[]
  until?: string
  count?: number
}

export interface CalendarEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  allDay: boolean
  startTime: string
  endTime: string
  color: EventColor
  location: string
  memo: string
  checklist: ChecklistItem[]
  recurrence: Recurrence | null
  exceptions: {
    skipped: string[]
    overrides: Record<string, Partial<CalendarEvent>>
  }
  checklistDone: Record<string, string[]>
  createdAt: string
  updatedAt: string
}

export interface EventsStorageV2 {
  version: 2
  events: CalendarEvent[]
}
