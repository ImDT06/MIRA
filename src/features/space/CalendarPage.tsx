import { ChevronLeft, ChevronRight, CircleAlert, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ActionConfirm, type ActionSummary } from '../permissions/ActionConfirm'
import { Button, IconButton } from '../../components/ui/Button'
import { Card, Checkbox, Segmented } from '../../components/ui/Controls'
import { Dialog } from '../../components/ui/Dialog'
import { DateField, Field, FieldError, TimeField } from '../../components/ui/Field'
import { addDays, cn, dayMonth, fromMinutes, parseISODate, shiftISODate, toMinutes, uid, weekDates, WEEKDAYS } from '../../lib/utils'
import { logActivity } from '../../store/log'
import { occursOn } from '../../store/selectors'
import { getData, updateData, useData } from '../../store/useApp'
import { toast } from '../../store/useToast'
import type { CalendarEvent } from '../../store/types'

const HOUR_HEIGHT = 56
const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const SOURCE_LABEL: Record<CalendarEvent['source'], string> = { google: 'Google', mira: 'MIRA tạo', user: 'Bạn tạo' }

const overlaps = (a: Pick<CalendarEvent, 'start' | 'end'>, b: Pick<CalendarEvent, 'start' | 'end'>) =>
  toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end)

// Sự kiện trùng giờ được xếp thành các làn cạnh nhau, tính riêng cho từng cụm trùng.
function layoutDay(events: CalendarEvent[]) {
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start))
  const placed: Array<{ event: CalendarEvent; lane: number; lanes: number }> = []
  let cluster: typeof placed = []
  let clusterEnd = -1

  const closeCluster = () => {
    const lanes = Math.max(0, ...cluster.map((item) => item.lane)) + 1
    for (const item of cluster) item.lanes = lanes
    placed.push(...cluster)
    cluster = []
  }

  for (const event of sorted) {
    if (toMinutes(event.start) >= clusterEnd) {
      closeCluster()
      clusterEnd = -1
    }
    const used = cluster.filter((item) => overlaps(item.event, event)).map((item) => item.lane)
    let lane = 0
    while (used.includes(lane)) lane++
    cluster.push({ event, lane, lanes: 1 })
    clusterEnd = Math.max(clusterEnd, toMinutes(event.end))
  }
  closeCluster()
  return placed
}

interface EventForm {
  id?: string
  title: string
  date: string
  start: string
  end: string
  recurring: boolean
  source: CalendarEvent['source']
}

const onGoogle = (source: CalendarEvent['source']) => source !== 'user'

const nextFreeStart = (others: CalendarEvent[], form: EventForm) => {
  const duration = toMinutes(form.end) - toMinutes(form.start)
  let start = toMinutes(form.start)
  for (let guard = 0; guard < 96 && start + duration <= 24 * 60; guard++) {
    const candidate = { start: fromMinutes(start), end: fromMinutes(start + duration) }
    const blocking = others.find((event) => overlaps(event, candidate))
    if (!blocking) return candidate
    start = toMinutes(blocking.end)
  }
  return null
}

function applyEvent(form: EventForm) {
  const previous = getData().events.find((event) => event.id === form.id)
  const id = form.id ?? uid()
  updateData((data) => {
    const next: CalendarEvent = {
      id,
      title: form.title.trim(),
      date: form.date,
      weekday: parseISODate(form.date).getDay(),
      start: form.start,
      end: form.end,
      recurring: form.recurring,
      source: form.source,
    }
    data.events = [...data.events.filter((event) => event.id !== id), next]
    if (onGoogle(form.source)) logActivity(data, `Sửa sự kiện “${next.title}”`, 'Google Calendar')
  })
  toast(previous ? 'Đã cập nhật sự kiện' : 'Đã tạo sự kiện', () =>
    updateData((data) => {
      data.events = data.events.filter((event) => event.id !== id)
      if (previous) data.events.push(previous)
    }),
  )
}

function removeEvent(event: CalendarEvent) {
  updateData((data) => {
    data.events = data.events.filter((item) => item.id !== event.id)
    if (onGoogle(event.source)) logActivity(data, `Xoá sự kiện “${event.title}”`, 'Google Calendar')
  })
  toast('Đã xoá sự kiện', () =>
    updateData((data) => {
      data.events.push(event)
    }),
  )
}

function EventDialog({ initial, onClose }: { initial: EventForm; onClose: () => void }) {
  const events = useData((data) => data.events)
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<{ title?: string; end?: string }>({})
  const [pending, setPending] = useState<{ summary: ActionSummary; run: () => void } | null>(null)

  const others = useMemo(() => {
    if (!form.date) return []
    return events.filter((event) => event.id !== form.id && occursOn(event, form.date))
  }, [events, form.date, form.id])

  const validTime = toMinutes(form.end) > toMinutes(form.start)
  const clash = validTime ? others.find((event) => overlaps(event, form)) : undefined
  const suggestion = clash ? nextFreeStart(others, form) : null

  const existing = initial.id ? events.find((event) => event.id === initial.id) : undefined

  const save = () => {
    const next: typeof errors = {}
    if (!form.title.trim()) next.title = 'Bạn đặt tên cho sự kiện này nhé.'
    if (!validTime) next.end = 'Giờ kết thúc cần sau giờ bắt đầu.'
    setErrors(next)
    if (next.title || next.end) return
    if (existing && onGoogle(existing.source)) {
      setPending({
        summary: {
          title: 'Sửa sự kiện trên Google Calendar?',
          rows: [
            { label: 'Hành động', value: form.recurring ? 'Sửa toàn bộ chuỗi lặp hằng tuần' : 'Sửa 1 sự kiện' },
            { label: 'Đối tượng', value: `“${existing.title}” trên Google Calendar` },
            { label: 'Dữ liệu', value: `${form.title.trim()}\n${WEEKDAYS[parseISODate(form.date).getDay()]} ${dayMonth(form.date)}, ${form.start}–${form.end}` },
            { label: 'Quyền', value: 'Google Calendar: tạo sự kiện' },
          ],
          permission: 'calendar',
          irreversible: false,
          confirmLabel: 'Xác nhận',
        },
        run: () => {
          applyEvent(form)
          onClose()
        },
      })
      return
    }
    applyEvent(form)
    onClose()
  }

  const remove = () => {
    if (!existing) return
    if (onGoogle(existing.source)) {
      setPending({
        summary: {
          title: 'Xoá sự kiện trên Google Calendar?',
          rows: [
            { label: 'Hành động', value: existing.recurring ? 'Xoá toàn bộ chuỗi lặp hằng tuần' : 'Xoá 1 sự kiện' },
            { label: 'Đối tượng', value: `“${existing.title}” trên Google Calendar` },
            { label: 'Quyền', value: 'Google Calendar: tạo sự kiện' },
          ],
          permission: 'calendar',
          irreversible: false,
          confirmLabel: 'Xác nhận xoá',
        },
        run: () => {
          removeEvent(existing)
          onClose()
        },
      })
      return
    }
    removeEvent(existing)
    onClose()
  }

  if (pending) return <ActionConfirm summary={pending.summary} onConfirm={pending.run} onCancel={() => setPending(null)} />

  return (
    <Dialog
      open
      onClose={onClose}
      title={existing ? 'Sửa sự kiện' : 'Thêm sự kiện'}
      footer={
        <>
          {existing && (
            <Button variant="danger" className="mr-auto" onClick={remove}>
              <Trash2 size={20} />
              Xoá
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={save}>Lưu</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Tên sự kiện" autoFocus value={form.title} error={errors.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <DateField label="Ngày" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <TimeField label="Bắt đầu" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} />
          <div>
            <TimeField label="Kết thúc" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} />
            {errors.end && <FieldError>{errors.end}</FieldError>}
          </div>
        </div>
        <Checkbox label="Lặp lại hằng tuần" checked={form.recurring} onChange={(recurring) => setForm({ ...form, recurring })} />
        {clash && (
          <div className="t-small rounded-ctl bg-warning-soft p-3 text-warning" role="status">
            <p className="flex items-start gap-2">
              <CircleAlert size={20} className="shrink-0" aria-hidden="true" />
              Trùng với “{clash.title}” ({clash.start}–{clash.end}).
            </p>
            {suggestion && (
              <Button variant="secondary" small className="mt-2" onClick={() => setForm({ ...form, ...suggestion })}>
                Đổi sang {suggestion.start}–{suggestion.end}
              </Button>
            )}
          </div>
        )}
      </div>
    </Dialog>
  )
}

// Vạch giờ hiện tại, tự cập nhật mỗi phút.
function NowLine() {
  const read = () => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  }
  const [minutes, setMinutes] = useState(read)
  useEffect(() => {
    const timer = setInterval(() => setMinutes(read()), 60_000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-[5] h-0.5 bg-accent-strong" style={{ top: (minutes / 60) * HOUR_HEIGHT }}>
      <span className="absolute -left-1 -top-1 size-2.5 rounded-full bg-accent-strong" />
    </div>
  )
}

function DayColumn({ date, events, highlightId, onOpen }: { date: string; events: CalendarEvent[]; highlightId: string | null; onOpen: (event: CalendarEvent) => void }) {
  const placed = useMemo(() => layoutDay(events.filter((event) => occursOn(event, date))), [events, date])
  const isToday = date === addDays(0)
  return (
    <div className={cn('relative min-w-0 flex-1 border-l border-border-divider', isToday && 'bg-accent-soft/30')} style={{ height: HOUR_HEIGHT * 24 }}>
      {HOURS.map((hour) => (
        <div key={hour} className="border-b border-border-divider" style={{ height: HOUR_HEIGHT }} />
      ))}
      {isToday && <NowLine />}
      {placed.map(({ event, lane, lanes }) => {
        const top = (toMinutes(event.start) / 60) * HOUR_HEIGHT
        const height = Math.max(((toMinutes(event.end) - toMinutes(event.start)) / 60) * HOUR_HEIGHT - 2, 24)
        return (
          <button
            key={event.id}
            type="button"
            data-event-id={event.id}
            onClick={() => onOpen(event)}
            aria-label={`${event.title}, ${event.start} đến ${event.end}, ${SOURCE_LABEL[event.source]}`}
            title={`${event.title}, ${event.start}–${event.end}, ${SOURCE_LABEL[event.source]}`}
            className={cn(
              'absolute z-[1] flex flex-col justify-start overflow-hidden rounded-tag border-l-[3px] px-2 py-0.5 text-left transition-shadow duration-150 ease-out hover:shadow-float',
              event.source === 'google' ? 'border-text-secondary bg-bg-muted' : 'border-accent bg-accent-soft',
              highlightId === event.id && 'outline-2 outline-offset-1 outline-accent',
            )}
            style={{ top, height, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
          >
            <span className="t-caption block truncate font-semibold">{event.title}</span>
            {height >= 40 && <span className="t-caption block truncate text-text-secondary">{event.start}–{event.end}</span>}
            {height >= 64 && <span className={cn('t-caption block truncate', event.source === 'google' ? 'text-text-secondary' : 'text-accent-strong')}>{SOURCE_LABEL[event.source]}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function CalendarPage() {
  const events = useData((data) => data.events)
  const [params] = useSearchParams()
  const highlightId = params.get('event')
  const today = addDays(0)
  const [anchor, setAnchor] = useState(params.get('date') ?? today)
  const [view, setView] = useState(() => (matchMedia('(max-width: 767.98px)').matches || highlightId ? 'day' : 'week'))
  const [form, setForm] = useState<EventForm | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const dates = view === 'week' ? weekDates(anchor) : [anchor]

  useEffect(() => {
    const highlighted = events.find((event) => event.id === highlightId)
    // Đang xem hôm nay thì mở quanh giờ hiện tại nhưng giữ trong giờ làm việc, để buổi tối vẫn thấy lịch trong ngày.
    const fallback = dates.includes(today) ? Math.min(Math.max(new Date().getHours() - 1, 7), 12) : 7
    const hour = highlighted ? Math.max(toMinutes(highlighted.start) / 60 - 1, 0) : fallback
    if (scrollRef.current) scrollRef.current.scrollTop = hour * HOUR_HEIGHT
    // Chỉ cuộn khi vào màn hoặc đổi kiểu xem, không cuộn lại khi dữ liệu đổi.
  }, [view, highlightId])

  const step = (direction: number) => setAnchor(shiftISODate(anchor, direction * (view === 'week' ? 7 : 1)))
  const rangeLabel = view === 'week' ? `${dayMonth(dates[0])} – ${dayMonth(dates[6])}` : `${WEEKDAYS[parseISODate(anchor).getDay()]}, ${dayMonth(anchor)}`

  const open = (event: CalendarEvent, date: string) =>
    setForm({ id: event.id, title: event.title, date: event.date ?? date, start: event.start, end: event.end, recurring: event.recurring, source: event.source })

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" small disabled={dates.includes(today)} onClick={() => setAnchor(today)}>
          Hôm nay
        </Button>
        <div className="flex items-center">
          <IconButton label={view === 'week' ? 'Tuần trước' : 'Hôm trước'} onClick={() => step(-1)}>
            <ChevronLeft size={20} />
          </IconButton>
          <span className="t-small min-w-[116px] text-center font-semibold" aria-live="polite">
            {rangeLabel}
          </span>
          <IconButton label={view === 'week' ? 'Tuần sau' : 'Hôm sau'} onClick={() => step(1)}>
            <ChevronRight size={20} />
          </IconButton>
        </div>
        <div className="ml-auto flex items-center gap-2 max-sm:ml-0 max-sm:w-full max-sm:justify-between">
          <Segmented
            compact
            label="Kiểu xem lịch"
            value={view}
            onChange={setView}
            options={[
              { value: 'day', label: 'Ngày' },
              { value: 'week', label: 'Tuần' },
            ]}
          />
          <Button small onClick={() => setForm({ title: '', date: anchor, start: '09:00', end: '10:00', recurring: false, source: 'user' })}>
            <Plus size={20} />
            Thêm sự kiện
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div ref={scrollRef} className="max-h-[calc(100dvh-240px)] min-h-[360px] overflow-auto">
          <div className={cn(view === 'week' && 'min-w-[720px]')}>
            <div className="sticky top-0 z-10 flex border-b border-border-divider bg-bg-surface">
              <div className="w-14 shrink-0" />
              {dates.map((date) => (
                <div key={date} aria-current={date === today ? 'date' : undefined} className="min-w-0 flex-1 border-l border-border-divider py-2 text-center">
                  <span className={cn('t-caption block', date === today ? 'font-semibold text-accent-strong' : 'text-text-secondary')}>{WEEKDAYS[parseISODate(date).getDay()]}</span>
                  <span className={cn('t-small mt-0.5 inline-flex h-6 items-center rounded-full px-2 font-semibold', date === today && 'bg-accent text-on-primary')}>{dayMonth(date)}</span>
                </div>
              ))}
            </div>
            <div className="flex">
              <div className="w-14 shrink-0">
                {HOURS.map((hour) => (
                  <div key={hour} className="t-caption pr-2 text-right text-text-secondary" style={{ height: HOUR_HEIGHT }}>
                    {/* Nhãn giờ nằm ngay trên vạch kẻ của giờ đó; 00:00 bị đầu cột che nên bỏ. */}
                    {hour > 0 && <span className="block -translate-y-2">{fromMinutes(hour * 60)}</span>}
                  </div>
                ))}
              </div>
              {dates.map((date) => (
                <DayColumn key={date} date={date} events={events} highlightId={highlightId} onOpen={(event) => open(event, date)} />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {form && <EventDialog initial={form} onClose={() => setForm(null)} />}
    </>
  )
}
