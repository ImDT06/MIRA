import * as RadixDialog from '@radix-ui/react-dialog'
import { FlaskConical, Moon, Monitor, RotateCcw, Sun, X } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { selectConversation, stopReply } from '../features/chat/engine'
import { Button, IconButton } from '../components/ui/Button'
import { Checkbox, Segmented } from '../components/ui/Controls'
import { addDays, uid } from '../lib/utils'
import { emptyData, minhData } from '../store/seed'
import { useApp } from '../store/useApp'
import { useSim } from '../store/useSim'
import type { ThemePref, UserData } from '../store/types'

interface FlowPreset {
  code: string
  label: string
  path: string
  data?: () => UserData
}

const withFocusMemory = () => {
  const data = minhData()
  const today = addDays(0)
  data.memories.unshift({
    id: uid(),
    content: 'Sau 15:00 dễ mất tập trung',
    source: 'Từ trò chuyện',
    createdAt: today,
    updatedAt: today,
    status: 'active',
  })
  return data
}

const withGoogleFullAccess = () => {
  const data = minhData()
  data.connections = { google: true, calendar: true, gmail: true }
  return data
}

const withIeltsGoal = () => {
  const data = minhData()
  data.goals.push({ id: uid(), title: 'IELTS 6.5', progress: 30, status: 'Đang thực hiện' })
  return data
}

// Mỗi luồng bắt đầu từ đúng trạng thái dữ liệu được ghi trong tab User Flow.
const FLOWS: FlowPreset[] = [
  { code: 'F1', label: 'Đăng ký lần đầu', path: '/login' },
  { code: 'F2', label: 'Bắt đầu ngày mới', path: '/today', data: minhData },
  { code: 'F3', label: 'Chia sẻ áp lực, lưu trí nhớ', path: '/', data: minhData },
  { code: 'F4', label: 'Xếp lịch ôn IELTS', path: '/', data: withFocusMemory },
  { code: 'F5', label: 'Soạn và gửi email', path: '/', data: minhData },
  { code: 'F6', label: 'Một ngày kiệt sức', path: '/', data: minhData },
  { code: 'F7', label: 'Bật Tổng kết cuối tuần', path: '/automation', data: withIeltsGoal },
  { code: 'F8', label: 'Kiểm soát dữ liệu và quyền', path: '/memory', data: withGoogleFullAccess },
]

// Dùng ở màn đăng nhập; khi đã đăng nhập, bảng này mở từ menu tài khoản.
export function DemoButton() {
  return (
    <IconButton label="Bảng điều khiển demo" onClick={() => useSim.getState().set({ demoOpen: true })}>
      <FlaskConical size={20} />
    </IconButton>
  )
}

export function DemoPanel() {
  const navigate = useNavigate()
  const theme = useApp((state) => state.theme)
  const setTheme = useApp((state) => state.setTheme)
  const sim = useSim()

  // Ctrl+Shift+D mở hoặc đóng bảng.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        useSim.getState().set({ demoOpen: !useSim.getState().demoOpen })
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const go = (path: string) => {
    sim.set({ page: 'normal', demoOpen: false })
    navigate(path)
  }

  const startFlow = ({ data, path }: FlowPreset) => {
    stopReply()
    const store = useApp.getState()
    if (data) store.replaceDemoData(data())
    else store.logout()
    selectConversation(null)
    go(path)
  }

  const loadEmpty = () => {
    stopReply()
    useApp.getState().replaceDemoData(emptyData())
    go('/')
  }

  const reset = () => {
    stopReply()
    useApp.getState().resetAll()
    go('/login')
  }

  return (
    <RadixDialog.Root open={sim.demoOpen} onOpenChange={(demoOpen) => sim.set({ demoOpen })}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fade fixed inset-0 z-[55] bg-overlay" />
        <RadixDialog.Content aria-describedby={undefined} className="sheet fixed inset-y-0 right-0 z-[56] w-[min(360px,calc(100vw-32px))] overflow-y-auto bg-bg-surface p-4 shadow-float">
          <div className="flex items-start justify-between gap-2">
            <div>
              <RadixDialog.Title className="t-h4">Bảng điều khiển demo</RadixDialog.Title>
              <p className="t-caption text-text-secondary">Không thuộc sản phẩm. Ctrl+Shift+D để mở, đóng.</p>
            </div>
            <RadixDialog.Close asChild>
              <IconButton label="Đóng bảng demo" className="-mr-2 -mt-2">
                <X size={20} />
              </IconButton>
            </RadixDialog.Close>
          </div>

          <p className="t-overline mt-4 text-text-secondary">Bắt đầu luồng</p>
          <div className="mt-1 flex flex-col gap-1">
            {FLOWS.map((flow) => (
              <Button key={flow.code} variant="secondary" small className="w-full justify-start" onClick={() => startFlow(flow)}>
                <span className="t-caption text-accent">{flow.code}</span>
                {flow.label}
              </Button>
            ))}
            <Button variant="secondary" small className="w-full" onClick={loadEmpty}>
              Tài khoản Minh, dữ liệu trống
            </Button>
          </div>

          <p className="t-overline mt-4 text-text-secondary">Giao diện</p>
          <div className="mt-1">
            <Segmented
              label="Giao diện"
              value={theme}
              onChange={(value) => setTheme(value as ThemePref)}
              options={[
                { value: 'light', label: 'Sáng', icon: <Sun size={16} /> },
                { value: 'dark', label: 'Tối', icon: <Moon size={16} /> },
                { value: 'system', label: 'Máy', icon: <Monitor size={16} /> },
              ]}
            />
          </div>

          <p className="t-overline mt-4 text-text-secondary">Trạng thái màn</p>
          <div className="mt-1">
            <Segmented
              label="Trạng thái màn"
              value={sim.page}
              onChange={(value) => sim.set({ page: value as typeof sim.page })}
              options={[
                { value: 'normal', label: 'Thường' },
                { value: 'loading', label: 'Đang tải' },
                { value: 'error', label: 'Lỗi' },
              ]}
            />
          </div>

          <p className="t-overline mt-4 text-text-secondary">Mô phỏng lần tới</p>
          <div className="flex flex-col">
            <Checkbox label="Mất kết nối khi MIRA trả lời" checked={sim.chatError} onChange={(chatError) => sim.set({ chatError })} />
            <Checkbox label="Gửi email thất bại" checked={sim.sendFailure} onChange={(sendFailure) => sim.set({ sendFailure })} />
            <Checkbox label="Khung giờ bị trùng khi tạo lịch" checked={sim.scheduleConflict} onChange={(scheduleConflict) => sim.set({ scheduleConflict })} />
            <Checkbox label="Workflow chạy lỗi" checked={sim.workflowFailure} onChange={(workflowFailure) => sim.set({ workflowFailure })} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="text" small onClick={() => go('/ui')}>
              Xem thành phần
            </Button>
            <Button variant="danger" small onClick={reset}>
              <RotateCcw size={20} />
              Đặt lại
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
