import * as Popover from '@radix-ui/react-popover'
import { ArrowRight, Bookmark, CalendarDays, Check, CircleAlert, Info, Mail, Pencil, Plus, StickyNote, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Button, IconButton } from '../../components/ui/Button'
import { Chip, Tag } from '../../components/ui/Controls'
import { Field, TextareaField } from '../../components/ui/Field'
import { cn, dueLabel, isEmail } from '../../lib/utils'
import type { Card, EmailCard, MemoryCard, NoteCard, RescheduleCard, ScheduleCard } from '../../store/types'
import { dismissMemory, saveMemory } from '../memory/actions'
import { addIeltsGoal, patchCard, type MessageRef } from './actions'
import { slotLabel } from './script'

export function WhyLink({ children, className = 'text-accent-strong' }: { children: ReactNode; className?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger className={cn('t-caption -my-3 inline-flex min-h-11 items-center gap-1 hover:underline', className)}>
        <Info size={16} aria-hidden="true" />
        Vì sao?
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={4}
          collisionPadding={16}
          className="pop t-small z-30 max-w-[320px] rounded-ctl bg-bg-surface p-4 shadow-float"
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// Khung chung: đầu thẻ nêu loại và trạng thái, thân thẻ là nội dung; thẻ đang chờ xác nhận có viền nhấn.
function Shell({ proposal, icon, label, why, children }: { proposal: boolean; icon: ReactNode; label: string; why?: string; children: ReactNode }) {
  return (
    <section aria-label={label} className={cn('overflow-hidden rounded-card border bg-bg-surface shadow-card', proposal ? 'border-accent/50' : 'border-border-default')}>
      <div className={cn('flex min-h-11 flex-wrap items-center justify-between gap-2 border-b px-4 py-1.5', proposal ? 'border-accent/20 bg-accent-soft/60' : 'border-border-divider')}>
        <p className={cn('t-small flex items-center gap-2 font-semibold', proposal ? 'text-accent-strong' : 'text-text-secondary')}>
          {icon}
          {label}
        </p>
        {why && <WhyLink>{why}</WhyLink>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Done({ children }: { children: ReactNode }) {
  return (
    <Tag tone="success">
      <Check size={16} aria-hidden="true" />
      {children}
    </Tag>
  )
}

function MemoryCardView({ card, target }: { card: MemoryCard; target: MessageRef }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(card.content)
  const icon = <Bookmark size={16} aria-hidden="true" />

  if (card.state === 'dismissed') {
    return (
      <Shell proposal={false} icon={icon} label="Đề xuất ghi nhớ">
        <p className="t-small text-text-secondary">Đã bỏ qua. Mình không lưu điều này.</p>
      </Shell>
    )
  }
  if (card.state === 'deleted') {
    return (
      <Shell proposal={false} icon={icon} label="Đã xoá">
        <p className="t-small text-text-secondary">Bạn đã xoá điều này khỏi Trí nhớ, mình không dùng nó nữa.</p>
      </Shell>
    )
  }
  if (card.state === 'saved') {
    return (
      <Shell proposal={false} icon={icon} label="Đã ghi nhớ">
        <p className="t-body">{card.content}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <Done>Đã lưu</Done>
          <Button variant="text" small onClick={() => navigate('/memory')}>
            Xem trong Trí nhớ
          </Button>
        </div>
      </Shell>
    )
  }
  if (card.state === 'editing') {
    return (
      <Shell proposal icon={icon} label="Đề xuất ghi nhớ">
        <TextareaField label="Nội dung sẽ lưu" value={draft} onChange={(event) => setDraft(event.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="accent" small disabled={!draft.trim()} onClick={() => saveMemory(target, draft.trim())}>
            Xác nhận lưu
          </Button>
          <Button
            variant="secondary"
            small
            onClick={() =>
              patchCard(target, 'memory', (current) => {
                current.state = 'proposed'
              })
            }
          >
            Huỷ
          </Button>
        </div>
      </Shell>
    )
  }
  return (
    <Shell proposal icon={icon} label="Đề xuất ghi nhớ" why={card.why}>
      <p className="t-body">{card.content}</p>
      <p className="t-small mt-1 text-text-secondary">Mục đích: {card.purpose}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="accent" small onClick={() => saveMemory(target, card.content)}>
          Lưu
        </Button>
        <Button
          variant="secondary"
          small
          onClick={() => {
            setDraft(card.content)
            patchCard(target, 'memory', (current) => {
              current.state = 'editing'
            })
          }}
        >
          <Pencil size={20} />
          Sửa
        </Button>
        <Button variant="text" small onClick={() => dismissMemory(target)}>
          Không lưu
        </Button>
      </div>
    </Shell>
  )
}

function ScheduleCardView({ card, target, onRequest }: { card: ScheduleCard; target: MessageRef; onRequest: () => void }) {
  const navigate = useNavigate()
  const icon = <CalendarDays size={16} aria-hidden="true" />

  if (card.state === 'done') {
    return (
      <Shell proposal={false} icon={icon} label="Lịch đã tạo">
        <p className="t-h5">{card.title}</p>
        <ul className="t-small mt-1 text-text-secondary">
          {card.slots.map((slot) => (
            <li key={slot.id}>{slotLabel(slot)}</li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Done>Đã tạo {card.slots.length} sự kiện</Done>
          <Button variant="text" small onClick={() => navigate('/space/calendar')}>
            Xem lịch
          </Button>
          {card.goalId ? (
            <Done>Đã thêm mục tiêu</Done>
          ) : (
            <Button variant="secondary" small onClick={() => addIeltsGoal(target)}>
              <Plus size={20} />
              Thêm mục tiêu IELTS 6.5
            </Button>
          )}
        </div>
      </Shell>
    )
  }

  const remove = (id: string) =>
    patchCard(target, 'schedule', (current) => {
      const slot = current.slots.find((item) => item.id === id)
      if (!slot) return
      current.slots = current.slots.filter((item) => item.id !== id)
      current.alternatives.push(slot)
      current.alternatives.sort((a, b) => a.weekday - b.weekday)
    })
  const add = (id: string) =>
    patchCard(target, 'schedule', (current) => {
      const slot = current.alternatives.find((item) => item.id === id)
      if (!slot) return
      current.alternatives = current.alternatives.filter((item) => item.id !== id)
      current.slots.push(slot)
      current.slots.sort((a, b) => a.weekday - b.weekday)
    })

  return (
    <Shell proposal icon={icon} label="Xem trước lịch" why={card.why}>
      <p className="t-h5">{card.title}, lặp hằng tuần</p>
      {card.slots.length === 0 ? (
        <p className="t-small mt-1 text-text-secondary">Bạn chọn ít nhất một khung giờ ở dưới nhé.</p>
      ) : (
        <ul className="mt-1">
          {card.slots.map((slot) => (
            <li key={slot.id} className="-mr-2 flex items-center justify-between gap-2 border-b border-border-divider last:border-b-0">
              <span className="t-small flex items-center gap-2 font-medium">
                <CalendarDays size={16} className="shrink-0 text-accent" aria-hidden="true" />
                {slotLabel(slot)}
              </span>
              <IconButton label={`Xoá khung ${slotLabel(slot)}`} onClick={() => remove(slot.id)}>
                <X size={20} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      {card.alternatives.length > 0 && (
        <>
          <p className="t-caption mt-2 text-text-secondary">Khung khác còn trống</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {card.alternatives.map((slot) => (
              <Chip key={slot.id} onClick={() => add(slot.id)}>
                <Plus size={16} aria-hidden="true" />
                {slotLabel(slot)}
              </Chip>
            ))}
          </div>
        </>
      )}
      <Button variant="accent" small className="mt-3" disabled={card.slots.length === 0} onClick={onRequest}>
        Tạo lịch
      </Button>
    </Shell>
  )
}

function RescheduleCardView({ card, onRequest }: { card: RescheduleCard; onRequest: () => void }) {
  const icon = <CalendarDays size={16} aria-hidden="true" />
  const done = card.state === 'done'
  return (
    <Shell proposal={!done} icon={icon} label={done ? 'Đã thay đổi' : 'Xem trước thay đổi'} why={done ? undefined : card.why}>
      <ul className="flex flex-col gap-1">
        {card.items.map((item) => (
          <li key={item.taskId} className="t-small flex flex-wrap items-center gap-1.5 rounded-tag bg-bg-muted/60 px-3 py-2">
            <span className="font-medium">{item.title}:</span>
            <span className="text-text-secondary">{dueLabel(item.from)}</span>
            <ArrowRight size={16} aria-label="dời sang" />
            <span>Ngày mai</span>
          </li>
        ))}
      </ul>
      {done ? (
        <div className="mt-2">
          <Done>Đã dời {card.items.length} việc sang mai</Done>
        </div>
      ) : (
        <>
          {card.state === 'kept' && <p className="t-caption mt-2 text-text-secondary">Mình giữ nguyên kế hoạch cho bạn.</p>}
          <Button variant="accent" small className="mt-3" onClick={onRequest}>
            Áp dụng
          </Button>
        </>
      )}
    </Shell>
  )
}

function NoteCardView({ card, onRequest }: { card: NoteCard; onRequest: () => void }) {
  const navigate = useNavigate()
  const done = card.state === 'done'
  return (
    <Shell proposal={!done} icon={<StickyNote size={16} aria-hidden="true" />} label={done ? 'Đã tạo ghi chú' : 'Xem trước ghi chú'}>
      <p className="t-caption text-text-secondary">MIRA soạn</p>
      <p className="t-body mt-1">{card.body}</p>
      {done ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Done>Đã tạo</Done>
          <Button variant="text" small onClick={() => navigate(`/space/notes?note=${card.noteId}`)}>
            Xem ghi chú
          </Button>
        </div>
      ) : (
        <Button variant="accent" small className="mt-3" onClick={onRequest}>
          Tạo ghi chú
        </Button>
      )}
    </Shell>
  )
}

function EmailCardView({ card, target, onRequest }: { card: EmailCard; target: MessageRef; onRequest: () => void }) {
  const icon = <Mail size={16} aria-hidden="true" />

  if (card.state === 'sent') {
    return (
      <Shell proposal={false} icon={icon} label="Email đã gửi">
        <dl className="t-small">
          <dt className="inline text-text-secondary">Tới: </dt>
          <dd className="inline break-all">{card.to}</dd>
          <br />
          <dt className="inline text-text-secondary">Tiêu đề: </dt>
          <dd className="inline">{card.subject}</dd>
        </dl>
        <p className="t-small mt-2 whitespace-pre-line">{card.body}</p>
        <div className="mt-2">
          <Done>Đã gửi lúc {card.sentAt}</Done>
        </div>
      </Shell>
    )
  }

  const edit = (key: 'to' | 'subject' | 'body') => (event: { target: { value: string } }) =>
    patchCard(target, 'email', (current) => {
      current[key] = event.target.value
      if (key === 'to') current.toError = undefined
    })

  const send = () => {
    if (!isEmail(card.to)) {
      patchCard(target, 'email', (current) => {
        current.toError = 'Email người nhận chưa đúng dạng. Ví dụ: thay@truong.edu.vn'
      })
      return
    }
    onRequest()
  }

  return (
    <Shell proposal icon={icon} label="Nháp email">
      <p className="t-caption text-text-secondary">MIRA soạn</p>
      <div className="mt-2 flex flex-col gap-3">
        <Field label="Tới" type="email" placeholder="Nhập email người nhận" value={card.to} error={card.toError} onChange={edit('to')} />
        <Field label="Tiêu đề" value={card.subject} onChange={edit('subject')} />
        <TextareaField label="Nội dung" rows={6} value={card.body} onChange={edit('body')} />
      </div>
      {card.state === 'cancelled' && <p className="t-caption mt-2 text-text-secondary">Chưa gửi, bản nháp vẫn ở đây.</p>}
      {card.state === 'failed' && (
        <p className="t-caption mt-2 flex items-center gap-1 text-danger">
          <CircleAlert size={16} aria-hidden="true" />
          Chưa gửi được email. Bạn kiểm tra kết nối rồi gửi lại nhé.
        </p>
      )}
      <Button variant="accent" small className="mt-3" onClick={send}>
        {card.state === 'failed' ? 'Gửi lại' : 'Gửi'}
      </Button>
    </Shell>
  )
}

export function CardView({ card, target, onRequest }: { card: Card; target: MessageRef; onRequest: () => void }) {
  switch (card.kind) {
    case 'memory':
      return <MemoryCardView card={card} target={target} />
    case 'schedule':
      return <ScheduleCardView card={card} target={target} onRequest={onRequest} />
    case 'reschedule':
      return <RescheduleCardView card={card} onRequest={onRequest} />
    case 'note':
      return <NoteCardView card={card} onRequest={onRequest} />
    case 'email':
      return <EmailCardView card={card} target={target} onRequest={onRequest} />
  }
}
