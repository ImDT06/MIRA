import { Check, MessageCircle, Plus, Target, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button, IconButton } from '../../components/ui/Button'
import { Card, EmptyState, Tag, type TagTone } from '../../components/ui/Controls'
import { Dialog } from '../../components/ui/Dialog'
import { Field, SelectField } from '../../components/ui/Field'
import { addDays, cn, dayMonth, parseISODate, uid, weekDates, WEEKDAYS, WEEKDAYS_SHORT } from '../../lib/utils'
import { updateData, useData } from '../../store/useApp'
import { toast } from '../../store/useToast'
import type { Goal, Habit } from '../../store/types'

const GOAL_STATUSES: Goal['status'][] = ['Chưa bắt đầu', 'Đang thực hiện', 'Hoàn thành', 'Tạm dừng']
const STATUS_TONE: Record<Goal['status'], TagTone> = { 'Chưa bắt đầu': 'neutral', 'Đang thực hiện': 'accent', 'Hoàn thành': 'success', 'Tạm dừng': 'warning' }

function GoalDialog({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [progress, setProgress] = useState(goal?.progress ?? 0)
  const [status, setStatus] = useState<Goal['status']>(goal?.status ?? 'Chưa bắt đầu')
  const [error, setError] = useState('')

  const save = () => {
    if (!title.trim()) return setError('Bạn đặt tên cho mục tiêu này nhé.')
    updateData((data) => {
      const existing = data.goals.find((item) => item.id === goal?.id)
      if (existing) Object.assign(existing, { title: title.trim(), progress, status })
      else data.goals.push({ id: uid(), title: title.trim(), progress, status })
    })
    toast(goal ? 'Đã cập nhật mục tiêu' : 'Đã thêm mục tiêu')
    onClose()
  }

  const remove = () => {
    if (!goal) return
    updateData((data) => {
      data.goals = data.goals.filter((item) => item.id !== goal.id)
    })
    toast('Đã xoá mục tiêu', () =>
      updateData((data) => {
        data.goals.push(goal)
      }),
    )
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={goal ? 'Sửa mục tiêu' : 'Thêm mục tiêu'}
      footer={
        <>
          {goal && (
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
        <Field label="Tên mục tiêu" autoFocus value={title} error={error} onChange={(event) => setTitle(event.target.value)} />
        <SelectField label="Trạng thái" options={GOAL_STATUSES} value={status} onChange={(event) => setStatus(event.target.value as Goal['status'])} />
        <div>
          <label htmlFor="goal-progress" className="t-h5 mb-1 block">
            Tiến độ: {progress}%
          </label>
          <input
            id="goal-progress"
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            className="h-11 w-full accent-[var(--accent)]"
            onChange={(event) => setProgress(Number(event.target.value))}
          />
        </div>
      </div>
    </Dialog>
  )
}

function HabitDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const save = () => {
    if (!title.trim()) return setError('Bạn đặt tên cho thói quen này nhé.')
    updateData((data) => {
      data.habits.push({ id: uid(), title: title.trim(), doneDates: [] })
    })
    toast('Đã thêm thói quen')
    onClose()
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title="Thêm thói quen"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={save}>Lưu</Button>
        </>
      }
    >
      <Field label="Tên thói quen" autoFocus value={title} error={error} onChange={(event) => setTitle(event.target.value)} />
    </Dialog>
  )
}

function HabitRow({ habit }: { habit: Habit }) {
  const today = addDays(0)
  const days = weekDates(today)
  const count = days.filter((date) => habit.doneDates.includes(date)).length

  const toggle = (date: string) =>
    updateData((data) => {
      const target = data.habits.find((item) => item.id === habit.id)
      if (!target) return
      target.doneDates = target.doneDates.includes(date) ? target.doneDates.filter((item) => item !== date) : [...target.doneDates, date]
    })

  const remove = () => {
    updateData((data) => {
      data.habits = data.habits.filter((item) => item.id !== habit.id)
    })
    toast('Đã xoá thói quen', () =>
      updateData((data) => {
        data.habits.push(habit)
      }),
    )
  }

  return (
    <li className="relative flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <div className="min-w-0 flex-1 basis-40 max-sm:pr-11">
        <h3 className="t-h5">{habit.title}</h3>
        <p className="t-caption text-text-secondary">{count}/7 ngày tuần này</p>
      </div>
      <div className="flex items-center gap-1 max-sm:w-full max-sm:justify-between">
        {days.map((date) => {
          const done = habit.doneDates.includes(date)
          const dayName = WEEKDAYS[parseISODate(date).getDay()]
          return (
            <button
              key={date}
              type="button"
              disabled={date > today}
              aria-pressed={done}
              aria-current={date === today ? 'date' : undefined}
              aria-label={`${habit.title}, ${dayName} ${dayMonth(date)}`}
              onClick={() => toggle(date)}
              className={cn(
                't-caption press inline-flex size-10 items-center justify-center rounded-full border disabled:opacity-40',
                done ? 'border-accent bg-accent text-on-primary hover:bg-accent-strong' : 'hover:border-accent hover:bg-accent-soft',
                !done && (date === today ? 'border-2 border-accent font-bold text-accent-strong' : 'border-border-default'),
              )}
            >
              {done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : WEEKDAYS_SHORT[parseISODate(date).getDay()]}
            </button>
          )
        })}
      </div>
      <IconButton label={`Xoá thói quen: ${habit.title}`} className="hover:text-danger max-sm:absolute max-sm:right-0 max-sm:top-2" onClick={remove}>
        <Trash2 size={20} />
      </IconButton>
    </li>
  )
}

export function GoalsPage() {
  const navigate = useNavigate()
  const goals = useData((data) => data.goals)
  const habits = useData((data) => data.habits)
  const [editing, setEditing] = useState<Goal | 'new' | null>(null)
  const [addingHabit, setAddingHabit] = useState(false)
  const [params] = useSearchParams()
  const summaryRun = useData((data) => data.workflows.find((workflow) => workflow.id === 'weekly')?.runs.find((run) => run.id === params.get('summary')))

  return (
    <>
      {summaryRun && (
        <section aria-labelledby="weekly-heading" className="rounded-card bg-accent-soft p-4">
          <h2 id="weekly-heading" className="t-overline text-accent-strong">
            Tổng kết cuối tuần
          </h2>
          <p className="t-small mt-1 whitespace-pre-line">{summaryRun.summary}</p>
        </section>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="t-h3 mr-auto max-sm:w-full">Mục tiêu</h2>
        <Button variant="secondary" small className="max-sm:flex-1" onClick={() => navigate('/')}>
          <MessageCircle size={20} />
          Nhờ MIRA
        </Button>
        <Button small className="max-sm:flex-1" onClick={() => setEditing('new')}>
          <Plus size={20} />
          Thêm mục tiêu
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <EmptyState icon={<Target size={48} />} text="Chưa có mục tiêu nào. Bạn thêm mục tiêu đầu tiên hoặc nhờ MIRA lập kế hoạch nhé."
            action={
              <Button variant="secondary" small onClick={() => navigate('/')}>
                <MessageCircle size={20} />
                Lập kế hoạch cùng MIRA
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {goals.map((goal) => (
            <li key={goal.id}>
              <button
                type="button"
                onClick={() => setEditing(goal)}
                className="lift block h-full w-full rounded-card border border-transparent bg-bg-surface p-4 text-left shadow-card hover:border-border-default"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="t-h5 min-w-0">{goal.title}</span>
                  <Tag tone={STATUS_TONE[goal.status]}>{goal.status}</Tag>
                </span>
                <span
                  role="progressbar"
                  aria-valuenow={goal.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Tiến độ ${goal.title}`}
                  className="mt-3 block h-2 overflow-hidden rounded-full bg-bg-muted"
                >
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${goal.progress}%` }} />
                </span>
                <span className="t-caption mt-1 block text-text-secondary">{goal.progress}%</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h2 className="t-h3 mr-auto">Thói quen</h2>
        <Button variant="secondary" small onClick={() => setAddingHabit(true)}>
          <Plus size={20} />
          Thêm thói quen
        </Button>
      </div>
      {habits.length === 0 ? (
        <p className="t-small text-text-secondary">Chưa có thói quen nào.</p>
      ) : (
        <Card className="px-4 py-1">
          <ul className="divide-y divide-border-divider">
            {habits.map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </ul>
        </Card>
      )}

      {editing && <GoalDialog goal={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {addingHabit && <HabitDialog onClose={() => setAddingHabit(false)} />}
    </>
  )
}
