import { create } from 'zustand'

// Các tình huống chỉ dùng khi demo, bật từ bảng điều khiển demo.
interface SimState {
  page: 'normal' | 'loading' | 'error'
  demoOpen: boolean
  paletteOpen: boolean
  chatError: boolean
  sendFailure: boolean
  scheduleConflict: boolean
  workflowFailure: boolean
  set: (patch: Partial<Omit<SimState, 'set'>>) => void
}

export const useSim = create<SimState>((set) => ({
  page: 'normal',
  demoOpen: false,
  paletteOpen: false,
  chatError: false,
  sendFailure: false,
  scheduleConflict: false,
  workflowFailure: false,
  set: (patch) => set(patch),
}))
