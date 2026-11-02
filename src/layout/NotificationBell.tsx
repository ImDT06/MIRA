import * as Popover from '@radix-ui/react-popover'
import { Bell, Bookmark, CircleAlert, Plug, Zap, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { IconButton } from '../components/ui/Button'
import { cn, dateTimeLabel } from '../lib/utils'
import { useApp, useData } from '../store/useApp'
import type { AppNotification } from '../store/types'

const ICONS: Record<AppNotification['kind'], LucideIcon> = { workflow: Zap, memory: Bookmark, permission: Plug, error: CircleAlert }

// S17
export function NotificationBell() {
  const navigate = useNavigate()
  const notifications = useData((data) => data.notifications)
  const update = useApp((state) => state.update)
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((item) => !item.read).length

  const openItem = (item: AppNotification) => {
    update((data) => {
      const target = data.notifications.find((candidate) => candidate.id === item.id)
      if (target) target.read = true
    })
    setOpen(false)
    navigate(item.to)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <IconButton label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'} className="relative">
          <Bell size={20} />
          {unread > 0 && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent" aria-hidden="true" />}
        </IconButton>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          aria-label="Thông báo"
          className="pop z-30 flex max-h-[min(480px,calc(100dvh-80px))] w-[min(380px,calc(100vw-32px))] flex-col rounded-card bg-bg-surface shadow-float"
        >
          <div className="flex min-h-14 items-center justify-between gap-2 px-4 py-2">
            <p className="t-h4">Thông báo</p>
            {unread > 0 && (
              <button
                type="button"
                className="t-caption min-h-11 rounded-tag px-1 text-accent hover:underline"
                onClick={() =>
                  update((data) => {
                    for (const item of data.notifications) item.read = true
                  })
                }
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="t-small px-4 pb-4 text-text-secondary">Bạn chưa có thông báo nào.</p>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto p-1 pt-0">
              {notifications.map((item) => {
                const Icon = ICONS[item.kind]
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className="flex w-full items-start gap-3 rounded-ctl p-3 text-left transition-colors duration-150 ease-out hover:bg-bg-muted"
                    >
                      <Icon size={20} className={cn('mt-0.5 shrink-0', item.kind === 'error' ? 'text-danger' : 'text-text-secondary')} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className={cn('t-small block', !item.read && 'font-semibold')}>{item.title}</span>
                        <span className="t-small block text-text-secondary">{item.body}</span>
                        <span className="t-caption mt-0.5 block text-text-secondary">{dateTimeLabel(item.at)}</span>
                      </span>
                      {!item.read && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent">
                          <span className="sr-only">Chưa đọc</span>
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
