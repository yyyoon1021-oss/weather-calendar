import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import type { CalendarEvent, ChecklistItem, EventColor } from '../types'
import { Plus } from './Icons'

const colors: { id: EventColor; label: string; className: string }[] = [
  { id: 'blue', label: '파랑', className: 'bg-[#DCE8FB] border-[#1A4488]' },
  { id: 'purple', label: '보라', className: 'bg-[#ECE3F8] border-[#4E2F85]' },
  { id: 'orange', label: '주황', className: 'bg-[#FCE6D2] border-[#7F3D08]' },
  { id: 'green', label: '초록', className: 'bg-[#DDF0E2] border-[#1F5C31]' },
]

export function newEvent(date: Date, startTime = '09:00'): CalendarEvent {
  const hour = Number(startTime.slice(0, 2))
  const now = new Date().toISOString()
  const day = format(date, 'yyyy-MM-dd')
  return { id: crypto.randomUUID(), title: '', startDate: day, endDate: day, allDay: false, startTime, endTime: hour === 23 ? '23:59' : `${String(hour + 1).padStart(2, '0')}:00`, color: 'blue', location: '', memo: '', checklist: [], recurrence: null, exceptions: { skipped: [], overrides: {} }, checklistDone: {}, createdAt: now, updatedAt: now }
}

interface Props {
  event: CalendarEvent
  occurrenceDate?: string
  onClose: () => void
  onSave: (event: CalendarEvent, scope: 'one' | 'after' | 'all', occurrenceDate?: string) => void
  onDelete: (event: CalendarEvent, scope: 'one' | 'after' | 'all', occurrenceDate?: string) => void
}

export function EventSheet({ event, occurrenceDate, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState(event)
  const [newChecklist, setNewChecklist] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [scope, setScope] = useState<'one' | 'after' | 'all'>('all')
  useEffect(() => setDraft(event), [event])
  const set = <K extends keyof CalendarEvent>(key: K, value: CalendarEvent[K]) => setDraft(current => ({ ...current, [key]: value }))
  const updateChecklist = (id: string, patch: Partial<ChecklistItem>) => set('checklist', draft.checklist.map(item => item.id === id ? { ...item, ...patch } : item))
  const removeChecklist = (id: string) => set('checklist', draft.checklist.filter(item => item.id !== id))
  const doneCount = draft.checklist.filter(item => item.done).length
  const valid = draft.title.trim() && (draft.allDay ? draft.startDate <= draft.endDate : `${draft.startDate}T${draft.startTime}` < `${draft.endDate}T${draft.endTime}`)

  return <div className="fixed inset-0 z-30 mx-auto flex max-w-[390px] items-end bg-black/25" role="dialog" aria-modal="true">
    <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white px-6 pb-9 pt-3 shadow-2xl">
      <div className="mx-auto h-1.5 w-10 rounded-full bg-[#DDE1E7]" />
      <div className="mt-5 flex items-center justify-between"><h2 className="text-[23px] font-bold">일정 {event.title ? '편집' : '추가'}</h2><button onClick={onClose} className="min-h-11 px-2 text-[16px] font-semibold text-[#5B6270]">닫기</button></div>
      <label className="mt-5 block text-sm font-semibold text-[#5B6270]">제목<input autoFocus value={draft.title} onChange={e => set('title', e.target.value)} placeholder="일정 제목" className="mt-1.5 h-12 w-full rounded-xl border border-[#E3E6EB] px-3 text-[17px] font-medium text-[#17191C] outline-none focus:border-[#1F5FD1]" /></label>
      <label className="mt-4 flex min-h-11 items-center justify-between text-[16px] font-semibold">종일<input type="checkbox" checked={draft.allDay} onChange={e => set('allDay', e.target.checked)} className="size-5 accent-[#1F5FD1]" /></label>
      <div className="mt-3 grid grid-cols-2 gap-3"><label className="block text-sm font-semibold text-[#5B6270]">시작 날짜<input type="date" value={draft.startDate} onChange={e => set('startDate', e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#E3E6EB] px-3 text-[16px] text-[#17191C]" /></label><label className="block text-sm font-semibold text-[#5B6270]">종료 날짜<input type="date" value={draft.endDate} onChange={e => set('endDate', e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#E3E6EB] px-3 text-[16px] text-[#17191C]" /></label></div>
      {!draft.allDay && <div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm font-semibold text-[#5B6270]">시작 시간<input type="time" value={draft.startTime} onChange={e => set('startTime', e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#E3E6EB] px-3 text-[#17191C]" /></label><label className="text-sm font-semibold text-[#5B6270]">종료 시간<input type="time" value={draft.endTime} onChange={e => set('endTime', e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#E3E6EB] px-3 text-[#17191C]" /></label></div>}
      {!valid && draft.title.trim() && <p className="mt-2 text-sm font-semibold text-[#B42318]">종료는 시작보다 뒤여야 해요.</p>}
      <div className="mt-4"><span className="text-sm font-semibold text-[#5B6270]">색상</span><div className="mt-2 flex gap-3">{colors.map(color => <button key={color.id} onClick={() => set('color', color.id)} className={`size-10 rounded-full border-2 ${color.className} ${draft.color === color.id ? 'ring-2 ring-[#1F5FD1] ring-offset-2' : ''}`} aria-label={color.label} />)}</div></div>
      <section className="mt-5 border-t border-[#E3E6EB] pt-4"><label className="block text-sm font-semibold text-[#5B6270]">반복<select value={draft.recurrence?.freq ?? 'none'} onChange={e => set('recurrence', e.target.value === 'none' ? null : { freq: e.target.value as NonNullable<CalendarEvent['recurrence']>['freq'], interval: 1, weekdays: e.target.value === 'weekly' ? [new Date(`${draft.startDate}T00:00:00`).getDay()] : undefined })} className="mt-1.5 h-11 w-full rounded-xl border border-[#E3E6EB] bg-white px-3 text-[#17191C]"><option value="none">안 함</option><option value="daily">매일</option><option value="weekly">매주</option><option value="monthly">매월</option><option value="yearly">매년</option></select></label>{draft.recurrence && <div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm font-semibold text-[#5B6270]">간격<input type="number" min="1" value={draft.recurrence.interval} onChange={e => set('recurrence', { ...draft.recurrence!, interval: Math.max(1, Number(e.target.value)) })} className="mt-1.5 h-11 w-full rounded-xl border border-[#E3E6EB] px-3" /></label><label className="text-sm font-semibold text-[#5B6270]">종료 날짜<input type="date" value={draft.recurrence.until ?? ''} onChange={e => set('recurrence', { ...draft.recurrence!, until: e.target.value || undefined })} className="mt-1.5 h-11 w-full rounded-xl border border-[#E3E6EB] px-3" /></label>{draft.recurrence.freq === 'weekly' && <div className="col-span-2 flex gap-1">{['일','월','화','수','목','금','토'].map((day, index) => <button key={day} onClick={() => { const current = draft.recurrence!.weekdays ?? []; set('recurrence', { ...draft.recurrence!, weekdays: current.includes(index) ? current.filter(value => value !== index) : [...current, index] }) }} className={`size-11 rounded-full text-sm font-semibold ${(draft.recurrence?.weekdays ?? []).includes(index) ? 'bg-[#1F5FD1] text-white' : 'bg-[#EEF0F3]'}`}>{day}</button>)}</div>}</div>}</section>
      {event.recurrence && <div className="mt-4"><p className="text-sm font-semibold text-[#5B6270]">반복 일정 적용 범위</p><div className="mt-2 grid grid-cols-3 gap-2">{([['one','이 일정만'],['after','이후'],['all','전체']] as const).map(([value,label]) => <button key={value} onClick={() => setScope(value)} className={`min-h-11 rounded-lg text-sm font-semibold ${scope === value ? 'bg-[#DCE8FB] text-[#1A4488]' : 'bg-[#EEF0F3]'}`}>{label}</button>)}</div></div>}
      <label className="mt-4 block text-sm font-semibold text-[#5B6270]">장소<input value={draft.location} onChange={e => set('location', e.target.value)} placeholder="장소 입력" className="mt-1.5 h-11 w-full rounded-xl border border-[#E3E6EB] px-3 text-[#17191C]" /></label>
      <label className="mt-4 block text-sm font-semibold text-[#5B6270]">메모<textarea value={draft.memo} onChange={e => set('memo', e.target.value)} placeholder="메모 입력" className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-[#E3E6EB] p-3 text-[#17191C]" /></label>
      <section className="mt-6 border-t border-[#E3E6EB] pt-5"><div className="flex items-center justify-between"><h3 className="text-[18px] font-bold">체크리스트</h3><span className="text-sm font-semibold text-[#5B6270]">{doneCount}/{draft.checklist.length} 완료</span></div><div className="mt-3 space-y-2">{draft.checklist.map(item => <div key={item.id} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={item.done} onChange={e => updateChecklist(item.id, { done: e.target.checked })} className="size-5 accent-[#1F5FD1]" /><input value={item.text} onChange={e => updateChecklist(item.id, { text: e.target.value })} className={`min-w-0 flex-1 border-b border-transparent bg-transparent py-1 outline-none focus:border-[#1F5FD1] ${item.done ? 'text-[#5B6270] line-through' : ''}`} /><button onClick={() => removeChecklist(item.id)} className="min-h-11 px-2 text-sm font-semibold text-[#B42318]">삭제</button></div>)}</div><div className="mt-2 flex gap-2"><input value={newChecklist} onChange={e => setNewChecklist(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newChecklist.trim()) { set('checklist', [...draft.checklist, { id: crypto.randomUUID(), text: newChecklist.trim(), done: false }]); setNewChecklist('') } }} placeholder="할 일 추가" className="h-11 min-w-0 flex-1 rounded-xl border border-[#E3E6EB] px-3" /><button onClick={() => { if (newChecklist.trim()) { set('checklist', [...draft.checklist, { id: crypto.randomUUID(), text: newChecklist.trim(), done: false }]); setNewChecklist('') } }} className="grid size-11 place-items-center rounded-xl bg-[#DCE8FB] text-[#1A4488]" aria-label="항목 추가"><Plus className="size-5" /></button></div></section>
      <button disabled={!valid} onClick={() => { onSave({ ...draft, title: draft.title.trim() }, event.recurrence ? scope : 'all', occurrenceDate); onClose() }} className="mt-7 min-h-12 w-full rounded-xl bg-[#1F5FD1] text-[17px] font-bold text-white disabled:bg-[#B9C2D3]">저장</button>
      {event.title && <button onClick={() => setConfirmDelete(true)} className="mt-3 min-h-11 w-full text-[15px] font-semibold text-[#B42318]">일정 삭제</button>}
      {confirmDelete && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-8"><div className="w-full rounded-2xl bg-white p-6"><h3 className="text-[19px] font-bold">일정을 삭제할까요?</h3><p className="mt-2 text-sm text-[#5B6270]">삭제한 일정은 되돌릴 수 없어요.</p><div className="mt-5 flex gap-2"><button onClick={() => setConfirmDelete(false)} className="min-h-11 flex-1 rounded-xl bg-[#EEF0F3] font-semibold">취소</button><button onClick={() => { onDelete(event, event.recurrence ? scope : 'all', occurrenceDate); onClose() }} className="min-h-11 flex-1 rounded-xl bg-[#B42318] font-semibold text-white">삭제</button></div></div></div>}
    </div>
  </div>
}
