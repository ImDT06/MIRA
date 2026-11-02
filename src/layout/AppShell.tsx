import * as Dialog from '@radix-ui/react-dialog'
import { CircleAlert, Menu, MessageCircleDashed, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { setTemporaryChat } from '../features/chat/engine'
import { Button, IconButton } from '../components/ui/Button'
import { EmptyState } from '../components/ui/Controls'
import { cn } from '../lib/utils'
import { useApp, useData } from '../store/useApp'
import { useSim } from '../store/useSim'
import { CommandPalette } from './CommandPalette'
import { NotificationBell } from './NotificationBell'
import { Sidebar } from './Sidebar'

function TemporaryButton() {
  const temporary = useData((data) => data.conversations.find((c) => c.id === data.activeConversationId)?.temporary ?? false)
  return (
    <button
      type="button"
      aria-pressed={temporary}
      title="Trò chuyện tạm thời: MIRA không ghi nhớ cuộc trò chuyện này"
      onClick={() => setTemporaryChat(!temporary)}
      className={cn(
        't-small inline-flex h-11 items-center gap-2 rounded-ctl px-3 font-medium transition-colors duration-150 ease-out',
        temporary ? 'bg-accent-soft text-accent-strong' : 'text-text-secondary hover:bg-bg-muted',
      )}
    >
      <MessageCircleDashed size={20} aria-hidden="true" />
      <span className="max-sm:sr-only">Tạm thời</span>
    </button>
  )
}

function SimulatedState() {
  const page = useSim((state) => state.page)
  const set = useSim((state) => state.set)
  if (page === 'error') {
    return (
      <EmptyState
        icon={<CircleAlert size={48} />}
        text="Mình chưa tải được nội dung. Bạn kiểm tra kết nối mạng rồi thử lại nhé."
        action={
          <Button variant="secondary" onClick={() => set({ page: 'normal' })}>
            <RefreshCw size={20} />
            Thử lại
          </Button>
        }
      />
    )
  }
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 p-4 md:p-8" role="status" aria-label="Đang tải">
      <div className="h-40 animate-pulse rounded-card bg-bg-muted" />
      <div className="h-24 animate-pulse rounded-card bg-bg-muted" />
      <div className="h-24 animate-pulse rounded-card bg-bg-muted" />
    </div>
  )
}

const PAGE_TITLES: Record<string, string> = {
  today: 'Hôm nay',
  memory: 'Trí nhớ',
  space: 'Không gian',
  automation: 'Tự động hoá',
  connections: 'Kết nối & quyền',
  settings: 'Cài đặt',
  ui: 'Thành phần giao diện',
}

export function AppShell() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const simulated = useSim((state) => state.page !== 'normal')
  const collapsed = useApp((state) => state.sidebarCollapsed)
  const toggleSidebar = useApp((state) => state.toggleSidebar)
  const chatTitle = useData((data) => data.conversations.find((c) => c.id === data.activeConversationId && c.messages.length > 0)?.title)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isChat = pathname === '/'
  // Đổi tab trong Không gian chỉ chuyển phần nội dung, đầu trang đứng yên.
  const pageKey = pathname.startsWith('/space') ? '/space' : pathname

  // Đổi màn thì cuộn về đầu, cập nhật tiêu đề tab và đưa focus vào nội dung cho người dùng bàn phím, trình đọc màn hình.
  useEffect(() => {
    const title = PAGE_TITLES[pathname.split('/')[1]]
    document.title = title ? `${title} · MIRA` : 'MIRA'
    mainRef.current?.scrollTo(0, 0)
    if (!firstRender.current && !isChat) mainRef.current?.focus({ preventScroll: true })
    firstRender.current = false
  }, [pathname, isChat])

  return (
    <div className="relative flex h-dvh overflow-hidden">
      <a
        href="#main-content"
        className="t-button sr-only z-[70] rounded-ctl bg-primary px-4 py-3 text-on-primary focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
      >
        Bỏ qua đến nội dung
      </a>
      <aside
        className={cn(
          'hidden shrink-0 border-r border-border-divider bg-bg-surface transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[72px]' : 'w-60',
        )}
      >
        <Sidebar rail={collapsed} onToggleRail={toggleSidebar} />
      </aside>

      <CommandPalette />
      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fade fixed inset-0 z-40 bg-overlay lg:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="drawer fixed inset-y-0 left-0 z-50 w-[min(300px,calc(100vw-48px))] bg-bg-surface shadow-float lg:hidden"
          >
            <Dialog.Title className="sr-only">Điều hướng</Dialog.Title>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-1 px-2 md:px-4">
          <IconButton label="Mở điều hướng" className="lg:hidden" onClick={() => setDrawerOpen(true)}>
            <Menu size={24} />
          </IconButton>
          {isChat && <h1 className={cn('t-h5 min-w-0 truncate px-1', !chatTitle && 'sr-only')}>{chatTitle ?? 'Trò chuyện mới'}</h1>}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {isChat && <TemporaryButton />}
            <NotificationBell />
          </div>
        </header>
        <main id="main-content" ref={mainRef} tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto outline-none">
          <div key={pageKey} className="page-enter h-full">
            {simulated ? <SimulatedState /> : <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}
