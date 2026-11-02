import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Tag } from '../../components/ui/Controls'
import { Dialog } from '../../components/ui/Dialog'
import { sleep } from '../../lib/utils'
import { useData } from '../../store/useApp'
import type { Permission } from '../../store/types'
import { GrantDialog, PERMISSIONS } from './GrantDialog'

export interface ActionSummary {
  title: string
  rows: Array<{ label: string; value: string }>
  permission: Permission | null
  irreversible: boolean
  confirmLabel: string
}

interface ActionConfirmProps {
  summary: ActionSummary
  onConfirm: () => void
  onCancel: () => void
}

// S06 dùng chung cho chat và các màn quản lý dữ liệu; thiếu quyền thì chuyển sang biến thể xin quyền.
export function ActionConfirm({ summary, onConfirm, onCancel }: ActionConfirmProps) {
  const connections = useData((data) => data.connections)
  const [granting, setGranting] = useState(false)
  const [loading, setLoading] = useState(false)

  if (granting && summary.permission) {
    return <GrantDialog permission={summary.permission} onGrant={() => setGranting(false)} onBack={() => setGranting(false)} />
  }

  const missing = summary.permission !== null && !connections[summary.permission]

  const confirm = async () => {
    setLoading(true)
    await sleep(700)
    setLoading(false)
    onConfirm()
  }

  return (
    <Dialog
      open
      onClose={onCancel}
      dismissible={!summary.irreversible}
      title={missing && summary.permission ? PERMISSIONS[summary.permission].missing : summary.title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Huỷ
          </Button>
          {missing ? (
            <Button onClick={() => setGranting(true)}>Cấp quyền</Button>
          ) : (
            <Button loading={loading} onClick={confirm}>
              {summary.confirmLabel}
            </Button>
          )}
        </>
      }
    >
      <Tag tone="warning">Đang chờ xác nhận</Tag>
      <dl className="mt-3 divide-y divide-border-divider">
        {summary.rows.map(({ label, value }) => (
          <div key={label} className="flex gap-3 py-2">
            <dt className="t-small w-24 shrink-0 text-text-secondary">{label}</dt>
            <dd className="t-small min-w-0 flex-1 whitespace-pre-line break-words">{value}</dd>
          </div>
        ))}
      </dl>
      {missing && <p className="t-small mt-3 text-text-secondary">Bạn cấp quyền xong, mình sẽ hỏi lại lần nữa trước khi làm.</p>}
      {summary.irreversible && !missing && <p className="t-small mt-3 font-semibold text-danger">Không thể hoàn tác sau khi gửi.</p>}
    </Dialog>
  )
}
