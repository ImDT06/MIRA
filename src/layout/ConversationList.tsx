import { Pencil, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { Field } from '../components/ui/Field'
import { RowMenu } from '../components/ui/RowMenu'
import { deleteConversation, renameConversation, selectConversation } from '../features/chat/engine'
import { addDays, cn } from '../lib/utils'
import { useData } from '../store/useApp'
import type { Conversation } from '../store/types'

function RenameDialog({ conversation, onClose }: { conversation: Conversation; onClose: () => void }) {
  const [title, setTitle] = useState(conversation.title)
  const [error, setError] = useState('')
  const save = () => {
    if (!title.trim()) return setError('Bạn đặt tên cho cuộc trò chuyện này nhé.')
    renameConversation(conversation.id, title.trim())
    onClose()
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title="Đổi tên cuộc trò chuyện"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={save}>Lưu</Button>
        </>
      }
    >
      <Field
        label="Tên mới"
        autoFocus
        value={title}
        error={error}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') save()
        }}
      />
    </Dialog>
  )
}

export function ConversationList({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const conversations = useData((data) => data.conversations)
  const activeId = useData((data) => data.activeConversationId)
  const [query, setQuery] = useState('')
  const [renaming, setRenaming] = useState<Conversation | null>(null)

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    const saved = conversations
      .filter((c) => !c.temporary && c.messages.length > 0 && (!term || c.title.toLowerCase().includes(term)))
      .reverse()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const today = addDays(0)
    const weekAgo = addDays(-7)
    return [
      { label: 'Hôm nay', items: saved.filter((c) => c.updatedAt === today) },
      { label: '7 ngày qua', items: saved.filter((c) => c.updatedAt !== today && c.updatedAt >= weekAgo) },
      { label: 'Cũ hơn', items: saved.filter((c) => c.updatedAt < weekAgo) },
    ].filter((group) => group.items.length > 0)
  }, [conversations, query])

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col">
      <div className="relative shrink-0">
        <Search size={16} className="pointer-events-none absolute left-3 top-3 text-text-secondary" aria-hidden="true" />
        <input
          type="search"
          aria-label="Tìm cuộc trò chuyện"
          placeholder="Tìm cuộc trò chuyện"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="t-small h-10 w-full rounded-ctl border border-border-divider bg-transparent pl-9 pr-3 transition-colors duration-150 ease-out placeholder:text-text-secondary hover:border-border-default focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 && (
          <p className="t-small px-3 py-2 text-text-secondary">{query.trim() ? 'Không tìm thấy cuộc trò chuyện nào.' : 'Chưa có cuộc trò chuyện nào.'}</p>
        )}
        {groups.map(({ label, items }) => (
          <section key={label} aria-label={label} className="mb-2">
            <p className="t-caption px-3 py-1 text-text-secondary">{label}</p>
            <ul>
              {items.map((conversation) => {
                const active = conversation.id === activeId && pathname === '/'
                return (
                  <li key={conversation.id} className="group/row relative">
                    <button
                      type="button"
                      aria-current={active || undefined}
                      title={conversation.title}
                      onClick={() => {
                        selectConversation(conversation.id)
                        navigate('/')
                        onNavigate?.()
                      }}
                      className={cn(
                        't-small block h-11 w-full truncate rounded-ctl pl-3 pr-3 text-left transition-colors duration-150 ease-out group-focus-within/row:pr-11 group-hover/row:pr-11 [@media(hover:none)]:pr-11',
                        active ? 'bg-accent-soft font-medium text-accent-strong' : 'group-hover/row:bg-bg-muted',
                      )}
                    >
                      {conversation.title}
                    </button>
                    <div className="absolute right-0 top-0 opacity-0 transition-opacity duration-150 ease-out focus-within:opacity-100 group-hover/row:opacity-100 has-[[data-state=open]]:opacity-100 [@media(hover:none)]:opacity-100">
                      <RowMenu
                        label={`Thao tác cho: ${conversation.title}`}
                        items={[
                          { label: 'Đổi tên', icon: Pencil, onSelect: () => setRenaming(conversation) },
                          { label: 'Xoá', icon: Trash2, danger: true, onSelect: () => deleteConversation(conversation.id) },
                        ]}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
      {renaming && <RenameDialog conversation={renaming} onClose={() => setRenaming(null)} />}
    </div>
  )
}
