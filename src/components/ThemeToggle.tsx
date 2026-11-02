import { Moon, Sun } from 'lucide-react'
import { useApp } from '../store/useApp'
import { IconButton } from './ui/Button'

export function ThemeToggle() {
  const setTheme = useApp((state) => state.setTheme)
  useApp((state) => state.theme)
  const dark = document.documentElement.dataset.theme === 'dark'
  return (
    <IconButton label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} onClick={() => setTheme(dark ? 'light' : 'dark')}>
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </IconButton>
  )
}
