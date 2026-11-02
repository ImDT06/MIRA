import * as Tooltip from '@radix-ui/react-tooltip'
import { Navigate, Outlet, Route, Routes } from 'react-router'
import { Toaster } from './components/ui/Toaster'
import { AppShell } from './layout/AppShell'
import { LoginPage, OtpPage, RegisterPage } from './features/auth/AuthPages'
import { AutomationPage, WorkflowConfigPage } from './features/automation/AutomationPages'
import { ChatPage } from './features/chat/ChatPage'
import { ComponentsPage } from './demo/ComponentsPage'
import { DemoPanel } from './demo/DemoPanel'
import { ConnectionsPage } from './features/permissions/ConnectionsPage'
import { TodayPage } from './features/today/TodayPage'
import { MemoryPage } from './features/memory/MemoryPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { CalendarPage } from './features/space/CalendarPage'
import { GoalsPage } from './features/space/GoalsPage'
import { NotesPage } from './features/space/NotesPage'
import { SpaceLayout } from './features/space/SpaceLayout'
import { TasksPage } from './features/space/TasksPage'
import { useApp } from './store/useApp'

function RequireAuth() {
  const signedIn = useApp((state) => state.currentEmail !== null)
  return signedIn ? <Outlet /> : <Navigate to="/login" replace />
}

function GuestOnly() {
  const signedIn = useApp((state) => state.currentEmail !== null)
  return signedIn ? <Navigate to="/" replace /> : <Outlet />
}

export function App() {
  return (
    <Tooltip.Provider delayDuration={350}>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/otp" element={<OtpPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<ChatPage />} />
            <Route path="today" element={<TodayPage />} />
            <Route path="memory" element={<MemoryPage />} />
            <Route path="space" element={<SpaceLayout />}>
              <Route index element={<Navigate to="tasks" replace />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="goals" element={<GoalsPage />} />
            </Route>
            <Route path="automation" element={<AutomationPage />} />
            <Route path="automation/:id" element={<WorkflowConfigPage />} />
            <Route path="connections" element={<ConnectionsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="ui" element={<ComponentsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
      <DemoPanel />
    </Tooltip.Provider>
  )
}
