import { CalendarDays, CalendarPlus, ListTodo, Moon, MessageCircle, Sun, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { WhyLink } from '../chat/Cards'
import { Checkin } from './Checkin'
import { Button } from '../../components/ui/Button'
import { PriorityTag } from '../../components/PriorityTag'
import { Card, Checkbox, PageHeader, Tag } from '../../components/ui/Controls'
import { addDays, cn, longDate, toMinutes } from '../../lib/utils'
import { occursOn, PRIORITY_RANK } from '../../store/selectors'
import { updateData, useApp, useData } from '../../store/useApp'
import type { Task } from '../../store/types'

const isOpen = (task: Task) => task.status === 'Cần làm' || task.status === 'Đang làm'

function BriefStat({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon size={16} className="shrink-0 text-brief-muted" aria-hidden="true" />
      <span className="t-small min-w-0">
        <span className="font-semibold">{value}</span> <span className="text-brief-muted">{label}</span>
      </span>
    </div>
  )
}

// Thẻ tổng hợp ngày; đây là gợi ý, không tự thay đổi dữ liệu. Chi tiết lịch nằm ở thẻ Lịch hôm nay bên cạnh.
function MorningBrief({ slowMode }: { slowMode: boolean }) {
  const navigate = useNavigate()
  const events = useData((data) => data.events)
  const tasks = useData((data) => data.tasks)
  const memories = useData((data) => data.memories)
  const memoryEnabled = useData((data) => data.memoryEnabled)
  const today = addDays(0)
  const tomorrow = addDays(1)

  const eventCount = useMemo(() => events.filter((event) => occursOn(event, today)).length, [events, today])
  const openToday = useMemo(() => tasks.filter((task) => isOpen(task) && task.due === today), [tasks, today])
  const topTask = useMemo(() => [...openToday].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])[0], [openToday])
  const dueTomorrow = useMemo(() => tasks.filter((task) => isOpen(task) && task.due === tomorrow).length, [tasks, tomorrow])
  const focusMemory = memoryEnabled ? memories.find((memory) => memory.status === 'active' && /tập trung/i.test(memory.content)) : undefined

  const suggestion = !topTask
    ? 'Hôm nay không có việc gấp, bạn có thể dành thời gian cho điều mình thích.'
    : slowMode
      ? `Hôm nay chỉ cần tập trung vào “${topTask.title}” thôi. Làm xong là đủ rồi.`
      : `Mình gợi ý làm “${topTask.title}” trước, khi bạn còn nhiều năng lượng.`
  const why = focusMemory
    ? `Mình dựa vào hạn và mức ưu tiên của việc, cùng điều đã ghi nhớ: “${focusMemory.content}”.`
    : 'Mình dựa vào hạn và mức ưu tiên của các việc trong hôm nay.'

  return (
    <section aria-labelledby="brief-heading" className="rounded-card bg-brief-bg p-5 text-brief-text">
      <div className="flex items-center gap-2">
        <Sun size={20} aria-hidden="true" />
        <h2 id="brief-heading" className="t-h3">
          Bản tin buổi sáng
        </h2>
      </div>

      <p className="t-h4 mt-3 font-normal">{suggestion}</p>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[rgb(255_255_255/0.15)] pt-3">
        <BriefStat icon={CalendarDays} value={eventCount} label="sự kiện" />
        <BriefStat icon={ListTodo} value={openToday.length} label="việc cần làm" />
        {!slowMode && <BriefStat icon={CalendarPlus} value={dueTomorrow} label="việc hạn ngày mai" />}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <WhyLink className="my-0 text-brief-text">{why}</WhyLink>
        <Button variant="secondary" small className="border-transparent !bg-[#fff] !text-[#1c1c22] hover:!bg-[#ececf0]" onClick={() => navigate('/')}>
          <MessageCircle size={20} />
          Hỏi MIRA
        </Button>
      </div>
    </section>
  )
}

// Dòng thời gian trong ngày: đã qua làm mờ, đánh dấu sự kiện đang diễn ra hoặc tiếp theo.
function TodayTimeline() {
  const events = useData((data) => data.events)
  const calendarConnected = useData((data) => data.connections.calendar)
  const today = addDays(0)
  const [minutes, setMinutes] = useState(() => new Date().getHours() * 60 + new Date().getMinutes())
  useEffect(() => {
    const timer = setInterval(() => setMinutes(new Date().getHours() * 60 + new Date().getMinutes()), 60_000)
    return () => clearInterval(timer)
  }, [])
  const items = useMemo(() => events.filter((event) => occursOn(event, today)).sort((a, b) => a.start.localeCompare(b.start)), [events, today])
  const nextId = items.find((event) => toMinutes(event.end) > minutes)?.id

  return (
    <Card className="p-4">
      <SideHeading title="Lịch hôm nay" to="/space/calendar" action="Mở lịch" />
      {items.length === 0 ? (
        <p className="t-small mt-2 text-text-secondary">Hôm nay chưa có lịch nào.</p>
      ) : (
        <ol className="mt-2">
          {items.map((event, index) => {
            const past = toMinutes(event.end) <= minutes
            const current = toMinutes(event.start) <= minutes && !past
            return (
              <li key={event.id} className="relative flex gap-3">
                <div className="flex w-3 shrink-0 flex-col items-center pt-4" aria-hidden="true">
                  <span className={cn('size-2.5 shrink-0 rounded-full', event.id === nextId ? 'bg-accent' : 'bg-border-default')} />
                  {index < items.length - 1 && <span className="w-px flex-1 bg-border-default" />}
                </div>
                <Link
                  to={`/space/calendar?event=${event.id}&date=${today}`}
                  className={cn('-mx-1 min-w-0 flex-1 rounded-tag px-1 py-2 transition-colors duration-150 ease-out hover:bg-bg-muted', past && 'opacity-55')}
                >
                  <span className="t-caption block text-text-secondary">
                    {event.start}–{event.end}
                  </span>
                  <span className="t-small flex flex-wrap items-center gap-x-2 font-medium">
                    {event.title}
                    {event.id === nextId && <Tag tone="accent">{current ? 'Đang diễn ra' : 'Tiếp theo'}</Tag>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
      {!calendarConnected && (
        <Link to="/connections" className="t-small mt-1 inline-flex min-h-11 items-center font-semibold text-accent hover:underline">
          Kết nối lịch
        </Link>
      )}
    </Card>
  )
}

function SideHeading({ title, to, action }: { title: string; to: string; action: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="t-h4">{title}</h2>
      <Link to={to} className="t-small inline-flex min-h-8 items-center font-medium text-accent hover:underline">
        {action}
      </Link>
    </div>
  )
}

function GoalsSummary() {
  const goals = useData((data) => data.goals)
  const visible = goals.filter((goal) => goal.status !== 'Hoàn thành').slice(0, 3)
  if (visible.length === 0) return null
  return (
    <Card className="p-4">
      <SideHeading title="Mục tiêu" to="/space/goals" action="Xem tất cả" />
      <ul className="mt-3 flex flex-col gap-3">
        {visible.map((goal) => (
          <li key={goal.id}>
            <div className="t-small flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate">{goal.title}</span>
              <span className="t-caption shrink-0 text-text-secondary">{goal.progress}%</span>
            </div>
            <span
              role="progressbar"
              aria-valuenow={goal.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Tiến độ ${goal.title}`}
              className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-bg-muted"
            >
              <span className="block h-full rounded-full bg-accent transition-[width] duration-300 ease-out" style={{ width: `${goal.progress}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function HabitsToday() {
  const habits = useData((data) => data.habits)
  const today = addDays(0)
  if (habits.length === 0) return null
  return (
    <Card className="p-4">
      <h2 className="t-h4">Thói quen hôm nay</h2>
      <ul className="mt-1">
        {habits.map((habit) => (
          <li key={habit.id}>
            <Checkbox
              label={habit.title}
              checked={habit.doneDates.includes(today)}
              onChange={(checked) =>
                updateData((data) => {
                  const target = data.habits.find((item) => item.id === habit.id)
                  if (target) target.doneDates = checked ? [...target.doneDates, today] : target.doneDates.filter((date) => date !== today)
                })
              }
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function PriorityTasks({ slowMode }: { slowMode: boolean }) {
  const tasks = useData((data) => data.tasks)
  const update = useApp((state) => state.update)
  const today = addDays(0)
  const visible = useMemo(() => {
    const sorted = tasks
      .filter((task) => task.due === today && task.status !== 'Đã huỷ')
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    return slowMode ? sorted.slice(0, 1) : sorted
  }, [tasks, today, slowMode])
  const doneCount = visible.filter((task) => task.status === 'Đã xong').length

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <div className="flex items-baseline gap-2">
          <h2 className="t-h3">Việc ưu tiên</h2>
          {visible.length > 0 && <span className="t-small text-text-secondary">{doneCount}/{visible.length} xong</span>}
        </div>
        <Link to="/space/tasks" className="t-small inline-flex min-h-11 items-center font-semibold text-accent hover:underline">
          Xem tất cả việc
        </Link>
      </div>
      {visible.length === 0 ? (
        <p className="t-small mt-2 text-text-secondary">Hôm nay chưa có việc nào cần làm.</p>
      ) : (
        <ul className="divide-y divide-border-divider">
          {visible.map((task) => {
            const done = task.status === 'Đã xong'
            return (
              <li key={task.id} className="-mx-2 px-2 transition-colors duration-150 ease-out hover:rounded-ctl hover:bg-bg-muted/60 flex items-center gap-1">
                <Checkbox
                  hideLabel
                  label={`Đánh dấu xong: ${task.title}`}
                  checked={done}
                  onChange={(checked) =>
                    update((data) => {
                      const target = data.tasks.find((item) => item.id === task.id)
                      if (target) target.status = checked ? 'Đã xong' : 'Cần làm'
                    })
                  }
                />
                <p className={cn('t-body min-w-0 flex-1 py-2', done && 'text-text-secondary line-through')}>{task.title}</p>
                <PriorityTag priority={task.priority} />
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export function TodayPage() {
  const navigate = useNavigate()
  const hasData = useData((data) => data.tasks.length > 0 || data.events.length > 0)
  const slowMode = useData((data) => data.slowMode)

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-4 pb-8 pt-2 md:px-8">
      <PageHeader title="Hôm nay" description={longDate()} />

      {slowMode && (
        <div className="flex flex-wrap items-center gap-3 rounded-card bg-accent-soft p-5">
          <Moon size={24} className="shrink-0 text-accent-strong" aria-hidden="true" />
          <p className="t-body min-w-[200px] flex-1">
            Hôm nay mình đi chậm lại nhé. Mình chỉ giữ việc thật cần thiết và sẽ nhắc ít hơn.
          </p>
          <Button variant="secondary" small onClick={() => navigate('/')}>
            Nói với MIRA
          </Button>
        </div>
      )}

      {hasData ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            <MorningBrief slowMode={slowMode} />
            <Card className="p-4">
              <Checkin />
            </Card>
            <PriorityTasks slowMode={slowMode} />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <TodayTimeline />
            <GoalsSummary />
            <HabitsToday />
          </div>
        </div>
      ) : (
        <>
        <Card>
          <Checkin />
        </Card>
        <Card className="flex flex-wrap items-center gap-4">
          <p className="t-body min-w-[200px] flex-1">Hãy kể cho mình về tuần này.</p>
          <Button onClick={() => navigate('/')}>
            <MessageCircle size={20} />
            Hỏi MIRA
          </Button>
        </Card>
        </>
      )}
    </div>
  )
}
