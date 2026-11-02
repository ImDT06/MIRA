import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconButton } from './Button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  // Hộp xác nhận gửi hoặc xoá chỉ đóng bằng nút, không đóng bằng Esc hay bấm ra ngoài.
  dismissible?: boolean
  children: ReactNode
  footer?: ReactNode
}

export function Dialog({ open, onClose, title, dismissible = true, children, footer }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fade fixed inset-0 z-40 bg-overlay" />
        <RadixDialog.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(event) => !dismissible && event.preventDefault()}
          onInteractOutside={(event) => !dismissible && event.preventDefault()}
          className="dialog-pop fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-dlg bg-bg-surface shadow-float"
        >
          <div className="flex items-start justify-between gap-2 px-6 pt-6">
            <RadixDialog.Title className="t-h2">{title}</RadixDialog.Title>
            {dismissible && (
              <RadixDialog.Close asChild>
                <IconButton label="Đóng" className="-mr-2 -mt-2">
                  <X size={20} />
                </IconButton>
              </RadixDialog.Close>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 px-6 pb-6">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
