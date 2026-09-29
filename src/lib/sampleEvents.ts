import type { CalendarEvent } from '../types'
import { format } from 'date-fns'

const day = format(new Date(), 'yyyy-MM-dd')
const createdAt = new Date().toISOString()
const event = (values: Omit<CalendarEvent, 'startDate' | 'endDate' | 'recurrence' | 'exceptions' | 'checklistDone' | 'createdAt' | 'updatedAt'>): CalendarEvent => ({ ...values, startDate: day, endDate: day, recurrence: null, exceptions: { skipped: [], overrides: {} }, checklistDone: {}, createdAt, updatedAt: createdAt })

export const sampleEvents: CalendarEvent[] = [
  event({ id: 'sample-1', title: '전공 수업', allDay: false, startTime: '09:00', endTime: '10:30', color: 'blue', location: '강의실', memo: '', checklist: [] }),
  event({ id: 'sample-2', title: '팀 회의', allDay: false, startTime: '13:00', endTime: '14:00', color: 'purple', location: '', memo: '', checklist: [{ id: 'check-1', text: '회의 자료 준비', done: true }, { id: 'check-2', text: '공유 문서 작성', done: false }] }),
  event({ id: 'sample-3', title: '과제 제출', allDay: false, startTime: '17:00', endTime: '17:30', color: 'orange', location: '', memo: '', checklist: [{ id: 'check-3', text: '최종 검토', done: false }, { id: 'check-4', text: '파일 업로드', done: false }, { id: 'check-5', text: '제출 확인', done: true }] }),
  event({ id: 'sample-4', title: '운동', allDay: false, startTime: '19:00', endTime: '20:00', color: 'green', location: '헬스장', memo: '', checklist: [] }),
  event({ id: 'sample-5', title: '친구 약속', allDay: false, startTime: '12:30', endTime: '14:30', color: 'orange', location: '', memo: '', checklist: [] }),
]
