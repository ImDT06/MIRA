import { ListChecks, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { PriorityTag } from '../../components/PriorityTag'
import { Card, Checkbox, Chip, EmptyState, Tag } from '../../components/ui/Controls'
import { Dialog } from '../../components/ui/Dialog'
import { DateField, Field, SelectField } from '../../components/ui/Field'
import { RowMenu } from '../../components/ui/RowMenu'
import { addDays, cn, dueLabel, uid } from '../../lib/utils'
import { PRIORITY_RANK } from '../../store/selectors'
import { updateData, useData } from '../../store/useApp'
import { toast } from '../../store/useToast'
import type { Priority, Task, TaskStatus } from '../../store/types'

const STATUSES: TaskStatus[] = ['Cần làm', 'Đang làm', 'Đã xong', 'Đã huỷ']
const PRIORITIES: Priority[] = ['Cao', 'Vừa', 'Thấp']

type Draft = Omit<Task, 'id'> & { id?: string }

function TaskDialog({ draft, onClose }: { draft: Draft; onClose: () => void }) {
  const [form, setForm] = useState(draft)
  const [error, setError] = useState('')

  const save = () => {
    if (!form.title.trim()) return setError('Bạn đặt tên cho việc này nhé.')
    updateData((data) => {
      const title = form.title.trim()
      const existing = data.tasks.find((task) => task.id === form.id)
      if (existing) Object.assign(existing, form, { title })
      else data.tasks.push({ ...form, id: uid(), title })
    })
    toast(draft.id ? 'Đã cập nhật việc' : 'Đã thêm việc')
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={draft.id ? 'Sửa việc' : 'Thêm việc'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={save}>Lưu</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Tên việc" autoFocus value={form.title} error={error} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <DateField label="Hạn" value={form.due} onChange={(event) => setForm({ ...form, due: event.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Ưu tiên" options={PRIORITIES} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })} />
          <SelectField label="Trạng thái" options={STATUSES} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })} />
        </div>
      </div>
    </Dialog>
  )
}

function TaskRow({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const finished = task.status === 'Đã xong' || task.status === 'Đã huỷ'
  const remove = () => {
    updateData((data) => {
      data.tasks = data.tasks.filter((item) => item.id !== task.id)
    })
    toast('Đã xoá việc', () =>
      updateData((data) => {
        data.tasks.push(task)
      }),
    )
  }
  return (
    <li className="-mx-2 px-2 transition-colors duration-150 ease-out hover:rounded-ctl hover:bg-bg-muted/60 flex items-center gap-1 py-1">
      <Checkbox
        hideLabel
        label={`Đánh dấu xong: ${task.title}`}
        checked={task.status === 'Đã xong'}
        onChange={(checked) =>
          updateData((data) => {
            const target = data.tasks.find((item) => item.id === task.id)
            if (target) target.status = checked ? 'Đã xong' : 'Cần làm'
          })
        }
      />
      <p className={cn('t-body min-w-0 flex-1', finished && 'text-text-secondary line-through')}>{task.title}</p>
      {task.status === 'Đang làm' && <Tag tone="accent">Đang làm</Tag>}
      {task.status === 'Đã huỷ' && <Tag>Đã huỷ</Tag>}
      <PriorityTag priority={task.priority} />
      <RowMenu
        label={`Thao tác cho: ${task.title}`}
        items={[
          { label: 'Sửa', icon: Pencil, onSelect: onEdit },
          { label: 'Xoá', icon: Trash2, danger: true, onSelect: remove },
        ]}
      />
    </li>
  )
}

export function TasksPage() {
  const navigate = useNavigate()
  const tasks = useData((data) => data.tasks)
  const [filter, setFilter] = useState<TaskStatus | 'Tất cả'>('Tất cả')
  const [draft, setDraft] = useState<Draft | null>(null)

  // Nhóm theo ngày để thấy rõ việc nào hôm nay, việc nào đã dời sang mai.
  const groups = useMemo(() => {
    const visible = tasks
      .filter((task) => filter === 'Tất cả' || task.status === filter)
      .sort((a, b) => a.due.localeCompare(b.due) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    const today = addDays(0)
    const byLabel = new Map<string, Task[]>()
    for (const task of visible) {
      // Việc đã xong hoặc đã huỷ của những ngày trước không tính là quá hạn, gom xuống cuối danh sách.
      const open = task.status === 'Cần làm' || task.status === 'Đang làm'
      const label = task.due >= today ? dueLabel(task.due) : open ? 'Đã qua hạn' : 'Trước đó'
      byLabel.set(label, [...(byLabel.get(label) ?? []), task])
    }
    const rank = (label: string) => (label === 'Đã qua hạn' ? 0 : label === 'Trước đó' ? 2 : 1)
    return [...byLabel].sort(([a], [b]) => rank(a) - rank(b))
  }, [tasks, filter])

  const counts = useMemo(() => {
    const result: Record<string, number> = { 'Tất cả': tasks.length }
    for (const task of tasks) result[task.status] = (result[task.status] ?? 0) + 1
    return result
  }, [tasks])

  const blank: Draft = { title: '', due: addDays(0), priority: 'Vừa', status: 'Cần làm' }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Màn hẹp cuộn ngang để bộ lọc luôn gọn một hàng; chip bị cắt ở mép báo hiệu còn nội dung. */}
        <div className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:mr-auto md:w-auto md:flex-wrap md:overflow-visible md:px-0">
          {(['Tất cả', ...STATUSES] as const).map((status) => (
            <Chip key={status} selected={filter === status} className="shrink-0 whitespace-nowrap" onClick={() => setFilter(status)}>
              {status}
              <span className="t-caption opacity-70">{counts[status] ?? 0}</span>
            </Chip>
          ))}
        </div>
        <Button variant="secondary" small className="max-md:flex-1" onClick={() => navigate('/')}>
          <MessageCircle size={20} />
          Nhờ MIRA
        </Button>
        <Button small className="max-md:flex-1" onClick={() => setDraft(blank)}>
          <Plus size={20} />
          Thêm việc
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ListChecks size={48} />}
            text={filter === 'Tất cả' ? 'Chưa có việc nào. Bạn thêm việc đầu tiên hoặc nhờ MIRA nhé.' : `Không có việc nào ở trạng thái “${filter}”.`}
            action={
              filter === 'Tất cả' ? (
                <Button variant="secondary" small onClick={() => setDraft(blank)}>
                  <Plus size={20} />
                  Tạo việc đầu tiên
                </Button>
              ) : (
                <Button variant="text" small onClick={() => setFilter('Tất cả')}>
                  Xem tất cả việc
                </Button>
              )
            }
          />
        </Card>
      ) : (
        groups.map(([label, items]) => (
          <Card key={label} className="p-4">
            <h2 className={cn('t-overline', label === 'Đã qua hạn' ? 'text-danger' : 'text-text-secondary')}>{label}</h2>
            <ul className="mt-1 divide-y divide-border-divider">
              {items.map((task) => (
                <TaskRow key={task.id} task={task} onEdit={() => setDraft(task)} />
              ))}
            </ul>
          </Card>
        ))
      )}

      {draft && <TaskDialog draft={draft} onClose={() => setDraft(null)} />}
    </>
  )
}
