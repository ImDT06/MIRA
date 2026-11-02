import type { Priority } from '../store/types'
import { Tag, type TagTone } from './ui/Controls'

const PRIORITY_TONE: Record<Priority, TagTone> = { Cao: 'danger', Vừa: 'warning', Thấp: 'neutral' }

export const PriorityTag = ({ priority }: { priority: Priority }) => <Tag tone={PRIORITY_TONE[priority]}>{priority}</Tag>
