import { Check, CircleAlert, RefreshCw, Undo2 } from 'lucide-react'
import { useLocation } from 'react-router'
import { cn } from '../../lib/utils'
import { useToast } from '../../store/useToast'

export function Toaster() {
  const toasts = useToast((state) => state.toasts)
  const dismiss = useToast((state) => state.dismiss)
  const isChat = useLocation().pathname === '/'
  return (
    <div
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed right-4 z-[60] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2 md:right-6',
        // Ở màn chat, toast 8 giây không được che nút Gửi/Dừng của ô nhập.
        isChat ? 'top-16 md:bottom-[136px] md:top-auto' : 'bottom-4 md:bottom-6',
      )}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-in pointer-events-auto flex min-h-12 items-center gap-2 rounded-ctl bg-primary px-4 py-2 text-on-primary shadow-float"
        >
          {toast.kind === 'success' ? <Check size={20} className="shrink-0" /> : <CircleAlert size={20} className="shrink-0" />}
          <span className="t-small flex-1">{toast.text}</span>
          {toast.action && (
            <button
              type="button"
              className="t-button -my-1 -mr-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-ctl px-2 underline-offset-2 hover:underline focus-visible:outline-on-primary"
              onClick={() => {
                toast.action?.run()
                dismiss(toast.id)
              }}
            >
              {toast.action.kind === 'undo' ? <Undo2 size={16} /> : <RefreshCw size={16} />}
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
