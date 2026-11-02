import { uid } from '../lib/utils'
import type { Activity, AppNotification, UserData } from './types'

export const logActivity = (data: UserData, text: string, permission: string, undo?: Activity['undo']) => {
  data.activity.unshift({ id: uid(), at: new Date().toISOString(), text, permission, undo })
}

// Tắt thông báo trong Cài đặt thì không tạo thông báo mới; lịch sử chạy vẫn được lưu.
export const notify = (data: UserData, input: Pick<AppNotification, 'kind' | 'title' | 'body' | 'to'>) => {
  if (data.settings.notifications) data.notifications.unshift({ ...input, id: uid(), at: new Date().toISOString(), read: false })
}
