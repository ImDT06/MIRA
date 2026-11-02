import { Check, ChevronRight, LogOut, Monitor, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { deleteAllMemories } from '../memory/actions'
import { stopReply } from '../chat/engine'
import { Button } from '../../components/ui/Button'
import { Card, PageHeader, Segmented, SettingRow, Tag, Toggle } from '../../components/ui/Controls'
import { Dialog } from '../../components/ui/Dialog'
import { Field, SelectField } from '../../components/ui/Field'
import { addDays, cn, uid } from '../../lib/utils'
import { updateData, useAccount, useApp, useData } from '../../store/useApp'
import { toast } from '../../store/useToast'
import type { Personality, Settings, ThemePref } from '../../store/types'

const PERSONALITIES: Array<{ value: Personality; hint: string }> = [
  { value: 'Điềm tĩnh', hint: 'Nhẹ nhàng, chậm rãi, không thúc ép.' },
  { value: 'Thân thiện', hint: 'Vui vẻ, gần gũi như một người bạn.' },
  { value: 'Thẳng thắn', hint: 'Ngắn gọn, đi thẳng vào việc cần làm.' },
]

const TIMEZONES = ['(GMT+7) Hà Nội', '(GMT+8) Singapore', '(GMT+9) Tokyo', '(GMT+0) London']
const INTEREST_SOURCE = 'Người dùng nhập tay khi đăng ký'

const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) =>
  updateData((data) => {
    data.settings[key] = value
  })

function ProfileSection() {
  const account = useAccount()
  const updateProfile = useApp((state) => state.updateProfile)
  const memories = useData((data) => data.memories)
  const [name, setName] = useState(account?.name ?? '')
  const [error, setError] = useState('')
  const interests = account?.interests.trim()
  const interestSaved = memories.some((memory) => memory.source === INTEREST_SOURCE)

  const saveName = () => {
    if (!name.trim()) return setError('Bạn cho mình biết tên để tiện xưng hô nhé.')
    setError('')
    updateProfile({ name: name.trim() })
    toast('Đã lưu tên hiển thị')
  }

  // Sở thích chỉ thành trí nhớ khi người dùng chủ động chọn (FR-00).
  const saveInterest = () => {
    const today = addDays(0)
    updateData((data) => {
      data.memories.unshift({ id: uid(), content: `Sở thích: ${interests}`, source: INTEREST_SOURCE, createdAt: today, updatedAt: today, status: 'active' })
    })
    toast('Đã lưu vào Trí nhớ')
  }

  return (
    <Card className="p-4">
      <h2 className="t-h3">Tài khoản</h2>
      <div className="mt-3 flex items-center gap-3">
        <span className="t-h4 inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong" aria-hidden="true">
          {account?.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="t-h5 truncate">{account?.name}</p>
          <p className="t-small truncate text-text-secondary">{account?.email}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-start gap-2">
        <Field label="Tên hiển thị" className="min-w-[200px] flex-1" value={name} error={error} onChange={(event) => setName(event.target.value)} />
        <Button variant="secondary" className="mt-7" disabled={name.trim() === account?.name} onClick={saveName}>
          Lưu
        </Button>
      </div>
      {interests && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="t-small">
            <span className="text-text-secondary">Sở thích trong hồ sơ: </span>
            {interests}
          </p>
          {interestSaved ? (
            <Tag tone="success">
              <Check size={16} aria-hidden="true" />
              Đã có trong Trí nhớ
            </Tag>
          ) : (
            <Button variant="text" small onClick={saveInterest}>
              Lưu vào Trí nhớ
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function PersonalitySection({ current }: { current: Personality }) {
  return (
    <Card className="p-4">
      <h2 className="t-h3">Tính cách MIRA</h2>
      <p className="t-small text-text-secondary">Áp dụng từ câu trả lời tiếp theo.</p>
      {/* Hiện sẵn mô tả của cả ba để so sánh được ngay, không phải bấm thử từng lựa chọn. */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {PERSONALITIES.map(({ value, hint }) => {
          const selected = current === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setSetting('personality', value)}
              className={cn('press rounded-ctl border p-3 text-left', selected ? 'border-accent bg-accent-soft' : 'border-border-default hover:border-accent hover:bg-accent-soft/60')}
            >
              <span className={cn('t-h5 flex items-center justify-between gap-2', selected && 'text-accent-strong')}>
                {value}
                {selected && <Check size={16} strokeWidth={3} className="shrink-0" aria-hidden="true" />}
              </span>
              <span className="t-caption mt-1 block text-text-secondary">{hint}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function PreferencesSection({ settings }: { settings: Settings }) {
  const theme = useApp((state) => state.theme)
  const setTheme = useApp((state) => state.setTheme)
  return (
    <Card className="p-4">
      <h2 className="t-h3">Thông báo và hiển thị</h2>
      <div className="mt-1 divide-y divide-border-divider">
        <SettingRow title="Thông báo trong ứng dụng" description="Khi tắt, quy trình tự động vẫn chạy và kết quả vẫn nằm trong lịch sử.">
          <Toggle hideLabel label="Thông báo trong ứng dụng" checked={settings.notifications} onChange={(value) => setSetting('notifications', value)} />
        </SettingRow>
        <SettingRow title="Giao diện">
          <Segmented
            compact
            label="Giao diện"
            value={theme}
            onChange={(value) => setTheme(value as ThemePref)}
            options={[
              { value: 'light', label: 'Sáng', icon: <Sun size={16} /> },
              { value: 'dark', label: 'Tối', icon: <Moon size={16} /> },
              { value: 'system', label: 'Hệ thống', icon: <Monitor size={16} /> },
            ]}
          />
        </SettingRow>
        <SettingRow title="Ngôn ngữ">
          <SelectField label="Ngôn ngữ" className="w-[220px] max-w-full [&>label]:sr-only" options={['Tiếng Việt']} value={settings.language} onChange={(event) => setSetting('language', event.target.value)} />
        </SettingRow>
        <SettingRow title="Múi giờ">
          <SelectField label="Múi giờ" className="w-[220px] max-w-full [&>label]:sr-only" options={TIMEZONES} value={settings.timezone} onChange={(event) => setSetting('timezone', event.target.value)} />
        </SettingRow>
      </div>
    </Card>
  )
}

function PrivacySection() {
  const memoryEnabled = useData((data) => data.memoryEnabled)
  const memoryCount = useData((data) => data.memories.length)
  const [confirming, setConfirming] = useState(false)
  return (
    <Card className="p-4">
      <h2 className="t-h3">Quyền riêng tư</h2>
      <div className="mt-1 divide-y divide-border-divider">
        <Link to="/connections" state={{ from: 'settings' }} className="flex min-h-14 items-center gap-2 py-2 transition-colors duration-150 ease-out hover:text-accent">
          <ShieldCheck size={20} className="shrink-0 text-text-secondary" aria-hidden="true" />
          <span className="t-small flex-1 font-semibold">Kết nối & quyền</span>
          <ChevronRight size={16} className="text-text-secondary" aria-hidden="true" />
        </Link>
        <SettingRow title="Cho MIRA dùng trí nhớ" description="Khi tắt, MIRA không dùng điều đã nhớ và không đề xuất ghi nhớ thêm. Dữ liệu vẫn được giữ.">
          <Toggle
            hideLabel
            label="Cho MIRA dùng trí nhớ"
            checked={memoryEnabled}
            onChange={(value) =>
              updateData((data) => {
                data.memoryEnabled = value
              })
            }
          />
        </SettingRow>
        <SettingRow title="Xoá toàn bộ trí nhớ" description="MIRA sẽ quên mọi điều đã nhớ. Không thể hoàn tác.">
          <Button variant="danger" small disabled={memoryCount === 0} onClick={() => setConfirming(true)}>
            <Trash2 size={20} />
            Xoá toàn bộ trí nhớ
          </Button>
        </SettingRow>
      </div>
      {confirming && (
        <Dialog
          open
          dismissible={false}
          onClose={() => setConfirming(false)}
          title="Xoá toàn bộ trí nhớ?"
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Huỷ
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteAllMemories()
                  setConfirming(false)
                }}
              >
                <Trash2 size={20} />
                Xoá {memoryCount} mục
              </Button>
            </>
          }
        >
          <p className="t-body">MIRA sẽ quên {memoryCount} điều đã nhớ, kể cả những mục đang chờ duyệt.</p>
          <p className="t-small mt-2 font-semibold text-danger">Không thể hoàn tác.</p>
        </Dialog>
      )}
    </Card>
  )
}

// S18
export function SettingsPage() {
  const settings = useData((data) => data.settings)
  const logout = useApp((state) => state.logout)
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 pb-8 pt-2 md:px-8">
      <PageHeader title="Cài đặt" />
      <ProfileSection />
      <PersonalitySection current={settings.personality} />
      <PreferencesSection settings={settings} />
      <PrivacySection />
      <SettingRow title="Đăng xuất" description="Đăng xuất không xoá dữ liệu của bạn.">
        <Button
          variant="secondary"
          small
          onClick={() => {
            stopReply()
            logout()
          }}
        >
          <LogOut size={20} />
          Đăng xuất
        </Button>
      </SettingRow>
    </div>
  )
}
