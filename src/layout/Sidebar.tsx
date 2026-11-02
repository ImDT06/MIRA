import * as Popover from '@radix-ui/react-popover'
import { Bookmark, FlaskConical, LayoutGrid, LogOut, Monitor, Moon, PanelLeft, Plug, Plus, Search, Settings, Sun, Zap, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { selectConversation, stopReply } from '../features/chat/engine'
import { Logo, LogoMark } from '../components/Logo'
import { IconButton } from '../components/ui/Button'
import { Segmented } from '../components/ui/Controls'
import { cn } from '../lib/utils'
import { useAccount, useApp } from '../store/useApp'
import { useSim } from '../store/useSim'
import type { ThemePref } from '../store/types'
import { isMac } from './CommandPalette'
import { ConversationList } from './ConversationList'

const NAV: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/today', label: 'Hôm nay', icon: Sun },
  { to: '/memory', label: 'Trí nhớ', icon: Bookmark },
  { to: '/space', label: 'Không gian', icon: LayoutGrid },
  { to: '/automation', label: 'Tự động hoá', icon: Zap },
  { to: '/connections', label: 'Kết nối', icon: Plug },
]

const rowClass = 't-small press flex h-11 items-center gap-3 rounded-ctl px-3 font-medium'

function AccountMenu({ rail, onNavigate }: { rail?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate()
  const account = useAccount()
  const logout = useApp((state) => state.logout)
  const theme = useApp((state) => state.theme)
  const setTheme = useApp((state) => state.setTheme)
  const initial = account?.name.trim().charAt(0).toUpperCase()
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label="Tài khoản"
        title={rail ? account?.name : undefined}
        className={cn('flex min-h-12 w-full items-center gap-2 rounded-ctl text-left transition-colors duration-150 ease-out hover:bg-bg-muted', rail ? 'justify-center' : 'px-2')}
      >
        <span className="t-small inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-strong">{initial}</span>
        {!rail && (
          <span className="min-w-0 flex-1">
            <span className="t-small block truncate font-medium">{account?.name}</span>
            <span className="t-caption block truncate text-text-secondary">{account?.email}</span>
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="top" align="start" sideOffset={8} collisionPadding={12} className="pop z-[60] w-[300px] max-w-[calc(100vw-24px)] rounded-card bg-bg-surface p-3 shadow-float">
          <p className="t-caption px-1 pb-1 text-text-secondary">Giao diện</p>
          <Segmented
            label="Giao diện"
            value={theme}
            onChange={(value) => setTheme(value as ThemePref)}
            options={[
              { value: 'light', label: 'Sáng', icon: <Sun size={16} /> },
              { value: 'dark', label: 'Tối', icon: <Moon size={16} /> },
              { value: 'system', label: 'Hệ thống', icon: <Monitor size={16} /> },
            ]}
          />
          <div className="mt-2 border-t border-border-divider pt-2">
            <button
              type="button"
              className={cn(rowClass, 'w-full hover:bg-bg-muted')}
              onClick={() => {
                setOpen(false)
                navigate('/settings')
                onNavigate?.()
              }}
            >
              <Settings size={20} className="text-text-secondary" aria-hidden="true" />
              Cài đặt
            </button>
            <button
              type="button"
              className={cn(rowClass, 'w-full hover:bg-bg-muted')}
              onClick={() => {
                setOpen(false)
                onNavigate?.()
                useSim.getState().set({ demoOpen: true })
              }}
            >
              <FlaskConical size={20} className="text-text-secondary" aria-hidden="true" />
              Bảng điều khiển demo
            </button>
            <button
              type="button"
              className={cn(rowClass, 'w-full hover:bg-bg-muted')}
              onClick={() => {
                stopReply()
                logout()
              }}
            >
              <LogOut size={20} className="text-text-secondary" aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

interface SidebarProps {
  rail?: boolean
  onToggleRail?: () => void
  onNavigate?: () => void
}

export function Sidebar({ rail, onToggleRail, onNavigate }: SidebarProps) {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col p-3">
      <div className={cn('mb-2 flex h-11 items-center', rail ? 'justify-center' : 'justify-between pl-2')}>
        {!rail && <Logo size={28} />}
        {onToggleRail ? (
          <IconButton label={rail ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} onClick={onToggleRail}>
            <PanelLeft size={20} />
          </IconButton>
        ) : (
          rail && <LogoMark size={28} />
        )}
      </div>

      <nav aria-label="Điều hướng chính" className="flex flex-col gap-0.5">
        <button
          type="button"
          aria-label="Trò chuyện mới"
          title={rail ? 'Trò chuyện mới' : undefined}
          onClick={() => {
            selectConversation(null)
            navigate('/')
            onNavigate?.()
          }}
          className={cn(rowClass, 'mb-2 border border-border-default hover:border-accent hover:bg-accent-soft hover:text-accent-strong', rail && 'justify-center px-0')}
        >
          <Plus size={20} aria-hidden="true" className="shrink-0" />
          {!rail && 'Trò chuyện mới'}
        </button>
        <button
          type="button"
          aria-label="Tìm nhanh"
          aria-keyshortcuts="Control+K"
          title={rail ? 'Tìm nhanh' : undefined}
          onClick={() => {
            onNavigate?.()
            useSim.getState().set({ paletteOpen: true })
          }}
          className={cn(rowClass, 'text-text-secondary hover:bg-bg-muted hover:text-text-primary', rail && 'justify-center px-0')}
        >
          <Search size={20} aria-hidden="true" className="shrink-0" />
          {!rail && (
            <>
              <span className="flex-1 text-left">Tìm nhanh</span>
              <kbd className="t-caption rounded-[6px] border border-border-default px-1.5 font-sans max-lg:hidden">{isMac() ? '⌘K' : 'Ctrl K'}</kbd>
            </>
          )}
        </button>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            title={rail ? label : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(rowClass, rail && 'justify-center px-0', isActive ? 'bg-accent-soft text-accent-strong' : 'text-text-secondary hover:bg-bg-muted hover:text-text-primary')
            }
          >
            <Icon size={20} aria-hidden="true" className="shrink-0" />
            {!rail && label}
          </NavLink>
        ))}
      </nav>

      {rail ? <div className="flex-1" /> : <ConversationList onNavigate={onNavigate} />}

      <div className="mt-2 border-t border-border-divider pt-2">
        <AccountMenu rail={rail} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
