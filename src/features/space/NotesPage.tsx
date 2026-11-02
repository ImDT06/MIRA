import { Plus, Search, StickyNote, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Card, EmptyState } from '../../components/ui/Controls'
import { Dialog } from '../../components/ui/Dialog'
import { Field, TextareaField } from '../../components/ui/Field'
import { addDays, dueLabel, uid } from '../../lib/utils'
import { updateData, useData } from '../../store/useApp'
import { toast } from '../../store/useToast'
import type { Note } from '../../store/types'

function NoteEditor({ note, onClose }: { note: Note | null; onClose: () => void }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [error, setError] = useState('')

  const save = () => {
    if (!title.trim() && !body.trim()) return setError('Bạn viết gì đó trước khi lưu nhé.')
    const finalTitle = title.trim() || body.trim().slice(0, 40)
    updateData((data) => {
      const existing = data.notes.find((item) => item.id === note?.id)
      if (existing) {
        existing.title = finalTitle
        existing.body = body
      } else {
        data.notes.unshift({ id: uid(), title: finalTitle, body, createdAt: addDays(0), source: 'user' })
      }
    })
    toast(note ? 'Đã cập nhật ghi chú' : 'Đã tạo ghi chú')
    onClose()
  }

  const remove = () => {
    if (!note) return
    updateData((data) => {
      data.notes = data.notes.filter((item) => item.id !== note.id)
    })
    toast('Đã xoá ghi chú', () =>
      updateData((data) => {
        data.notes.unshift(note)
      }),
    )
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={note ? 'Sửa ghi chú' : 'Ghi chú mới'}
      footer={
        <>
          {note && (
            <Button variant="danger" className="mr-auto" onClick={remove}>
              <Trash2 size={20} />
              Xoá
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={save}>Lưu</Button>
        </>
      }
    >
      {note?.source === 'mira' && <p className="t-caption mb-2 text-accent">MIRA soạn</p>}
      <div className="flex flex-col gap-3">
        <Field label="Tiêu đề" value={title} error={error} onChange={(event) => setTitle(event.target.value)} />
        <TextareaField label="Nội dung" rows={8} value={body} onChange={(event) => setBody(event.target.value)} />
      </div>
    </Dialog>
  )
}

export function NotesPage() {
  const notes = useData((data) => data.notes)
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const openId = params.get('note')
  const opened = notes.find((note) => note.id === openId) ?? null

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? notes.filter((note) => `${note.title} ${note.body}`.toLowerCase().includes(term)) : notes
  }, [notes, query])

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={20} className="pointer-events-none absolute left-3 top-3 text-text-secondary" aria-hidden="true" />
          <Field
            label="Tìm ghi chú"
            className="[&>input]:pl-10 [&>label]:sr-only"
            placeholder="Tìm ghi chú"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={20} />
          Thêm ghi chú
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <EmptyState icon={<StickyNote size={48} />} text="Chưa có ghi chú nào. Bạn ghi lại ý tưởng đầu tiên nhé."
            action={
              <Button variant="secondary" small onClick={() => setCreating(true)}>
                <Plus size={20} />
                Viết ghi chú đầu tiên
              </Button>
            }
          />
        </Card>
      ) : results.length === 0 ? (
        <p className="t-small py-4 text-center text-text-secondary">Không tìm thấy ghi chú nào khớp với “{query}”.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => setParams({ note: note.id })}
                className="lift flex h-full w-full flex-col rounded-card border border-transparent bg-bg-surface p-4 text-left shadow-card hover:border-border-default"
              >
                <span className="t-h5 line-clamp-2">{note.title}</span>
                <span className="t-small mt-1 line-clamp-3 flex-1 whitespace-pre-line text-text-secondary">{note.body}</span>
                <span className="t-caption mt-2 text-text-secondary">
                  {note.source === 'mira' && <span className="text-accent">MIRA soạn · </span>}
                  {dueLabel(note.createdAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {creating && <NoteEditor note={null} onClose={() => setCreating(false)} />}
      {opened && <NoteEditor key={opened.id} note={opened} onClose={() => setParams({})} />}
    </>
  )
}
