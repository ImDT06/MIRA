import { addDays, shiftISODate, uid, WEEKDAYS } from '../../lib/utils'
import { notify } from '../../store/log'
import { occursOn, PRIORITY_RANK } from '../../store/selectors'
import { useApp } from '../../store/useApp'
import { useSim } from '../../store/useSim'
import type { Task, UserData, Workflow, WorkflowId } from '../../store/types'

// Thứ tự hiển thị các ngày trong tuần, bắt đầu từ Thứ Hai.
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export const scheduleLabel = ({ time, days }: Workflow) => {
  if (days.length === 7) return `${time}, hằng ngày`
  return `${time}, ${WEEK_ORDER.filter((day) => days.includes(day)).map((day) => WEEKDAYS[day]).join(', ')}`
}

const isOpen = (task: Task) => task.status === 'Cần làm' || task.status === 'Đang làm'

const byPriority = (tasks: Task[]) => [...tasks].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])

// Workflow chỉ đọc và tóm tắt, không thay đổi dữ liệu của người dùng.
function summarize(workflow: Workflow, data: UserData) {
  const today = addDays(0)
  const tomorrow = addDays(1)
  const lines: string[] = []
  const includes = (content: Workflow['contents'][number]) => workflow.contents.includes(content)

  if (workflow.id === 'morning') {
    const events = data.events.filter((event) => occursOn(event, today)).sort((a, b) => a.start.localeCompare(b.start))
    const tasks = byPriority(data.tasks.filter((task) => isOpen(task) && task.due === today))
    if (includes('Lịch')) lines.push(`Lịch: ${events.length ? events.map((event) => `${event.title} ${event.start}`).join(', ') : 'hôm nay chưa có lịch'}.`)
    if (includes('Việc')) lines.push(tasks.length ? `Việc: ${tasks.length} việc hôm nay, ưu tiên “${tasks[0].title}”.` : 'Việc: hôm nay chưa có việc nào.')
    if (includes('Nhắc nhở')) lines.push(`Nhắc nhở: ${data.tasks.filter((task) => isOpen(task) && task.due === tomorrow).length} việc có hạn ngày mai.`)
  }

  if (workflow.id === 'evening') {
    const todayTasks = data.tasks.filter((task) => task.due === today)
    const left = byPriority(todayTasks.filter(isOpen))
    if (includes('Việc')) lines.push(`Việc: đã xong ${todayTasks.filter((task) => task.status === 'Đã xong').length}, còn lại ${left.length}.`)
    if (includes('Lịch')) lines.push(`Lịch ngày mai: ${data.events.filter((event) => occursOn(event, tomorrow)).length} sự kiện.`)
    if (includes('Nhắc nhở')) lines.push(left.length ? `Gợi ý: ngày mai bắt đầu bằng “${left[0].title}”.` : 'Gợi ý: hôm nay bạn đã làm tốt, nghỉ ngơi nhé.')
  }

  if (workflow.id === 'weekly') {
    lines.push(data.goals.length ? `Mục tiêu: ${data.goals.map((goal) => `${goal.title} đạt ${goal.progress}%`).join(', ')}.` : 'Mục tiêu: bạn chưa có mục tiêu nào.')
    if (includes('Việc')) lines.push(`Việc: đã xong ${data.tasks.filter((task) => task.status === 'Đã xong').length}, còn lại ${data.tasks.filter(isOpen).length}.`)
    if (includes('Lịch')) {
      const count = Array.from({ length: 7 }, (_, index) => shiftISODate(today, index + 1)).reduce(
        (total, date) => total + data.events.filter((event) => occursOn(event, date)).length,
        0,
      )
      lines.push(`Lịch: ${count} sự kiện trong 7 ngày tới.`)
    }
    if (includes('Nhắc nhở')) lines.push(`Nhắc nhở: ${data.tasks.filter((task) => isOpen(task) && task.due < today).length} việc đã qua hạn.`)
    const lagging = [...data.goals].sort((a, b) => a.progress - b.progress)[0]
    lines.push(lagging ? `Gợi ý tuần sau: dành thêm thời gian cho “${lagging.title}”.` : 'Gợi ý tuần sau: thử đặt một mục tiêu nhỏ.')
  }

  return lines.join('\n')
}

export function runWorkflow(id: WorkflowId) {
  const sim = useSim.getState()
  const failed = sim.workflowFailure
  if (failed) sim.set({ workflowFailure: false })
  const runId = uid()

  useApp.getState().update((data) => {
    const workflow = data.workflows.find((item) => item.id === id)
    if (!workflow) return
    const at = new Date().toISOString()
    if (failed) {
      workflow.runs.unshift({ id: runId, at, trigger: 'Chạy ngay', status: 'Lỗi', summary: 'Mình chưa lấy được dữ liệu cho lần chạy này. Bạn thử chạy lại nhé.' })
      notify(data, { kind: 'error', title: `${workflow.title} chưa chạy được`, body: 'Bạn mở lịch sử để chạy lại nhé.', to: `/automation/${id}` })
      return
    }
    const summary = summarize(workflow, data)
    workflow.runs.unshift({ id: runId, at, trigger: 'Chạy ngay', status: 'Thành công', summary })
    const to = id === 'morning' ? '/today' : id === 'weekly' ? `/space/goals?summary=${runId}` : `/automation/${id}`
    notify(data, { kind: 'workflow', title: `${workflow.title} đã sẵn sàng`, body: summary.split('\n')[0], to })
  })
  return !failed
}
