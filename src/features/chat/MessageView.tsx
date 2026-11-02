import { Check, CircleAlert, Copy, LoaderCircle, Pencil, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { LogoMark } from '../../components/Logo'
import { Button, IconButton } from '../../components/ui/Button'
import { cn } from '../../lib/utils'
import { useApp } from '../../store/useApp'
import { toast } from '../../store/useToast'
import type { Card, Message } from '../../store/types'
import { AttachmentChips } from './AttachmentChips'
import { plainText, RichText } from './RichText'
import { CardView } from './Cards'
import { findConversation, regenerate } from './engine'

export const isSettled = (card?: Card) =>
  card &&
  ((card.kind === 'memory' && (card.state === 'saved' || card.state === 'dismissed' || card.state === 'deleted')) ||
    (card.kind === 'email' && card.state === 'sent') ||
    (card.kind !== 'memory' && card.kind !== 'email' && card.state === 'done'))

interface MessageViewProps {
  message: Message
  conversationId: string
  latest: boolean
  busy: boolean
  editable: boolean
  nextMessageId?: string
  onRequest: (messageId: string) => void
}

function UserMessage({ message, conversationId, editable, nextMessageId }: Pick<MessageViewProps, 'message' | 'conversationId' | 'editable' | 'nextMessageId'>) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.text)

  if (editing) {
    return (
      <div className="ml-auto w-full max-w-[80%]">
        <label htmlFor={`edit-${message.id}`} className="sr-only">
          Sửa tin nhắn
        </label>
        <textarea
          id={`edit-${message.id}`}
          autoFocus
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="t-body block w-full resize-y rounded-card border-2 border-accent bg-bg-surface px-4 py-2.5"
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="secondary" small onClick={() => setEditing(false)}>
            Huỷ
          </Button>
          <Button
            small
            disabled={!draft.trim()}
            onClick={() => {
              setEditing(false)
              if (nextMessageId) regenerate(conversationId, nextMessageId, draft.trim())
            }}
          >
            Gửi lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="message-in group relative flex flex-col items-end gap-1">
      {message.attachments && <AttachmentChips items={message.attachments} />}
      {message.text && <p className="t-body max-w-[80%] whitespace-pre-line break-words rounded-[20px] bg-bg-muted px-4 py-2.5">{message.text}</p>}
      {message.text && (
        <div className="-mr-3 flex opacity-0 transition-opacity duration-150 ease-out focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:absolute [@media(hover:hover)]:right-0 [@media(hover:hover)]:top-full [@media(hover:none)]:-my-1 [@media(hover:none)]:opacity-100">
          <IconButton
            label="Sao chép tin nhắn"
            onClick={() => {
              void navigator.clipboard?.writeText(message.text)
              toast('Đã sao chép')
            }}
          >
            <Copy size={16} />
          </IconButton>
          {editable && (
            <IconButton
              label="Sửa tin nhắn"
              onClick={() => {
                setDraft(message.text)
                setEditing(true)
              }}
            >
              <Pencil size={16} />
            </IconButton>
          )}
        </div>
      )}
    </div>
  )
}

export function MessageView({ message, conversationId, latest, busy, editable, nextMessageId, onRequest }: MessageViewProps) {
  const update = useApp((state) => state.update)

  if (message.role === 'user') {
    return <UserMessage message={message} conversationId={conversationId} editable={editable} nextMessageId={nextMessageId} />
  }

  const streaming = message.status === 'streaming'
  const finished = message.status === 'done'
  const target = { conversationId, messageId: message.id }

  const setFeedback = (value: 'up' | 'down') =>
    update((data) => {
      const item = findConversation(data, conversationId)?.messages.find((candidate) => candidate.id === message.id)
      if (item) item.feedback = item.feedback === value ? undefined : value
    })

  return (
    <div className="message-in group relative flex gap-2">
      <span role="img" aria-label="MIRA" className="shrink-0">
        <LogoMark size={28} />
      </span>
      <div className="flex min-w-0 max-w-[calc(100%-36px)] flex-1 flex-col items-start gap-2">
        {message.tool && (streaming || message.tool.finished) && (
          <span className="t-caption inline-flex min-h-8 items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-accent-strong">
            {message.tool.finished ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            )}
            {message.tool.finished ? message.tool.done : message.tool.running}
          </span>
        )}

        {message.text ? (
          <RichText text={message.text} live={streaming} />
        ) : (
          streaming &&
          !message.tool && (
            <span className="inline-flex h-7 items-center gap-1" role="status" aria-label="MIRA đang trả lời">
              {[0, 200, 400].map((delay) => (
                <span key={delay} className="typing-dot size-2 rounded-full bg-text-secondary" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </span>
          )
        )}

        {message.status === 'stopped' && <p className="t-caption text-text-secondary">Đã dừng</p>}
        {message.status === 'error' && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="t-caption flex items-center gap-1 text-danger">
              <CircleAlert size={16} aria-hidden="true" />
              Mất kết nối nên mình chưa trả lời xong.
            </p>
            <Button variant="secondary" small disabled={busy} onClick={() => regenerate(conversationId, message.id)}>
              <RefreshCw size={20} />
              Thử lại
            </Button>
          </div>
        )}

        {message.card && (
          <div className="w-full max-w-[520px]">
            <CardView card={message.card} target={target} onRequest={() => onRequest(message.id)} />
          </div>
        )}

        {finished && (
          <div
            className={cn(
              '-ml-3 flex transition-opacity duration-150 ease-out',
              latest ? '-my-1' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:hover)]:absolute [@media(hover:hover)]:left-9 [@media(hover:hover)]:top-full [@media(hover:none)]:-my-1 [@media(hover:none)]:opacity-100',
            )}
          >
            <IconButton
              label="Sao chép"
              onClick={() => {
                void navigator.clipboard?.writeText(plainText(message.text))
                toast('Đã sao chép')
              }}
            >
              <Copy size={16} />
            </IconButton>
            <IconButton
              label="Thích"
              aria-pressed={message.feedback === 'up'}
              tone={message.feedback === 'up' ? 'active' : 'default'}
              onClick={() => setFeedback('up')}
            >
              <ThumbsUp size={16} />
            </IconButton>
            <IconButton
              label="Không thích"
              aria-pressed={message.feedback === 'down'}
              tone={message.feedback === 'down' ? 'active' : 'default'}
              onClick={() => setFeedback('down')}
            >
              <ThumbsDown size={16} />
            </IconButton>
            {latest && !busy && !isSettled(message.card) && (
              <IconButton label="Tạo lại" onClick={() => regenerate(conversationId, message.id)}>
                <RefreshCw size={16} />
              </IconButton>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
