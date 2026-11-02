import * as RadixDialog from '@radix-ui/react-dialog'
import { Bookmark, Calendar, CornerDownLeft, ListChecks, MessageCircle, MoonStar, Plug, Plus, Search, Settings, StickyNote, Sun, Target, Zap, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { selectConversation } from '../features/chat/engine'
import { cn } from '../lib/utils'
import { useApp, useData } from '../store/useApp'
import { useSim } from '../store/useSim'

interface Command {
  id: string
  group: string
  label: string
  icon: LucideIcon
  run: () => void
}

// Tìm không dấu: gõ "tu dong" vẫn ra "Tự động hoá".
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

const PAGES: Array<[string, string, LucideIcon]> = [
  ['Hôm nay', '/today', Sun],
  ['Trí nhớ', '/memory', Bookmark],
  ['Việc', '/space/tasks', ListChecks],
  ['Lịch', '/space/calendar', Calendar],
  ['Ghi chú', '/space/notes', StickyNote],
  ['Mục tiêu và thói quen', '/space/goals', Target],
  ['Tự động hoá', '/automation', Zap],
  ['Kết nối & quyền', '/connections', Plug],
  ['Cài đặt', '/settings', Settings],
]

const LIMIT_PER_GROUP = 5

export const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform)

export function CommandPalette() {
  const navigate = useNavigate()
  const open = useSim((state) => state.paletteOpen)
  const setSim = useSim((state) => state.set)
  const conversations = useData((data) => data.conversations)
  const tasks = useData((data) => data.tasks)
  const notes = useData((data) => data.notes)
  const goals = useData((data) => data.goals)
  const setTheme = useApp((state) => state.setTheme)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const close = () => setSim({ paletteOpen: false })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSim({ paletteOpen: !useSim.getState().paletteOpen })
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [setSim])

  const commands = useMemo(() => {
    const go = (path: string) => () => navigate(path)
    const dark = document.documentElement.dataset.theme === 'dark'
    const all: Command[] = [
      {
        id: 'new-chat',
        group: 'Thao tác',
        label: 'Trò chuyện mới',
        icon: Plus,
        run: () => {
          selectConversation(null)
          navigate('/')
        },
      },
      { id: 'theme', group: 'Thao tác', label: dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối', icon: dark ? Sun : MoonStar, run: () => setTheme(dark ? 'light' : 'dark') },
      ...PAGES.map(([label, path, icon]) => ({ id: path, group: 'Đi đến', label, icon, run: go(path) })),
      ...conversations
        .filter((c) => !c.temporary && c.messages.length > 0)
        .map((c) => ({
          id: `chat-${c.id}`,
          group: 'Cuộc trò chuyện',
          label: c.title,
          icon: MessageCircle,
          run: () => {
            selectConversation(c.id)
            navigate('/')
          },
        })),
      ...tasks.map((task) => ({ id: `task-${task.id}`, group: 'Việc', label: task.title, icon: ListChecks, run: go('/space/tasks') })),
      ...notes.map((note) => ({ id: `note-${note.id}`, group: 'Ghi chú', label: note.title, icon: StickyNote, run: go(`/space/notes?note=${note.id}`) })),
      ...goals.map((goal) => ({ id: `goal-${goal.id}`, group: 'Mục tiêu', label: goal.title, icon: Target, run: go('/space/goals') })),
    ]
    const term = fold(query.trim())
    // Chưa gõ gì thì chỉ hiện lối tắt, tránh danh sách quá dài.
    if (!term) return all.filter((command) => command.group === 'Thao tác' || command.group === 'Đi đến')
    const counts = new Map<string, number>()
    return all.filter((command) => {
      if (!fold(command.label).includes(term)) return false
      const count = counts.get(command.group) ?? 0
      counts.set(command.group, count + 1)
      return count < LIMIT_PER_GROUP
    })
  }, [query, conversations, tasks, notes, goals, navigate, setTheme])

  useEffect(() => setActive(0), [query])
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])
  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const execute = (command?: Command) => {
    if (!command) return
    close()
    command.run()
  }

  const groups = [...new Set(commands.map((command) => command.group))]

  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => setSim({ paletteOpen: next })}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fade fixed inset-0 z-[60] bg-overlay" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="dialog-pop fixed left-1/2 top-[12dvh] z-[60] flex max-h-[70dvh] w-[calc(100vw-32px)] max-w-[580px] -translate-x-1/2 flex-col overflow-hidden rounded-card bg-bg-surface shadow-float"
        >
          <RadixDialog.Title className="sr-only">Tìm nhanh</RadixDialog.Title>
          <div className="flex shrink-0 items-center gap-3 border-b border-border-divider px-4">
            <Search size={20} className="shrink-0 text-text-secondary" aria-hidden="true" />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-list"
              aria-activedescendant={commands[active] ? `palette-${commands[active].id}` : undefined}
              aria-label="Tìm trang, việc, ghi chú, cuộc trò chuyện"
              placeholder="Tìm trang, việc, ghi chú, cuộc trò chuyện…"
              value={query}
              className="t-body h-14 min-w-0 flex-1 bg-transparent placeholder:text-text-secondary"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setActive((current) => Math.min(current + 1, commands.length - 1))
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  setActive((current) => Math.max(current - 1, 0))
                } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  execute(commands[active])
                }
              }}
            />
          </div>
          <div ref={listRef} id="palette-list" role="listbox" aria-label="Kết quả" className="min-h-0 flex-1 overflow-y-auto p-2">
            {commands.length === 0 && <p className="t-small px-3 py-6 text-center text-text-secondary">Không tìm thấy kết quả cho “{query}”.</p>}
            {groups.map((group) => (
              <div key={group} role="group" aria-label={group} className="mb-1 last:mb-0">
                <p className="t-caption px-3 pb-1 pt-2 text-text-secondary">{group}</p>
                {commands
                  .filter((command) => command.group === group)
                  .map((command) => {
                    const index = commands.indexOf(command)
                    const Icon = command.icon
                    return (
                      <button
                        key={command.id}
                        id={`palette-${command.id}`}
                        type="button"
                        role="option"
                        tabIndex={-1}
                        aria-selected={index === active}
                        onMouseMove={() => setActive(index)}
                        onClick={() => execute(command)}
                        className={cn('t-small flex min-h-10 w-full items-center gap-3 rounded-tag px-3 text-left', index === active && 'bg-bg-muted')}
                      >
                        <Icon size={16} className="shrink-0 text-text-secondary" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{command.label}</span>
                        {index === active && <CornerDownLeft size={14} className="shrink-0 text-text-secondary" aria-hidden="true" />}
                      </button>
                    )
                  })}
              </div>
            ))}
          </div>
          <p className="t-caption flex shrink-0 gap-4 border-t border-border-divider px-4 py-2 text-text-secondary max-sm:hidden">
            <span>↑↓ để chọn</span>
            <span>Enter để mở</span>
            <span>Esc để đóng</span>
          </p>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
