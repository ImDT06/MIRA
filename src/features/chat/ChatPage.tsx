import { ArrowDown, BatteryLow, Bookmark, CalendarPlus, ChevronRight, HeartHandshake, Mail, Upload, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type DragEvent, type RefObject } from 'react'
import { Link } from 'react-router'
import { LogoMark } from '../../components/Logo'
import { IconButton } from '../../components/ui/Button'
import { addDays } from '../../lib/utils'
import { occursOn } from '../../store/selectors'
import { useAccount, useData } from '../../store/useApp'
import { Checkin } from '../today/Checkin'
import { Composer, type ComposerHandle } from './Composer'
import { ConfirmDialog } from './ConfirmDialog'
import { sendMessage } from './engine'
import { isSettled, MessageView } from './MessageView'
import { SUGGESTIONS } from './script'

const SUGGESTION_ICONS: Record<string, LucideIcon> = {
  'Chia sẻ áp lực': HeartHandshake,
  'Xếp lịch ôn IELTS': CalendarPlus,
  'Soạn email': Mail,
  'Hôm nay mình kiệt sức': BatteryLow,
}

const Disclaimer = () => <p className="t-caption mt-2 text-center text-text-secondary">MIRA có thể nhầm. Hãy kiểm tra thông tin quan trọng.</p>

// S04 rút gọn: một dòng tóm tắt, phần đầy đủ nằm ở mục Hôm nay.
function TodayLine() {
  const tasks = useData((data) => data.tasks)
  const events = useData((data) => data.events)
  const summary = useMemo(() => {
    const today = addDays(0)
    const openTasks = tasks.filter((task) => task.due === today && (task.status === 'Cần làm' || task.status === 'Đang làm')).length
    const next = events.filter((event) => occursOn(event, today)).sort((a, b) => a.start.localeCompare(b.start))[0]
    return [next && `${next.title} ${next.start}`, openTasks > 0 && `${openTasks} việc cần làm`].filter(Boolean).join(' · ')
  }, [tasks, events])

  return (
    <Link to="/today" className="t-small inline-flex min-h-11 max-w-full items-center gap-1 rounded-ctl px-2 text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary">
      <span className="truncate">
        <span className="font-semibold text-text-primary">Hôm nay</span>
        {summary && ` · ${summary}`}
      </span>
      <ChevronRight size={16} className="shrink-0" aria-hidden="true" />
    </Link>
  )
}

function NewChat({ temporary, composerRef }: { temporary: boolean; composerRef: RefObject<ComposerHandle | null> }) {
  const account = useAccount()
  const isNewAccount = useData((data) => data.tasks.length === 0 && data.conversations.every((c) => c.messages.length === 0))
  return (
    <div className="flex min-h-full flex-col justify-center px-4 py-6">
      <div className="mx-auto w-full max-w-[720px]">
        <div className="mb-6 text-center">
          <LogoMark size={40} className="mx-auto" />
          <h2 className="t-h2 mt-3">Chào {account?.name}, mình giúp gì được cho bạn?</h2>
          {isNewAccount && <p className="t-body mt-1 text-text-secondary">Hãy kể cho mình về tuần này.</p>}
        </div>
        <Composer ref={composerRef} busy={false} autoFocus />
        <Disclaimer />
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map(({ label, prompt }) => {
            const Icon = SUGGESTION_ICONS[label]
            return (
            <li key={label}>
              <button
                type="button"
                title={prompt}
                onClick={() => sendMessage(prompt)}
                className="t-small lift inline-flex min-h-10 items-center gap-2 rounded-full border border-border-default bg-bg-surface px-4 py-2 font-medium hover:border-accent hover:text-accent-strong"
              >
                <Icon size={16} className="shrink-0 text-accent" aria-hidden="true" />
                {label}
              </button>
            </li>
            )
          })}
        </ul>
        {!temporary && (
          <div className="mt-6 flex flex-col items-center gap-1">
            <Checkin compact />
            <TodayLine />
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatPage() {
  const conversations = useData((data) => data.conversations)
  const activeId = useData((data) => data.activeConversationId)
  const memories = useData((data) => data.memories)
  const memoryEnabled = useData((data) => data.memoryEnabled)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [awayFromBottom, setAwayFromBottom] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const followRef = useRef(true)
  const composerRef = useRef<ComposerHandle>(null)

  const conversation = useMemo(() => conversations.find((c) => c.id === activeId), [conversations, activeId])
  const messages = conversation?.messages ?? []
  const lastMessage = messages[messages.length - 1]
  const busy = lastMessage?.status === 'streaming'
  const temporary = conversation?.temporary ?? false

  const usedCount = useMemo(
    () => (memoryEnabled ? memories.filter((memory) => memory.status === 'active' && conversation?.usedMemoryIds.includes(memory.id)).length : 0),
    [memories, memoryEnabled, conversation?.usedMemoryIds],
  )

  const jumpToLatest = () => {
    const element = scrollRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
    followRef.current = true
    setAwayFromBottom(false)
  }

  // Người dùng đang kéo lên đọc tin cũ thì không tự cuộn xuống; đổi hội thoại hoặc gửi tin mới thì về cuối.
  useEffect(jumpToLatest, [activeId, messages.length])
  useEffect(() => {
    const element = scrollRef.current
    if (element && followRef.current) element.scrollTop = element.scrollHeight
  }, [lastMessage?.text, lastMessage?.card?.kind])

  const onScroll = () => {
    const element = scrollRef.current
    if (!element) return
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 80
    followRef.current = nearBottom
    setAwayFromBottom(!nearBottom)
  }

  const onDragEnter = (event: DragEvent) => {
    if (event.dataTransfer.types.includes('Files')) setDragging(true)
  }

  const requestedMessage = messages.find((message) => message.id === requesting)
  const editableId = !busy && lastMessage?.role === 'mira' && !isSettled(lastMessage.card) ? messages[messages.length - 2]?.id : undefined

  return (
    <div className="relative flex h-full flex-col" onDragEnter={onDragEnter}>
      {temporary && <p className="t-small shrink-0 bg-bg-muted px-4 py-2 text-center">Trò chuyện tạm thời – MIRA không ghi nhớ cuộc trò chuyện này</p>}

      {messages.length === 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NewChat temporary={temporary} composerRef={composerRef} />
        </div>
      ) : (
        <>
          <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="mx-auto flex max-w-[720px] flex-col gap-6">
              {messages.map((message) => (
                <MessageView
                  key={message.id}
                  message={message}
                  conversationId={conversation!.id}
                  latest={message === lastMessage}
                  editable={message.id === editableId}
                  busy={busy}
                  nextMessageId={messages[messages.indexOf(message) + 1]?.id}
                  onRequest={setRequesting}
                />
              ))}
            </div>
          </div>
          <div className="relative shrink-0 px-4 pb-3 pt-1">
            {awayFromBottom && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <IconButton label="Xuống tin mới nhất" className="border border-border-default bg-bg-surface shadow-float" onClick={jumpToLatest}>
                  <ArrowDown size={20} />
                </IconButton>
              </div>
            )}
            <div className="mx-auto max-w-[720px]">
              {usedCount > 0 && (
                <Link to="/memory" className="t-caption inline-flex min-h-8 items-center gap-1 px-1 text-accent hover:underline">
                  <Bookmark size={16} aria-hidden="true" />
                  Đang dùng {usedCount} điều đã ghi nhớ
                </Link>
              )}
              <Composer ref={composerRef} busy={busy} />
              <Disclaimer />
            </div>
          </div>
        </>
      )}

      {dragging && (
        <div
          className="absolute inset-2 z-20 flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-accent bg-accent-soft text-accent-strong"
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            composerRef.current?.addFiles([...event.dataTransfer.files])
          }}
        >
          <Upload size={24} aria-hidden="true" />
          <p className="t-h4">Thả ảnh hoặc tệp vào đây</p>
          <p className="t-small">Tối đa 5 tệp, mỗi tệp không quá 10 MB</p>
        </div>
      )}

      {requestedMessage?.card && conversation && (
        <ConfirmDialog
          card={requestedMessage.card}
          target={{ conversationId: conversation.id, messageId: requestedMessage.id }}
          onClose={() => setRequesting(null)}
        />
      )}
    </div>
  )
}
