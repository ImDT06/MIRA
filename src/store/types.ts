export type Priority = 'Cao' | 'Vừa' | 'Thấp'
export type TaskStatus = 'Cần làm' | 'Đang làm' | 'Đã xong' | 'Đã huỷ'
export type Mood = 'Vui' | 'Bình thường' | 'Căng thẳng' | 'Mệt'
export type Permission = 'calendar' | 'gmail'

export interface Task {
  id: string
  title: string
  due: string
  priority: Priority
  status: TaskStatus
}

export interface Memory {
  id: string
  content: string
  purpose?: string
  source: string
  createdAt: string
  updatedAt: string
  status: 'pending' | 'active'
}

export interface CalendarEvent {
  id: string
  title: string
  weekday: number
  // Ngày của sự kiện một lần, hoặc ngày bắt đầu của sự kiện lặp.
  date?: string
  start: string
  end: string
  source: 'google' | 'mira' | 'user'
  recurring: boolean
}

export interface Note {
  id: string
  title: string
  body: string
  createdAt: string
  source: 'mira' | 'user'
}

export interface Goal {
  id: string
  title: string
  progress: number
  status: 'Chưa bắt đầu' | 'Đang thực hiện' | 'Hoàn thành' | 'Tạm dừng'
}

export interface Habit {
  id: string
  title: string
  doneDates: string[]
}

export interface Slot {
  id: string
  weekday: number
  start: string
  end: string
}

export interface MemoryCard {
  kind: 'memory'
  memoryId: string
  content: string
  purpose: string
  why: string
  state: 'proposed' | 'editing' | 'saved' | 'dismissed' | 'deleted'
}

export interface ScheduleCard {
  kind: 'schedule'
  title: string
  slots: Slot[]
  alternatives: Slot[]
  why?: string
  state: 'draft' | 'done'
  eventIds?: string[]
  goalId?: string
}

export interface RescheduleCard {
  kind: 'reschedule'
  items: Array<{ taskId: string; title: string; from: string; to: string }>
  why: string
  state: 'draft' | 'kept' | 'done'
}

export interface NoteCard {
  kind: 'note'
  title: string
  body: string
  state: 'draft' | 'done'
  noteId?: string
}

export interface EmailCard {
  kind: 'email'
  to: string
  subject: string
  body: string
  toError?: string
  state: 'draft' | 'cancelled' | 'sent' | 'failed'
  sentAt?: string
}

export type Card = MemoryCard | ScheduleCard | RescheduleCard | NoteCard | EmailCard

export interface ChatContext {
  awaiting?: 'ielts-detail'
  emailMessageId?: string
}

export interface Attachment {
  id: string
  name: string
  size: number
  kind: 'image' | 'file'
  thumbnail?: string
}

export interface Message {
  id: string
  role: 'user' | 'mira'
  text: string
  attachments?: Attachment[]
  status: 'streaming' | 'done' | 'stopped' | 'error'
  tool?: { running: string; done: string; finished: boolean }
  card?: Card
  feedback?: 'up' | 'down'
  ctxBefore?: ChatContext
}

export interface Conversation {
  id: string
  title: string
  updatedAt: string
  temporary: boolean
  messages: Message[]
  ctx: ChatContext
  usedMemoryIds: string[]
}

export interface Activity {
  id: string
  at: string
  text: string
  permission: string
  undo?: { kind: 'schedule' | 'reschedule' | 'note'; conversationId: string; messageId: string }
  undone?: boolean
}

export type WorkflowId = 'morning' | 'evening' | 'weekly'
export type WorkflowContent = 'Lịch' | 'Việc' | 'Nhắc nhở'

export interface WorkflowRun {
  id: string
  at: string
  trigger: 'Theo lịch' | 'Chạy ngay'
  status: 'Thành công' | 'Lỗi'
  summary: string
}

export interface Workflow {
  id: WorkflowId
  title: string
  description: string
  enabled: boolean
  time: string
  days: number[]
  contents: WorkflowContent[]
  runs: WorkflowRun[]
}

export interface AppNotification {
  id: string
  at: string
  kind: 'workflow' | 'memory' | 'permission' | 'error'
  title: string
  body: string
  to: string
  read: boolean
}

export type Personality = 'Điềm tĩnh' | 'Thân thiện' | 'Thẳng thắn'

export interface Settings {
  personality: Personality
  notifications: boolean
  language: string
  timezone: string
}

export interface UserData {
  memories: Memory[]
  tasks: Task[]
  events: CalendarEvent[]
  notes: Note[]
  goals: Goal[]
  habits: Habit[]
  conversations: Conversation[]
  activeConversationId: string | null
  connections: { google: boolean; calendar: boolean; gmail: boolean }
  memoryEnabled: boolean
  slowMode: boolean
  checkin: { date: string; mood: Mood } | null
  activity: Activity[]
  workflows: Workflow[]
  notifications: AppNotification[]
  settings: Settings
}

export interface Account {
  name: string
  email: string
  password: string
  interests: string
  data: UserData
}

export type ThemePref = 'light' | 'dark' | 'system'
