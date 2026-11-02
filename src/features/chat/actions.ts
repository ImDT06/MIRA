import { addDays, clockNow, uid } from '../../lib/utils'
import { logActivity } from '../../store/log'
import { updateData } from '../../store/useApp'
import { useToast, toast } from '../../store/useToast'
import type { Activity, Card, Slot, UserData } from '../../store/types'
import type { ActionSummary } from '../permissions/ActionConfirm'
import { findConversation } from './engine'
import { slotLabel } from './script'

export interface MessageRef {
  conversationId: string
  messageId: string
}

export const patchCard = <K extends Card['kind']>(
  ref: MessageRef,
  kind: K,
  recipe: (card: Extract<Card, { kind: K }>, data: UserData) => void,
) =>
  updateData((data) => {
    const message = findConversation(data, ref.conversationId)?.messages.find((item) => item.id === ref.messageId)
    if (message?.card?.kind === kind) recipe(message.card as Extract<Card, { kind: K }>, data)
  })

export function swapSlot(ref: MessageRef, takenId: string, replacement: Slot) {
  patchCard(ref, 'schedule', (card) => {
    card.slots = card.slots.map((slot) => (slot.id === takenId ? replacement : slot))
    card.alternatives = card.alternatives.filter((slot) => slot.id !== replacement.id)
  })
}

export function addIeltsGoal(ref: MessageRef) {
  const goalId = uid()
  patchCard(ref, 'schedule', (card, data) => {
    card.goalId = goalId
    data.goals.push({ id: goalId, title: 'IELTS 6.5', progress: 0, status: 'Đang thực hiện' })
  })
  toast('Đã thêm mục tiêu IELTS 6.5', () =>
    patchCard(ref, 'schedule', (card, data) => {
      card.goalId = undefined
      data.goals = data.goals.filter((goal) => goal.id !== goalId)
    }),
  )
}

// Nội dung hộp xác nhận S06: MIRA sẽ làm gì, trên dữ liệu nào, dùng quyền nào.
export function describeAction(card: Card): ActionSummary | null {
  switch (card.kind) {
    case 'schedule':
      return {
        title: 'Tạo lịch trên Google Calendar?',
        rows: [
          { label: 'Hành động', value: `Tạo ${card.slots.length} sự kiện lặp hằng tuần` },
          { label: 'Đối tượng', value: `“${card.title}” trên Google Calendar` },
          { label: 'Dữ liệu', value: card.slots.map(slotLabel).join('\n') },
          { label: 'Quyền', value: 'Google Calendar: tạo sự kiện' },
        ],
        permission: 'calendar',
        irreversible: false,
        confirmLabel: 'Xác nhận',
      }
    case 'reschedule':
      return {
        title: 'Dời việc sang ngày mai?',
        rows: [
          { label: 'Hành động', value: `Sửa hạn ${card.items.length} việc` },
          { label: 'Đối tượng', value: card.items.map((item) => item.title).join('\n') },
          { label: 'Dữ liệu', value: 'Hạn mới: ngày mai' },
          { label: 'Quyền', value: 'Không cần quyền bên ngoài' },
        ],
        permission: null,
        irreversible: false,
        confirmLabel: 'Xác nhận',
      }
    case 'note':
      return {
        title: 'Tạo ghi chú này?',
        rows: [
          { label: 'Hành động', value: 'Tạo 1 ghi chú' },
          { label: 'Đối tượng', value: 'Ghi chú trong Không gian' },
          { label: 'Dữ liệu', value: card.body },
          { label: 'Quyền', value: 'Không cần quyền bên ngoài' },
        ],
        permission: null,
        irreversible: false,
        confirmLabel: 'Xác nhận',
      }
    case 'email':
      return {
        title: 'Gửi email này?',
        rows: [
          { label: 'Hành động', value: 'Gửi email' },
          { label: 'Tới', value: card.to },
          { label: 'Tiêu đề', value: card.subject },
          { label: 'Quyền', value: 'Gmail: gửi email thay bạn' },
        ],
        permission: 'gmail',
        irreversible: true,
        confirmLabel: 'Xác nhận gửi',
      }
    default:
      return null
  }
}

const markUndone = (data: UserData, ref: MessageRef) => {
  const entry = data.activity.find((item) => item.undo?.messageId === ref.messageId && !item.undone)
  if (entry) entry.undone = true
}

const undoSchedule = (ref: MessageRef) =>
  patchCard(ref, 'schedule', (card, data) => {
    data.events = data.events.filter((event) => !card.eventIds?.includes(event.id))
    card.eventIds = undefined
    card.state = 'draft'
    markUndone(data, ref)
  })

const undoReschedule = (ref: MessageRef) =>
  patchCard(ref, 'reschedule', (card, data) => {
    for (const item of card.items) {
      const task = data.tasks.find((candidate) => candidate.id === item.taskId)
      if (task) task.due = item.from
    }
    card.state = 'draft'
    markUndone(data, ref)
  })

const undoNote = (ref: MessageRef) =>
  patchCard(ref, 'note', (card, data) => {
    data.notes = data.notes.filter((note) => note.id !== card.noteId)
    card.noteId = undefined
    card.state = 'draft'
    markUndone(data, ref)
  })

export const undoActivity = ({ undo }: Activity) => {
  if (!undo) return
  const ref = { conversationId: undo.conversationId, messageId: undo.messageId }
  if (undo.kind === 'schedule') undoSchedule(ref)
  if (undo.kind === 'reschedule') undoReschedule(ref)
  if (undo.kind === 'note') undoNote(ref)
  toast('Đã hoàn tác')
}

export function executeSchedule(ref: MessageRef) {
  let count = 0
  patchCard(ref, 'schedule', (card, data) => {
    const ids = card.slots.map((slot) => {
      const id = uid()
      data.events.push({ id, title: card.title, weekday: slot.weekday, start: slot.start, end: slot.end, source: 'mira', recurring: true })
      return id
    })
    count = ids.length
    card.eventIds = ids
    card.state = 'done'
    logActivity(data, `Tạo ${count} sự kiện “${card.title}”`, 'Google Calendar', { kind: 'schedule', ...ref })
  })
  toast(`Đã tạo ${count} sự kiện`, () => undoSchedule(ref))
}

export function executeReschedule(ref: MessageRef) {
  let count = 0
  patchCard(ref, 'reschedule', (card, data) => {
    for (const item of card.items) {
      const task = data.tasks.find((candidate) => candidate.id === item.taskId)
      if (task) task.due = item.to
    }
    count = card.items.length
    card.state = 'done'
    logActivity(data, `Dời ${count} việc sang ngày mai`, 'Trong MIRA', { kind: 'reschedule', ...ref })
  })
  toast(`Đã dời ${count} việc sang mai`, () => undoReschedule(ref))
}

export function executeNote(ref: MessageRef) {
  const noteId = uid()
  patchCard(ref, 'note', (card, data) => {
    data.notes.unshift({ id: noteId, title: card.title, body: card.body, createdAt: addDays(0), source: 'mira' })
    card.noteId = noteId
    card.state = 'done'
    logActivity(data, `Tạo ghi chú “${card.title}”`, 'Trong MIRA', { kind: 'note', ...ref })
  })
  toast('Đã tạo ghi chú', () => undoNote(ref))
}

export function executeEmail(ref: MessageRef, fail: boolean) {
  if (fail) {
    patchCard(ref, 'email', (card) => {
      card.state = 'failed'
    })
    useToast.getState().show({ text: 'Chưa gửi được email', kind: 'error' })
    return
  }
  patchCard(ref, 'email', (card, data) => {
    card.state = 'sent'
    card.sentAt = clockNow()
    logActivity(data, `Gửi email tới ${card.to}`, 'Gmail')
  })
  toast('Đã gửi email')
}
