import { addDays, sleep, uid } from '../../lib/utils'
import { getData, updateData } from '../../store/useApp'
import { useSim } from '../../store/useSim'
import { toast } from '../../store/useToast'
import type { Attachment, ChatContext, Conversation, Message, UserData } from '../../store/types'
import { buildReply } from './script'

export const findConversation = (data: UserData, id: string | null) => data.conversations.find((c) => c.id === id)

const patchMessage = (conversationId: string, messageId: string, recipe: (message: Message, conversation: Conversation) => void) =>
  updateData((data) => {
    const conversation = findConversation(data, conversationId)
    const message = conversation?.messages.find((item) => item.id === messageId)
    if (conversation && message) recipe(message, conversation)
  })

// Mỗi lần chỉ có một câu trả lời đang chạy; biến này để nút Dừng cắt ngang được.
let running: { stopped: boolean } | null = null

export const stopReply = () => {
  if (running) running.stopped = true
}

async function runReply(conversationId: string, userText: string, ctxBefore: ChatContext, attachments?: Attachment[]) {
  const conversation = findConversation(getData(), conversationId)
  if (!conversation) return
  const reply = buildReply(userText, getData(), conversation, attachments)
  const messageId = uid()
  const control = { stopped: false }
  running = control

  updateData((data) => {
    findConversation(data, conversationId)?.messages.push({
      id: messageId,
      role: 'mira',
      text: '',
      status: 'streaming',
      ctxBefore,
      tool: reply.tool && { ...reply.tool, finished: false },
    })
  })

  const finish = (status: Message['status']) => {
    patchMessage(conversationId, messageId, (message) => {
      message.status = status
    })
    if (running === control) running = null
  }

  await sleep(reply.tool ? 1400 : 600)
  if (control.stopped) return finish('stopped')
  if (reply.tool) {
    patchMessage(conversationId, messageId, (message) => {
      if (message.tool) message.tool.finished = true
    })
  }

  const { chatError, set: setSim } = useSim.getState()
  const tokens = reply.text.split(/(?<=\s)/)
  for (let index = 0; index < tokens.length; index++) {
    if (control.stopped) return finish('stopped')
    if (chatError && index >= tokens.length * 0.4) {
      setSim({ chatError: false })
      return finish('error')
    }
    patchMessage(conversationId, messageId, (message) => {
      message.text += tokens[index]
    })
    await sleep(28)
  }
  if (control.stopped) return finish('stopped')

  // Thẻ, trí nhớ và ngữ cảnh chỉ có hiệu lực khi câu trả lời đã chạy xong.
  updateData((data) => {
    const current = findConversation(data, conversationId)
    if (!current) return
    const message = current.messages.find((item) => item.id === messageId)
    if (message) {
      message.card = reply.card
      message.status = 'done'
    }
    current.ctx = { ...current.ctx, ...reply.ctx }
    if (reply.card?.kind === 'email') current.ctx.emailMessageId = messageId
    current.updatedAt = addDays(0)
    for (const id of reply.usedMemoryIds ?? []) {
      if (!current.usedMemoryIds.includes(id)) current.usedMemoryIds.push(id)
    }
    reply.effect?.(data, current)
  })
  if (running === control) running = null
}

const newConversation = (temporary: boolean): Conversation => ({
  id: uid(),
  title: temporary ? 'Trò chuyện tạm thời' : 'Trò chuyện mới',
  updatedAt: addDays(0),
  temporary,
  messages: [],
  ctx: {},
  usedMemoryIds: [],
})

const dropTemporary = (data: UserData) => {
  data.conversations = data.conversations.filter((c) => !c.temporary)
}

export const selectConversation = (id: string | null) => {
  stopReply()
  updateData((data) => {
    dropTemporary(data)
    data.activeConversationId = id
  })
}

export const setTemporaryChat = (enabled: boolean) => {
  stopReply()
  updateData((data) => {
    dropTemporary(data)
    if (enabled) {
      const conversation = newConversation(true)
      data.conversations.push(conversation)
      data.activeConversationId = conversation.id
    } else {
      data.activeConversationId = null
    }
  })
}

export const sendMessage = (text: string, attachments: Attachment[] = []) => {
  const trimmed = text.trim()
  if ((!trimmed && attachments.length === 0) || running) return

  let conversationId = getData().activeConversationId
  if (!findConversation(getData(), conversationId)) {
    const conversation = newConversation(false)
    conversationId = conversation.id
    updateData((data) => {
      data.conversations.push(conversation)
      data.activeConversationId = conversation.id
    })
  }

  const id = conversationId as string
  const ctxBefore = findConversation(getData(), id)?.ctx ?? {}
  updateData((data) => {
    const conversation = findConversation(data, id)
    if (!conversation) return
    if (!conversation.temporary && conversation.messages.length === 0) conversation.title = (trimmed || attachments[0].name).slice(0, 48)
    conversation.messages.push({ id: uid(), role: 'user', text: trimmed, status: 'done', attachments: attachments.length ? attachments : undefined })
  })
  void runReply(id, trimmed, ctxBefore, attachments)
}

export const renameConversation = (id: string, title: string) =>
  updateData((data) => {
    const conversation = findConversation(data, id)
    if (conversation) conversation.title = title
  })

export const deleteConversation = (id: string) => {
  const { conversations, activeConversationId } = getData()
  const index = conversations.findIndex((c) => c.id === id)
  if (index < 0) return
  const removed = conversations[index]
  const wasActive = activeConversationId === id
  if (wasActive) stopReply()
  updateData((data) => {
    data.conversations = data.conversations.filter((c) => c.id !== id)
    if (wasActive) data.activeConversationId = null
  })
  toast('Đã xoá cuộc trò chuyện', () =>
    updateData((data) => {
      data.conversations.splice(index, 0, removed)
    }),
  )
}

// Dùng cho cả “Tạo lại” và “Thử lại”: bỏ câu trả lời cũ, khôi phục ngữ cảnh trước đó rồi chạy lại.
export const regenerate = (conversationId: string, messageId: string, editedText?: string) => {
  if (running) return
  const conversation = findConversation(getData(), conversationId)
  const index = conversation?.messages.findIndex((message) => message.id === messageId) ?? -1
  if (!conversation || index < 1) return
  const target = conversation.messages[index]
  const userMessage = conversation.messages[index - 1]
  const userText = editedText ?? userMessage.text
  const ctxBefore = target.ctxBefore ?? {}

  updateData((data) => {
    const current = findConversation(data, conversationId)
    if (!current) return
    if (target.card?.kind === 'memory') {
      const { memoryId } = target.card
      data.memories = data.memories.filter((memory) => !(memory.id === memoryId && memory.status === 'pending'))
    }
    current.messages.splice(index, 1)
    current.messages[index - 1].text = userText
    current.ctx = ctxBefore
  })
  void runReply(conversationId, userText, ctxBefore, userMessage.attachments)
}
