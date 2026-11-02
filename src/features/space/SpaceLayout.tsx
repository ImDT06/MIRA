import { Calendar, ListChecks, StickyNote, Target } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { PageHeader, Segmented } from '../../components/ui/Controls'

const iconClass = 'max-sm:hidden'

const TABS = [
  { value: 'tasks', label: 'Việc', icon: <ListChecks size={20} className={iconClass} /> },
  { value: 'calendar', label: 'Lịch', icon: <Calendar size={20} className={iconClass} /> },
  { value: 'notes', label: 'Ghi chú', icon: <StickyNote size={20} className={iconClass} /> },
  { value: 'goals', label: 'Mục tiêu', icon: <Target size={20} className={iconClass} /> },
]

export function SpaceLayout() {
  const navigate = useNavigate()
  const current = useLocation().pathname.split('/')[2] ?? 'tasks'
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-4 px-4 pb-8 pt-2 md:px-8">
      <PageHeader title="Không gian" />
      <Segmented label="Không gian cá nhân" value={current} onChange={(value) => navigate(`/space/${value}`)} options={TABS} />
      <div key={current} className="page-enter flex flex-col gap-4">
        <Outlet />
      </div>
    </div>
  )
}
