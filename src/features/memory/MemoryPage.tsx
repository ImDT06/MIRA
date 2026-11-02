import { Bookmark, CircleAlert, Pencil, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { approvePendingMemory, deleteMemory, editMemory, rejectPendingMemory } from './actions'
import { Button, IconButton } from '../../components/ui/Button'
import { Card, EmptyState, PageHeader } from '../../components/ui/Controls'
import { Dialog } from '../../components/ui/Dialog'
import { Field, TextareaField } from '../../components/ui/Field'
import { dueLabel } from '../../lib/utils'
import { useData } from '../../store/useApp'
import type { Memory } from '../../store/types'

function DeleteConfirm({ memory, onCancel, onDeleted }: { memory: Memory; onCancel: () => void; onDeleted: () => void }) {
  return (
    <Dialog
      open
      onClose={onCancel}
      dismissible={false}
      title="Xoá điều này khỏi Trí nhớ?"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Huỷ
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              deleteMemory(memory.id)
              onDeleted()
            }}
          >
            <Trash2 size={20} />
            Xoá
          </Button>
        </>
      }
    >
      <p className="t-body">“{memory.content}”</p>
      <p className="t-small mt-2 text-text-secondary">Từ giờ MIRA sẽ không dùng điều này nữa.</p>
      <p className="t-small mt-2 font-semibold text-danger">Không thể hoàn tác.</p>
    </Dialog>
  )
}

// S08
function MemoryDialog({ memory, onClose, onDelete }: { memory: Memory; onClose: () => void; onDelete: () => void }) {
  const [content, setContent] = useState(memory.content)
  const unchanged = content.trim() === memory.content
  return (
    <Dialog
      open
      onClose={onClose}
      title="Chi tiết trí nhớ"
      footer={
        <>
          <Button variant="danger" className="mr-auto" onClick={onDelete}>
            <Trash2 size={20} />
            Xoá
          </Button>
          <Button
            variant="accent"
            disabled={!content.trim() || unchanged}
            onClick={() => {
              editMemory(memory.id, content.trim())
              onClose()
            }}
          >
            Lưu
          </Button>
        </>
      }
    >
      <TextareaField label="Nội dung" value={content} onChange={(event) => setContent(event.target.value)} />
      <p className="t-caption mt-2 text-text-secondary">
        Nguồn: {memory.source} · Tạo lúc: {dueLabel(memory.createdAt)} · Cập nhật: {dueLabel(memory.updatedAt)}
      </p>
    </Dialog>
  )
}

export function MemoryPage() {
  const memories = useData((data) => data.memories)
  const memoryEnabled = useData((data) => data.memoryEnabled)
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const pending = useMemo(() => memories.filter((memory) => memory.status === 'pending'), [memories])
  const active = useMemo(() => memories.filter((memory) => memory.status === 'active'), [memories])
  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? active.filter((memory) => memory.content.toLowerCase().includes(term)) : active
  }, [active, query])

  const opened = active.find((memory) => memory.id === openId)
  const deleting = active.find((memory) => memory.id === deletingId)

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 pb-8 pt-2 md:px-8">
      <PageHeader title="Trí nhớ" description="Những điều MIRA đang nhớ về bạn. Chỉ những gì bạn đồng ý mới được lưu." />

      {!memoryEnabled && (
        <div className="t-small flex flex-wrap items-center gap-x-2 rounded-ctl bg-warning-soft px-4 py-2 text-warning" role="status">
          <CircleAlert size={20} className="shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">Trí nhớ đang tắt nên MIRA không dùng những điều dưới đây.</span>
          <Link to="/settings" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2">
            Mở Cài đặt
          </Link>
        </div>
      )}

      {pending.length > 0 && (
        <section aria-labelledby="pending-heading" className="rounded-card bg-accent-soft p-4">
          <h2 id="pending-heading" className="t-overline text-accent-strong">
            Đang chờ bạn duyệt
          </h2>
          <ul className="mt-2 flex flex-col gap-3">
            {pending.map((memory) => (
              <li key={memory.id}>
                <p className="t-body">{memory.content}</p>
                {memory.purpose && <p className="t-small text-text-secondary">Mục đích: {memory.purpose}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="accent" small onClick={() => approvePendingMemory(memory.id)}>
                    Lưu
                  </Button>
                  <Button variant="text" small onClick={() => rejectPendingMemory(memory.id)}>
                    Không lưu
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {active.length === 0 ? (
        <Card>
          <EmptyState icon={<Bookmark size={48} />} text="MIRA chưa nhớ điều gì. Khi trò chuyện, mình sẽ hỏi bạn trước khi lưu."
            action={
              <Link to="/" className="t-button press inline-flex h-10 items-center rounded-ctl px-3 text-accent hover:bg-accent-soft">
                Bắt đầu trò chuyện
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search size={20} className="pointer-events-none absolute left-3 top-3 text-text-secondary" aria-hidden="true" />
            <Field
              label="Tìm trong Trí nhớ"
              className="[&>input]:pl-10 [&>label]:sr-only"
              placeholder="Tìm trong Trí nhớ"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {results.length === 0 ? (
            <p className="t-small py-4 text-center text-text-secondary">Không tìm thấy điều nào khớp với “{query}”.</p>
          ) : (
            <Card className="px-4 py-1">
              <p className="t-overline pb-1 pt-3 text-text-secondary">{results.length} điều MIRA đang nhớ</p>
              <ul className="divide-y divide-border-divider">
                {results.map((memory) => (
                  <li key={memory.id} className="-mx-2 px-2 transition-colors duration-150 ease-out hover:rounded-ctl hover:bg-bg-muted/60 flex items-center gap-1 py-2">
                    <button type="button" className="min-w-0 flex-1 rounded-tag text-left" onClick={() => setOpenId(memory.id)}>
                      <span className="t-body block">{memory.content}</span>
                      <span className="t-caption mt-0.5 block text-text-secondary">
                        {memory.source} · {dueLabel(memory.createdAt)}
                      </span>
                    </button>
                    <IconButton label={`Sửa: ${memory.content}`} onClick={() => setOpenId(memory.id)}>
                      <Pencil size={20} />
                    </IconButton>
                    <IconButton label={`Xoá: ${memory.content}`} className="hover:text-danger" onClick={() => setDeletingId(memory.id)}>
                      <Trash2 size={20} />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {opened && !deleting && (
        <MemoryDialog
          memory={opened}
          onClose={() => setOpenId(null)}
          onDelete={() => setDeletingId(opened.id)}
        />
      )}
      {deleting && (
        <DeleteConfirm
          memory={deleting}
          onCancel={() => setDeletingId(null)}
          onDeleted={() => {
            setDeletingId(null)
            setOpenId(null)
          }}
        />
      )}
    </div>
  )
}
