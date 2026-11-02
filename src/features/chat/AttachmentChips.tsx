import { FileText, X } from 'lucide-react'
import type { Attachment } from '../../store/types'
import { formatSize } from './attachments'

interface AttachmentChipsProps {
  items: Attachment[]
  onRemove?: (id: string) => void
}

export function AttachmentChips({ items, onRemove }: AttachmentChipsProps) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tệp đính kèm">
      {items.map((item) => (
        <li key={item.id} className="relative">
          {item.kind === 'image' ? (
            <img src={item.thumbnail} alt={item.name} title={item.name} className="size-16 rounded-ctl border border-border-divider object-cover" />
          ) : (
            <div className="flex h-16 max-w-[220px] items-center gap-2 rounded-ctl border border-border-default bg-bg-surface px-3">
              <FileText size={20} className="shrink-0 text-accent" aria-hidden="true" />
              <div className="min-w-0">
                <p className="t-small truncate font-medium" title={item.name}>
                  {item.name}
                </p>
                <p className="t-caption text-text-secondary">{formatSize(item.size)}</p>
              </div>
            </div>
          )}
          {onRemove && (
            <button
              type="button"
              aria-label={`Gỡ ${item.name}`}
              title={`Gỡ ${item.name}`}
              onClick={() => onRemove(item.id)}
              className="absolute -right-1.5 -top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-primary text-on-primary before:absolute before:-inset-2.5"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
