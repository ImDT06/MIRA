import { FileText, HardDrive, Image, Mic, Plus, Send, Square } from 'lucide-react'
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { IconButton } from '../../components/ui/Button'
import { FieldError } from '../../components/ui/Field'
import { RowMenu } from '../../components/ui/RowMenu'
import { sleep } from '../../lib/utils'
import type { Attachment } from '../../store/types'
import { AttachmentChips } from './AttachmentChips'
import { ACCEPT_FILES, ACCEPT_IMAGES, prepareFiles } from './attachments'
import { sendMessage, stopReply } from './engine'
import { SUGGESTIONS } from './script'

export interface ComposerHandle {
  addFiles: (files: File[]) => void
}

interface ComposerProps {
  busy: boolean
  autoFocus?: boolean
  ref?: Ref<ComposerHandle>
}

export function Composer({ busy, autoFocus, ref }: ComposerProps) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const imagePicker = useRef<HTMLInputElement>(null)
  const filePicker = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`
  }, [text])

  const addFiles = async (files: File[]) => {
    if (!files.length) return
    const { items, errors: nextErrors } = await prepareFiles(files, attachments.length)
    setAttachments((current) => [...current, ...items])
    setErrors(nextErrors)
    inputRef.current?.focus()
  }

  useImperativeHandle(ref, () => ({ addFiles: (files) => void addFiles(files) }))

  const canSend = !busy && (text.trim().length > 0 || attachments.length > 0)

  const submit = () => {
    if (!canSend) return
    sendMessage(text, attachments)
    setText('')
    setAttachments([])
    setErrors([])
  }

  // Bản demo mô phỏng giọng nói bằng một câu có sẵn, không dùng micro thật.
  const listen = async () => {
    setListening(true)
    await sleep(1500)
    setListening(false)
    setText(SUGGESTIONS[0].prompt)
    inputRef.current?.focus()
  }

  const pickerProps = {
    type: 'file',
    multiple: true,
    hidden: true,
    onChange: (event: { target: HTMLInputElement }) => {
      void addFiles([...(event.target.files ?? [])])
      event.target.value = ''
    },
  }

  return (
    <div>
      <div className="rounded-[20px] border border-border-default bg-bg-surface p-2 shadow-card transition-[border-color,box-shadow] duration-150 ease-out hover:border-text-secondary focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
        {attachments.length > 0 && (
          <div className="px-1 pb-2 pt-1">
            <AttachmentChips items={attachments} onRemove={(id) => setAttachments((current) => current.filter((item) => item.id !== id))} />
          </div>
        )}
        <label htmlFor="chat-input" className="sr-only">
          Nhắn cho MIRA
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          rows={1}
          autoFocus={autoFocus}
          value={text}
          placeholder={listening ? 'Mình đang nghe…' : 'Nhắn cho MIRA…'}
          className="t-body block w-full resize-none bg-transparent px-2 py-2 placeholder:text-text-secondary"
          onChange={(event) => setText(event.target.value)}
          onPaste={(event) => {
            const files = [...event.clipboardData.files]
            if (files.length) {
              event.preventDefault()
              void addFiles(files)
            }
          }}
          onKeyDown={(event) => {
            // Không gửi khi bộ gõ tiếng Việt đang ghép dấu.
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              submit()
            }
          }}
        />
        <div className="flex items-center gap-1">
          <RowMenu
            label="Thêm ảnh hoặc tệp"
            icon={Plus}
            side="top"
            align="start"
            items={[
              { label: 'Ảnh', icon: Image, onSelect: () => imagePicker.current?.click() },
              { label: 'Tệp (PDF, Word, Excel…)', icon: FileText, onSelect: () => filePicker.current?.click() },
              { label: 'Google Drive', icon: HardDrive, disabled: true, hint: 'Sắp có', onSelect: () => undefined },
            ]}
          />
          <input ref={imagePicker} accept={ACCEPT_IMAGES} aria-label="Chọn ảnh" {...pickerProps} />
          <input ref={filePicker} accept={ACCEPT_FILES} aria-label="Chọn tệp" {...pickerProps} />
          <div className="ml-auto flex gap-1">
            <IconButton label={listening ? 'Đang nghe' : 'Nói'} disabled={listening || busy} tone={listening ? 'active' : 'default'} onClick={listen}>
              <Mic size={20} />
            </IconButton>
            {busy ? (
              <IconButton label="Dừng trả lời" tone="solid" onClick={stopReply}>
                <Square size={20} />
              </IconButton>
            ) : (
              <IconButton label="Gửi" disabled={!canSend} tone="solid" onClick={submit}>
                <Send size={20} />
              </IconButton>
            )}
          </div>
        </div>
      </div>
      {errors.map((error) => (
        <FieldError key={error}>{error}</FieldError>
      ))}
    </div>
  )
}
