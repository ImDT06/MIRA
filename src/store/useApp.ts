import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { DEMO_EMAIL, defaultSettings, defaultWorkflows, demoAccount, emptyData, minhData } from './seed'
import type { Account, ThemePref, UserData } from './types'

interface AppState {
  accounts: Record<string, Account>
  currentEmail: string | null
  theme: ThemePref
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  createAccount: (input: Pick<Account, 'name' | 'email' | 'password' | 'interests'>) => void
  login: (email: string) => void
  logout: () => void
  update: (recipe: (data: UserData) => void) => void
  updateProfile: (patch: Partial<Pick<Account, 'name'>>) => void
  setTheme: (theme: ThemePref) => void
  replaceDemoData: (data: UserData) => void
  resetAll: () => void
}

const normalize = (email: string) => email.trim().toLowerCase()

export const useApp = create<AppState>()(
  persist(
    immer((set) => ({
      accounts: { [demoAccount().email]: demoAccount() },
      currentEmail: null,
      theme: 'system',
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed
        }),
      createAccount: (input) =>
        set((state) => {
          const email = normalize(input.email)
          state.accounts[email] = { ...input, email, data: emptyData() }
          state.currentEmail = email
        }),
      login: (email) =>
        set((state) => {
          state.currentEmail = normalize(email)
        }),
      logout: () =>
        set((state) => {
          state.currentEmail = null
        }),
      update: (recipe) =>
        set((state) => {
          if (state.currentEmail) recipe(state.accounts[state.currentEmail].data)
        }),
      updateProfile: (patch) =>
        set((state) => {
          if (state.currentEmail) Object.assign(state.accounts[state.currentEmail], patch)
        }),
      setTheme: (theme) =>
        set((state) => {
          state.theme = theme
        }),
      replaceDemoData: (data) =>
        set((state) => {
          const account = demoAccount()
          state.accounts[account.email] = { ...account, data }
          state.currentEmail = account.email
        }),
      resetAll: () =>
        set((state) => {
          const account = demoAccount()
          state.accounts = { [account.email]: account }
          state.currentEmail = null
        }),
    })),
    {
      name: 'mira-demo',
      version: 2,
      // Bản lưu cũ của tài khoản mẫu được thay bằng bộ dữ liệu mẫu mới; tài khoản tự đăng ký giữ nguyên.
      migrate: (persisted, version) => {
        const state = persisted as Partial<AppState>
        if (version < 2 && state.accounts?.[DEMO_EMAIL]) state.accounts[DEMO_EMAIL].data = minhData()
        return state as AppState
      },
      // Câu trả lời đang chạy dở và trò chuyện tạm thời không được giữ lại sau khi tải lại trang.
      onRehydrateStorage: () => (state) => {
        if (!state) return
        for (const account of Object.values(state.accounts)) {
          const { data } = account
          data.habits ??= []
          data.workflows ??= defaultWorkflows()
          data.notifications ??= []
          data.settings ??= defaultSettings()
          data.conversations = data.conversations.filter((c) => !c.temporary)
          if (!data.conversations.some((c) => c.id === data.activeConversationId)) data.activeConversationId = null
          for (const conversation of data.conversations) {
            for (const message of conversation.messages) {
              if (message.status === 'streaming') message.status = 'stopped'
            }
          }
        }
      },
    },
  ),
)

const FALLBACK = emptyData()

export const getData = () => {
  const { accounts, currentEmail } = useApp.getState()
  return currentEmail ? accounts[currentEmail].data : FALLBACK
}

export const updateData = (recipe: (data: UserData) => void) => useApp.getState().update(recipe)

export const useData = <T,>(selector: (data: UserData) => T) =>
  useApp((state) => selector(state.currentEmail ? state.accounts[state.currentEmail].data : FALLBACK))

export const useAccount = () => useApp((state) => (state.currentEmail ? state.accounts[state.currentEmail] : null))

export const accountExists = (email: string) => normalize(email) in useApp.getState().accounts

export const checkLogin = (email: string, password: string) =>
  useApp.getState().accounts[normalize(email)]?.password === password

const applyTheme = (pref: ThemePref) => {
  const dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

applyTheme(useApp.getState().theme)
useApp.subscribe((state) => applyTheme(state.theme))
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(useApp.getState().theme))
