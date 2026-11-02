import { notify } from '../../store/log'
import { updateData } from '../../store/useApp'
import { toast } from '../../store/useToast'
import type { Permission } from '../../store/types'

const PERMISSION_NAMES: Record<Permission, string> = { calendar: 'Google Calendar', gmail: 'Gmail' }

export function grantPermission(permission: Permission | 'all') {
  updateData((data) => {
    data.connections.google = true
    const granted: Permission[] = permission === 'all' ? ['calendar', 'gmail'] : [permission]
    for (const key of granted) data.connections[key] = true
    notify(data, {
      kind: 'permission',
      title: 'Quyền đã thay đổi',
      body: `Bạn đã cấp quyền ${granted.map((key) => PERMISSION_NAMES[key]).join(' và ')} cho MIRA.`,
      to: '/connections',
    })
  })
}

export function revokePermission(permission: Permission) {
  updateData((data) => {
    data.connections[permission] = false
    notify(data, { kind: 'permission', title: 'Quyền đã thay đổi', body: `Bạn đã tắt quyền ${PERMISSION_NAMES[permission]}.`, to: '/connections' })
  })
  toast(`Đã tắt quyền ${PERMISSION_NAMES[permission]}`)
}

export function disconnectGoogle() {
  updateData((data) => {
    data.connections = { google: false, calendar: false, gmail: false }
    notify(data, { kind: 'permission', title: 'Đã thu hồi kết nối Google', body: 'MIRA không còn truy cập Google Calendar và Gmail.', to: '/connections' })
  })
  toast('Đã thu hồi kết nối Google')
}
