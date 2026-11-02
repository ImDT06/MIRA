import { CalendarDays, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Tag } from '../../components/ui/Controls'
import { Dialog } from '../../components/ui/Dialog'
import { cn, sleep } from '../../lib/utils'
import type { Permission } from '../../store/types'
import { grantPermission } from './actions'

export const PERMISSIONS: Record<Permission, { name: string; detail: string; missing: string; icon: typeof Mail }> = {
  calendar: { name: 'Google Calendar', detail: 'Đọc và tạo sự kiện', missing: 'MIRA chưa có quyền Google Calendar', icon: CalendarDays },
  gmail: { name: 'Gmail', detail: 'Gửi email thay bạn', missing: 'MIRA chưa có quyền Gmail', icon: Mail },
}

// S16: giải thích quyền trước khi cấp. Quyền đang cần được ghi rõ, các quyền khác chỉ để tham khảo.
export function GrantDialog({ permission, onGrant, onBack }: { permission: Permission | 'all'; onGrant: () => void; onBack: () => void }) {
  const [loading, setLoading] = useState(false)
  return (
    <Dialog
      open
      onClose={onBack}
      title="Kết nối tài khoản Google"
      footer={
        <>
          <Button variant="secondary" onClick={onBack}>
            Không phải bây giờ
          </Button>
          <Button
            loading={loading}
            onClick={async () => {
              setLoading(true)
              await sleep(700)
              grantPermission(permission)
              onGrant()
            }}
          >
            Kết nối
          </Button>
        </>
      }
    >
      <p className="t-small text-text-secondary">{permission === 'all' ? 'MIRA sẽ dùng các quyền dưới đây khi bạn nhờ.' : 'MIRA cần quyền được đánh dấu để làm việc bạn vừa nhờ.'}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {(Object.keys(PERMISSIONS) as Permission[]).map((key) => {
          const { name, detail, icon: Icon } = PERMISSIONS[key]
          const requested = permission === 'all' || key === permission
          return (
            <li key={key} className={cn('flex items-center gap-3 rounded-ctl p-3', requested ? 'bg-accent-soft' : 'bg-bg-muted')}>
              <Icon size={20} className="shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="t-h5">{name}</p>
                <p className="t-small text-text-secondary">{detail}</p>
              </div>
              {requested && <Tag tone="accent">Đang cần</Tag>}
            </li>
          )
        })}
      </ul>
      <p className="t-small mt-3 flex items-start gap-2">
        <ShieldCheck size={20} className="shrink-0 text-accent" aria-hidden="true" />
        Luôn hỏi trước khi làm, thu hồi lúc nào cũng được.
      </p>
    </Dialog>
  )
}
