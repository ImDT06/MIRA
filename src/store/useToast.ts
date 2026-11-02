import { create } from 'zustand'
import { uid } from '../lib/utils'

export interface ToastItem {
  id: string
  text: string
  kind: 'success' | 'error'
  action?: { label: string; kind: 'undo' | 'retry'; run: () => void }
}

interface ToastState {
  toasts: ToastItem[]
  show: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (toast) => {
    const id = uid()
    set({ toasts: [...get().toasts, { ...toast, id }] })
    // Thông báo có nút Hoàn tác hiện 8 giây thay vì 4 giây.
    setTimeout(() => get().dismiss(id), toast.action?.kind === 'undo' ? 8000 : 4000)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}))

export const toast = (text: string, undo?: () => void) =>
  useToast.getState().show({
    text,
    kind: 'success',
    action: undo && { label: 'Hoàn tác', kind: 'undo', run: undo },
  })
