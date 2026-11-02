import { addDays, fromMinutes, isEmail, toMinutes, uid, WEEKDAYS } from '../../lib/utils'
import type { Attachment, Card, ChatContext, Conversation, EmailCard, Slot, UserData } from '../../store/types'

export interface Reply {
  text: string
  tool?: { running: string; done: string }
  card?: Card
  ctx?: ChatContext
  usedMemoryIds?: string[]
  effect?: (data: UserData, conversation: Conversation) => void
}

export const SUGGESTIONS = [
  { label: 'Chia sẻ áp lực', prompt: 'Mình thấy áp lực vì deadline quá' },
  { label: 'Xếp lịch ôn IELTS', prompt: 'Xếp giúp mình lịch ôn IELTS' },
  { label: 'Soạn email', prompt: 'Soạn giúp mình mail xin thầy dời buổi họp sang thứ Sáu' },
  { label: 'Hôm nay mình kiệt sức', prompt: 'Hôm nay mình kiệt sức quá' },
]

// Chỉ dùng trí nhớ đã được duyệt, và không dùng khi tắt trí nhớ hoặc đang ở trò chuyện tạm thời.
const memoryAllowed = (data: UserData, conversation: Conversation) => data.memoryEnabled && !conversation.temporary

const findMemory = (data: UserData, conversation: Conversation, pattern: RegExp) =>
  memoryAllowed(data, conversation)
    ? data.memories.find((memory) => memory.status === 'active' && pattern.test(memory.content))
    : undefined

export const slotLabel = (slot: Slot) => `${WEEKDAYS[slot.weekday]} ${slot.start}–${slot.end}`

const pressureReply = (data: UserData, conversation: Conversation): Reply => {
  const chunking = findMemory(data, conversation, /chia nhỏ/i)
  const greeting = { 'Điềm tĩnh': 'Nghe bạn đang phải gồng nhiều thật.', 'Thân thiện': 'Ôi, nghe mệt thật đó, cảm ơn bạn đã kể với mình.', 'Thẳng thắn': 'Deadline đang dồn thì mình xử lý từng việc.' }[data.settings.personality]
  const opening = chunking
    ? `${greeting} Lần trước bạn đã vượt qua bằng cách chia nhỏ việc, mình thử lại cách đó nhé? Bạn kể mình nghe deadline nào đang đè nặng nhất.`
    : `${greeting} Bạn kể mình nghe deadline nào đang đè nặng nhất nhé, mình cùng gỡ từng phần.`

  const alreadyKnown = data.memories.some((memory) => /tập trung/i.test(memory.content))
  if (!memoryAllowed(data, conversation) || alreadyKnown) {
    return { text: opening, usedMemoryIds: chunking ? [chunking.id] : [] }
  }

  const memoryId = uid()
  const content = 'Buổi chiều dễ mất tập trung'
  const purpose = 'Để mình tránh xếp việc khó vào buổi chiều.'
  return {
    text: `${opening} Bạn cũng hay nhắc là chiều đến khó tập trung, mình muốn ghi nhớ điều này nếu bạn đồng ý.`,
    usedMemoryIds: chunking ? [chunking.id] : [],
    card: {
      kind: 'memory',
      memoryId,
      content,
      purpose,
      why: 'Bạn vừa chia sẻ về áp lực deadline và chuyện khó tập trung. Mình chưa lưu gì cả, việc này do bạn quyết định.',
      state: 'proposed',
    },
    // Thẻ bị bỏ qua vẫn nằm ở mục “Đang chờ bạn duyệt”, không tự lưu.
    effect: (draft) => {
      const today = addDays(0)
      draft.memories.unshift({
        id: memoryId,
        content,
        purpose,
        source: 'Từ trò chuyện',
        createdAt: today,
        updatedAt: today,
        status: 'pending',
      })
    },
  }
}

const askScheduleDetail = (data: UserData): Reply => {
  const calendar = data.connections.calendar
  return {
    text: `${calendar ? 'Mình đã xem qua lịch của bạn.' : 'Mình chưa xem được lịch Google nên sẽ đề xuất theo lịch trong MIRA.'} **Mỗi buổi bao lâu**, và bạn muốn học vào **buổi nào**?`,
    tool: calendar ? { running: 'Đang xem Google Calendar…', done: 'Đã xem lịch tuần này' } : undefined,
    ctx: { awaiting: 'ielts-detail' },
  }
}

const scheduleReply = (text: string, data: UserData, conversation: Conversation): Reply => {
  const duration = Number(/(\d+)\s*phút/.exec(text)?.[1] ?? 90)
  const start = /tối/.test(text) ? '19:30' : /chiều/.test(text) ? '14:00' : '08:00'
  const startMinutes = toMinutes(start)
  const end = fromMinutes(startMinutes + duration)

  const free = [1, 3, 5, 2, 4, 6].filter(
    (weekday) =>
      !data.events.some(
        (event) =>
          event.weekday === weekday && toMinutes(event.start) < startMinutes + duration && toMinutes(event.end) > startMinutes,
      ),
  )
  const slots: Slot[] = free.map((weekday) => ({ id: uid(), weekday, start, end }))

  const focusMemory = findMemory(data, conversation, /tập trung/i)
  const reason = focusMemory ? `Mình nhớ “${focusMemory.content}”, nên chọn các khung còn trống vào buổi sáng.` : 'Đây là các khung còn trống trong tuần.'

  return {
    text: `${reason} Bạn xem thử, thích khung nào thì giữ lại nhé.`,
    usedMemoryIds: focusMemory ? [focusMemory.id] : [],
    ctx: { awaiting: undefined },
    card: {
      kind: 'schedule',
      title: 'Ôn IELTS',
      slots: slots.slice(0, 3).sort((a, b) => a.weekday - b.weekday),
      alternatives: slots.slice(3).sort((a, b) => a.weekday - b.weekday),
      why: focusMemory ? `Mình dựa vào điều đã ghi nhớ: “${focusMemory.content}”, cùng lịch trống của bạn.` : 'Mình dựa vào lịch trống và buổi học bạn vừa chọn.',
      state: 'draft',
    },
  }
}

const emailReply = (): Reply => ({
  text: 'Mình soạn nháp ở dưới rồi. Mình chưa có email của thầy, bạn điền vào ô Tới hoặc nhắn địa chỉ cho mình nhé. Muốn đổi câu nào cứ nói.',
  card: {
    kind: 'email',
    to: '',
    subject: 'Xin dời buổi họp sang thứ Sáu',
    body: 'Em chào thầy,\n\nTuần này em có việc đột xuất nên không thể tham dự buổi họp như đã hẹn. Em xin phép dời buổi họp sang thứ Sáu nếu thầy thuận tiện.\n\nEm cảm ơn thầy.',
    state: 'draft',
  },
})

const editEmailReply = (text: string, messageId: string): Reply | null => {
  const address = text.match(/[^\s,;]+@[^\s,;]+/)?.[0]
  const addApology = /xin lỗi|báo muộn/.test(text)
  if (!(address && isEmail(address)) && !addApology) return null
  return {
    text: 'Mình đã cập nhật bản nháp ở trên. Bạn xem lại rồi bấm Gửi khi thấy ổn nhé.',
    effect: (_, conversation) => {
      const card = conversation.messages.find((message) => message.id === messageId)?.card as EmailCard | undefined
      if (!card) return
      if (address) {
        card.to = address
        card.toError = undefined
      }
      if (addApology && !card.body.includes('báo muộn')) {
        card.body = card.body.replace('Em cảm ơn thầy.', 'Em xin lỗi thầy vì đã báo muộn.\n\nEm cảm ơn thầy.')
      }
    },
  }
}

const exhaustedReply = (data: UserData): Reply => {
  const today = addDays(0)
  const tomorrow = addDays(1)
  const rank = { Cao: 0, Vừa: 1, Thấp: 2 }
  const open = data.tasks
    .filter((task) => task.due === today && (task.status === 'Cần làm' || task.status === 'Đang làm'))
    .sort((a, b) => rank[a.priority] - rank[b.priority])
  const movable = open.slice(1)
  const setSlow: Reply['effect'] = (draft) => {
    draft.slowMode = true
  }

  if (movable.length === 0) {
    return {
      text: 'Mình nghe rồi. Hôm nay bạn không có việc nào cần dời, nên cứ nghỉ một chút nhé. Nếu cảm giác này kéo dài, nói chuyện với người bạn tin tưởng cũng giúp nhẹ hơn nhiều.',
      effect: setSlow,
    }
  }
  return {
    text: `Mình nghe rồi, hôm nay mình đi chậm lại nhé. Mình giữ **“${open[0].title}”** vì đó là việc quan trọng nhất, và đề xuất dời **${movable.length} việc** chưa gấp sang mai.\n\nNếu cảm giác này kéo dài, nghỉ ngơi hoặc nói chuyện với người bạn tin tưởng sẽ giúp nhẹ hơn nhiều.`,
    effect: setSlow,
    card: {
      kind: 'reschedule',
      items: movable.map((task) => ({ taskId: task.id, title: task.title, from: task.due, to: tomorrow })),
      why: `Các việc này có mức ưu tiên thấp hơn “${open[0].title}” và chưa cần xong trong hôm nay.`,
      state: 'draft',
    },
  }
}

const noteReply = (original: string): Reply => {
  const body = (original.split(':').slice(1).join(':') || original).trim()
  const sentence = body.charAt(0).toUpperCase() + body.slice(1)
  return {
    text: 'Mình chuẩn bị ghi chú này cho bạn, bạn xác nhận là mình tạo ngay.',
    card: { kind: 'note', title: sentence.slice(0, 40), body: sentence, state: 'draft' },
  }
}

// Kịch bản theo các luồng F3–F6; thứ tự kiểm tra ưu tiên câu trả lời nối tiếp cuộc trò chuyện đang dở.
export function buildReply(original: string, data: UserData, conversation: Conversation, attachments: Attachment[] = []): Reply {
  const text = original.toLowerCase()
  const { awaiting, emailMessageId } = conversation.ctx
  const attachmentReply: Reply = {
    text: `Mình đã nhận ${attachments.map((item) => `“${item.name}”`).join(', ')}. Bản demo này chưa đọc được nội dung tệp, nên bạn cho mình biết bạn muốn làm gì với nó nhé.`,
  }

  if (attachments.length > 0 && !text.trim()) return attachmentReply

  if (awaiting === 'ielts-detail') return scheduleReply(text, data, conversation)
  if (emailMessageId) {
    const edit = editEmailReply(text, emailMessageId)
    if (edit) return edit
  }
  if (/ghi lại|ghi chú/.test(text)) return noteReply(original)
  if (/soạn.*(mail|thư)|(mail|email).*(thầy|cô)/.test(text)) return emailReply()
  if (/ielts|lịch ôn|xếp.*lịch/.test(text)) return askScheduleDetail(data)
  if (/kiệt sức|quá tải|mệt/.test(text)) return exhaustedReply(data)
  if (/áp lực|deadline|căng thẳng|\blo\b/.test(text)) return pressureReply(data, conversation)
  if (/^(chào|xin chào|hello|hi)\b/.test(text)) return { text: 'Chào bạn. Hôm nay mình giúp gì được cho bạn?' }
  if (attachments.length > 0) return attachmentReply
  return {
    text: 'Mình nghe bạn rồi. Bản demo này mình chỉ trả lời theo kịch bản, nên bạn thử một trong các việc sau nhé:\n\n- Chia sẻ **áp lực deadline**\n- Nhờ **xếp lịch ôn IELTS**\n- **Soạn mail** cho thầy\n- Kể rằng hôm nay bạn **kiệt sức**',
  }
}
