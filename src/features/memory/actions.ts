import { addDays } from '../../lib/utils'
import { notify } from '../../store/log'
import { getData, updateData } from '../../store/useApp'
import { toast } from '../../store/useToast'
import type { MemoryCard, UserData } from '../../store/types'
import { patchCard, type MessageRef } from '../chat/actions'

const notifyMemorySaved = (data: UserData, content: string) =>
  notify(data, { kind: 'memory', title: 'MIRA vừa ghi nhớ điều mới', body: content, to: '/memory' })

export function saveMemory(ref: MessageRef, content: string) {
  patchCard(ref, 'memory', (card, data) => {
    const memory = data.memories.find((item) => item.id === card.memoryId)
    card.content = content
    card.state = 'saved'
    if (memory) {
      memory.content = content
      memory.status = 'active'
      memory.updatedAt = addDays(0)
    }
    notifyMemorySaved(data, content)
  })
  toast('Đã lưu vào Trí nhớ', () =>
    patchCard(ref, 'memory', (card, data) => {
      card.state = 'proposed'
      const memory = data.memories.find((item) => item.id === card.memoryId)
      if (memory) memory.status = 'pending'
    }),
  )
}

// Giữ thẻ trong chat khớp với trạng thái khi người dùng thao tác từ màn Trí nhớ.
const syncMemoryCard = (data: UserData, memoryId: string, state: MemoryCard['state'], content?: string) => {
  for (const conversation of data.conversations) {
    for (const message of conversation.messages) {
      if (message.card?.kind === 'memory' && message.card.memoryId === memoryId) {
        message.card.state = state
        if (content) message.card.content = content
      }
    }
  }
}

export function approvePendingMemory(id: string) {
  updateData((data) => {
    const memory = data.memories.find((item) => item.id === id)
    if (!memory) return
    memory.status = 'active'
    memory.updatedAt = addDays(0)
    syncMemoryCard(data, id, 'saved')
    notifyMemorySaved(data, memory.content)
  })
  toast('Đã lưu vào Trí nhớ', () =>
    updateData((data) => {
      const memory = data.memories.find((item) => item.id === id)
      if (memory) memory.status = 'pending'
      syncMemoryCard(data, id, 'proposed')
    }),
  )
}

export function rejectPendingMemory(id: string) {
  updateData((data) => {
    data.memories = data.memories.filter((memory) => memory.id !== id)
    syncMemoryCard(data, id, 'dismissed')
  })
}

export function editMemory(id: string, content: string) {
  const previous = getData().memories.find((memory) => memory.id === id)?.content
  updateData((data) => {
    const memory = data.memories.find((item) => item.id === id)
    if (!memory) return
    memory.content = content
    memory.updatedAt = addDays(0)
    syncMemoryCard(data, id, 'saved', content)
  })
  toast('Đã cập nhật trí nhớ', () =>
    updateData((data) => {
      const memory = data.memories.find((item) => item.id === id)
      if (memory && previous) memory.content = previous
      if (previous) syncMemoryCard(data, id, 'saved', previous)
    }),
  )
}

export function deleteMemory(id: string) {
  updateData((data) => {
    data.memories = data.memories.filter((memory) => memory.id !== id)
    syncMemoryCard(data, id, 'deleted')
  })
  toast('Đã xoá khỏi Trí nhớ')
}

export function dismissMemory(ref: MessageRef) {
  patchCard(ref, 'memory', (card, data) => {
    card.state = 'dismissed'
    data.memories = data.memories.filter((memory) => memory.id !== card.memoryId)
  })
}

export function deleteAllMemories() {
  updateData((data) => {
    for (const memory of data.memories) syncMemoryCard(data, memory.id, 'deleted')
    data.memories = []
  })
  toast('Đã xoá toàn bộ trí nhớ')
}
