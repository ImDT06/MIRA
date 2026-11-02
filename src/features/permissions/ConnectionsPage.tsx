import { Check, ChevronLeft, FileText, HardDrive, Mail, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { undoActivity } from '../chat/actions'
import { disconnectGoogle, revokePermission } from './actions'
import { GrantDialog } from './GrantDialog'
import { Button } from '../../components/ui/Button'
import { Card, PageHeader, SettingRow, Tag, Toggle } from '../../components/ui/Controls'
import { Dialog } from '../../components/ui/Dialog'
import { dateTimeLabel } from '../../lib/utils'
import { useData } from '../../store/useApp'
import type { Activity, Permission } from '../../store/types'

const SOON = [
  { name: 'Google Drive', icon: HardDrive },
  { name: 'Office 365', icon: FileText },
]

const PERMISSION_ROWS: Array<{ key: Permission; title: string; label: string; description: string }> = [
  { key: 'calendar', title: 'Google Calendar', label: 'Google Calendar: đọc và tạo sự kiện', description: 'Đọc và tạo sự kiện.' },
  { key: 'gmail', title: 'Gmail', label: 'Gmail: gửi email thay bạn', description: 'Gửi email thay bạn, sau khi bạn xác nhận từng thư.' },
]

// S15
export function ConnectionsPage() {
  const connections = useData((data) => data.connections)
  const activity = useData((data) => data.activity)
  const conversations = useData((data) => data.conversations)
  const fromSettings = (useLocation().state as { from?: string } | null)?.from === 'settings'
  const [granting, setGranting] = useState<Permission | 'all' | null>(null)
  const [revoking, setRevoking] = useState(false)

  const canUndo = (entry: Activity) =>
    entry.undo && !entry.undone && conversations.find((c) => c.id === entry.undo?.conversationId)?.messages.some((message) => message.id === entry.undo?.messageId)

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 pb-8 pt-2 md:px-8">
      <PageHeader
        title="Kết nối & quyền"
        description="MIRA chỉ dùng những quyền đang bật, và luôn hỏi bạn trước khi làm."
        back={
          fromSettings && (
            <Link to="/settings" className="t-small -ml-1 inline-flex min-h-11 items-center gap-1 rounded-tag font-medium text-text-secondary hover:text-text-primary">
              <ChevronLeft size={16} aria-hidden="true" />
              Cài đặt
            </Link>
          )
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-ctl bg-bg-muted" aria-hidden="true">
            <Mail size={20} />
          </span>
          <h2 className="t-h4 mr-auto">Tài khoản Google</h2>
          {connections.google ? (
            <Tag tone="success">
              <Check size={16} aria-hidden="true" />
              Đã kết nối
            </Tag>
          ) : (
            <Tag>Chưa kết nối</Tag>
          )}
        </div>
        {connections.google ? (
          <>
            <div className="mt-2 divide-y divide-border-divider border-y border-border-divider">
              {PERMISSION_ROWS.map(({ key, title, label, description }) => (
                <SettingRow key={key} title={title} description={description}>
                  <Toggle hideLabel label={label} checked={connections[key]} onChange={(checked) => (checked ? setGranting(key) : revokePermission(key))} />
                </SettingRow>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="danger" small onClick={() => setRevoking(true)}>
                Thu hồi kết nối
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <p className="t-small text-text-secondary">Kết nối để MIRA xem lịch, tạo sự kiện và gửi email khi bạn nhờ.</p>
            <Button className="mt-3" onClick={() => setGranting('all')}>
              Kết nối Google
            </Button>
          </div>
        )}
      </Card>

      <ul className="grid gap-3 sm:grid-cols-2">
        {SOON.map(({ name, icon: Icon }) => (
          <li key={name} className="flex items-center gap-2 rounded-card border border-dashed border-border-default p-4 text-text-secondary">
            <Icon size={20} aria-hidden="true" />
            <span className="t-h5 mr-auto">{name}</span>
            <Tag>Sắp có</Tag>
          </li>
        ))}
      </ul>

      <Card className="p-4">
        <h2 className="t-h3">MIRA đã làm gì gần đây</h2>
        {activity.length === 0 ? (
          <p className="t-small mt-1 text-text-secondary">MIRA chưa làm việc nào thay bạn.</p>
        ) : (
          <ul className="mt-1 divide-y divide-border-divider">
            {activity.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="t-small">{entry.text}</p>
                  <p className="t-caption text-text-secondary">
                    {dateTimeLabel(entry.at)} · {entry.permission}
                  </p>
                </div>
                {entry.undone && <Tag>Đã hoàn tác</Tag>}
                {canUndo(entry) && (
                  <Button variant="text" small onClick={() => undoActivity(entry)}>
                    <Undo2 size={16} />
                    Hoàn tác
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {granting && <GrantDialog permission={granting} onGrant={() => setGranting(null)} onBack={() => setGranting(null)} />}
      {revoking && (
        <Dialog
          open
          onClose={() => setRevoking(false)}
          title="Thu hồi kết nối Google?"
          footer={
            <>
              <Button variant="secondary" onClick={() => setRevoking(false)}>
                Huỷ
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  disconnectGoogle()
                  setRevoking(false)
                }}
              >
                Thu hồi
              </Button>
            </>
          }
        >
          <p className="t-body">MIRA sẽ không còn truy cập Google Calendar và Gmail. Dữ liệu trong MIRA vẫn được giữ, và bạn có thể kết nối lại bất cứ lúc nào.</p>
        </Dialog>
      )}
    </div>
  )
}
