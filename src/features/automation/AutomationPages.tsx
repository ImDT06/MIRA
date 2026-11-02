import { CalendarDays, Check, ChevronLeft, CircleAlert, Clock, Moon, Play, RefreshCw, Sun, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Card, Checkbox, Chip, PageHeader, Tag, Toggle } from '../../components/ui/Controls'
import { Dialog } from '../../components/ui/Dialog'
import { FieldError, TimeField } from '../../components/ui/Field'
import { cn, dateTimeLabel, sleep, WEEKDAYS_SHORT } from '../../lib/utils'
import { getData, updateData, useData } from '../../store/useApp'
import { useToast, toast } from '../../store/useToast'
import type { Workflow, WorkflowContent, WorkflowId, WorkflowRun } from '../../store/types'
import { runWorkflow, scheduleLabel, WEEK_ORDER } from './run'

const ICONS: Record<WorkflowId, LucideIcon> = { morning: Sun, evening: Moon, weekly: CalendarDays }
const CONTENTS: WorkflowContent[] = ['Lịch', 'Việc', 'Nhắc nhở']

const setEnabled = (id: WorkflowId, enabled: boolean) => {
  updateData((data) => {
    const workflow = data.workflows.find((item) => item.id === id)
    if (workflow) workflow.enabled = enabled
  })
  toast(enabled ? 'Đã bật quy trình' : 'Đã tắt quy trình')
}

async function runNow(id: WorkflowId) {
  await sleep(900)
  if (runWorkflow(id)) toast(getData().settings.notifications ? 'Đã chạy xong, kết quả ở phần Thông báo' : 'Đã chạy xong, kết quả ở lịch sử chạy')
  else useToast.getState().show({ text: 'Lần chạy này bị lỗi', kind: 'error' })
}

function RunButton({ id, small, label = 'Chạy ngay', disabled }: { id: WorkflowId; small?: boolean; label?: string; disabled?: boolean }) {
  const [running, setRunning] = useState(false)
  return (
    <Button
      variant="secondary"
      small={small}
      loading={running}
      disabled={disabled}
      onClick={async () => {
        setRunning(true)
        await runNow(id)
        setRunning(false)
      }}
    >
      {label === 'Chạy ngay' ? <Play size={20} /> : <RefreshCw size={20} />}
      {label}
    </Button>
  )
}

function StatusTag({ run }: { run: WorkflowRun }) {
  return run.status === 'Thành công' ? (
    <Tag tone="success">
      <Check size={16} aria-hidden="true" />
      Thành công
    </Tag>
  ) : (
    <Tag tone="danger">
      <CircleAlert size={16} aria-hidden="true" />
      Lỗi
    </Tag>
  )
}

// S13
export function AutomationPage() {
  const workflows = useData((data) => data.workflows)
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 pb-8 pt-2 md:px-8">
      <PageHeader title="Tự động hoá" description="MIRA chỉ đọc và tóm tắt, không tự thay đổi dữ liệu của bạn." />
      <ul className="flex flex-col gap-3">
        {workflows.map((workflow) => {
          const Icon = ICONS[workflow.id]
          const lastRun = workflow.runs[0]
          return (
            <li key={workflow.id}>
              <Card className="p-0">
                <div className="flex items-start gap-3 px-4 pt-3">
                  <span
                    className={cn('mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-ctl', workflow.enabled ? 'bg-accent-soft text-accent-strong' : 'bg-bg-muted text-text-secondary')}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <Link to={`/automation/${workflow.id}`} className="t-h5 rounded-tag transition-colors duration-150 ease-out hover:text-accent">
                      {workflow.title}
                    </Link>
                    <p className="t-small text-text-secondary">{workflow.description}</p>
                  </div>
                  <Toggle hideLabel label={workflow.enabled ? 'Đang bật' : 'Đang tắt'} srSuffix={workflow.title} checked={workflow.enabled} onChange={(enabled) => setEnabled(workflow.id, enabled)} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border-divider px-4 py-2">
                  <div className="t-caption min-w-0 flex-1 basis-52 text-text-secondary">
                    <p className="flex items-center gap-1">
                      <Clock size={14} className="shrink-0" aria-hidden="true" />
                      {workflow.enabled ? scheduleLabel(workflow) : `Đang tắt · ${scheduleLabel(workflow)}`}
                    </p>
                    {lastRun && (
                      <p className={cn('mt-0.5', lastRun.status === 'Lỗi' && 'text-danger')}>
                        Lần gần nhất: {dateTimeLabel(lastRun.at)} · {lastRun.status}
                      </p>
                    )}
                  </div>
                  <Link to={`/automation/${workflow.id}`} className="t-button press inline-flex h-10 items-center rounded-ctl px-3 text-accent hover:bg-accent-soft">
                    Cấu hình
                    <span className="sr-only">: {workflow.title}</span>
                  </Link>
                  <RunButton id={workflow.id} small />
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ConfigRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-1 py-4 first:pt-0 md:grid-cols-[120px_1fr] md:items-center">
      <p className="t-h5">{title}</p>
      <div>{children}</div>
    </div>
  )
}

function ConfigForm({ workflow }: { workflow: Workflow }) {
  const [time, setTime] = useState(workflow.time)
  const [days, setDays] = useState(workflow.days)
  const [contents, setContents] = useState(workflow.contents)
  const [error, setError] = useState('')

  const dirty =
    time !== workflow.time ||
    [...days].sort().join() !== [...workflow.days].sort().join() ||
    [...contents].sort().join() !== [...workflow.contents].sort().join()

  const save = () => {
    if (days.length === 0) return setError('Bạn chọn ít nhất một ngày chạy nhé.')
    if (contents.length === 0) return setError('Bạn chọn ít nhất một nội dung nhé.')
    if (!time) return setError('Bạn chọn giờ chạy nhé.')
    setError('')
    updateData((data) => {
      const target = data.workflows.find((item) => item.id === workflow.id)
      if (target) Object.assign(target, { time, days, contents, enabled: true })
    })
    toast(workflow.enabled ? 'Đã lưu cấu hình' : 'Đã lưu và bật quy trình')
  }

  return (
    <Card className="p-4">
      <div className="divide-y divide-border-divider">
        <ConfigRow title="Giờ chạy">
          <TimeField label="Giờ chạy" className="max-w-[200px] [&>label]:sr-only" value={time} onChange={(event) => setTime(event.target.value)} />
        </ConfigRow>
        <ConfigRow title="Ngày chạy">
          <div role="group" aria-label="Ngày chạy" className="flex flex-wrap gap-2">
            {WEEK_ORDER.map((day) => (
              <Chip key={day} selected={days.includes(day)} className="min-w-11 justify-center px-3" onClick={() => setDays(days.includes(day) ? days.filter((item) => item !== day) : [...days, day])}>
                {WEEKDAYS_SHORT[day]}
              </Chip>
            ))}
          </div>
        </ConfigRow>
        <ConfigRow title="Nội dung gồm">
          <div role="group" aria-label="Nội dung gồm" className="flex flex-wrap gap-x-6">
            {CONTENTS.map((content) => (
              <Checkbox
                key={content}
                label={content}
                checked={contents.includes(content)}
                onChange={(checked) => setContents(checked ? [...contents, content] : contents.filter((item) => item !== content))}
              />
            ))}
          </div>
        </ConfigRow>
      </div>
      {error && <FieldError>{error}</FieldError>}
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border-divider pt-4">
        <RunButton id={workflow.id} disabled={dirty} />
        {dirty && <span className="t-caption min-w-0 flex-1 text-text-secondary">Lưu thay đổi trước khi chạy thử nhé.</span>}
        <Button className="ml-auto" onClick={save} disabled={workflow.enabled && !dirty}>
          {workflow.enabled ? 'Lưu' : 'Lưu và bật'}
        </Button>
      </div>
    </Card>
  )
}

// S14
export function WorkflowConfigPage() {
  const { id } = useParams()
  const workflow = useData((data) => data.workflows.find((item) => item.id === id))
  const [viewing, setViewing] = useState<string | null>(null)
  if (!workflow) return <Navigate to="/automation" replace />
  const viewed = workflow.runs.find((run) => run.id === viewing)

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 pb-8 pt-2 md:px-8">
      <PageHeader
        title={workflow.title}
        description={workflow.description}
        back={
          <Link to="/automation" className="t-small -ml-1 inline-flex min-h-11 items-center gap-1 rounded-tag font-medium text-text-secondary hover:text-text-primary">
            <ChevronLeft size={16} aria-hidden="true" />
            Tự động hoá
          </Link>
        }
        actions={<Toggle label={workflow.enabled ? 'Đang bật' : 'Đang tắt'} srSuffix={workflow.title} checked={workflow.enabled} onChange={(enabled) => setEnabled(workflow.id, enabled)} />}
      />

      <ConfigForm workflow={workflow} />

      <Card className="p-4">
        <h2 className="t-h3">Lịch sử chạy</h2>
        {workflow.runs.length === 0 ? (
          <p className="t-small mt-1 text-text-secondary">Quy trình này chưa chạy lần nào.</p>
        ) : (
          <ul className="mt-1 divide-y divide-border-divider">
            {workflow.runs.map((run) => (
              <li key={run.id} className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 py-2')}>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="t-small">{dateTimeLabel(run.at)}</p>
                  <p className="t-caption text-text-secondary">{run.trigger}</p>
                </div>
                <StatusTag run={run} />
                {run.status === 'Lỗi' ? (
                  <RunButton id={workflow.id} small label="Chạy lại" />
                ) : (
                  <Button variant="text" small onClick={() => setViewing(run.id)}>
                    Xem kết quả
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {viewed && (
        <Dialog open onClose={() => setViewing(null)} title="Kết quả lần chạy">
          <p className="t-caption text-text-secondary">{dateTimeLabel(viewed.at)} · {viewed.trigger}</p>
          <p className="t-body mt-2 whitespace-pre-line">{viewed.summary}</p>
        </Dialog>
      )}
    </div>
  )
}
