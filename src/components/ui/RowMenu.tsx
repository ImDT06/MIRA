import * as Popover from '@radix-ui/react-popover'
import { Ellipsis, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/utils'
import { IconButton } from './Button'

export interface RowMenuItem {
  label: string
  icon: LucideIcon
  danger?: boolean
  disabled?: boolean
  hint?: string
  onSelect: () => void
}

interface RowMenuProps {
  label: string
  items: RowMenuItem[]
  icon?: LucideIcon
  side?: 'top' | 'bottom'
  align?: 'start' | 'end'
  triggerClassName?: string
}

export function RowMenu({ label, items, icon: Icon = Ellipsis, side = 'bottom', align = 'end', triggerClassName }: RowMenuProps) {
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <IconButton label={label} className={triggerClassName}>
          <Icon size={20} />
        </IconButton>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side={side} align={align} sideOffset={4} collisionPadding={16} className="pop z-[60] min-w-52 rounded-ctl bg-bg-surface p-1 shadow-float">
          {items.map(({ label: itemLabel, icon: ItemIcon, danger, disabled, hint, onSelect }) => (
            <button
              key={itemLabel}
              type="button"
              disabled={disabled}
              className={cn('t-small flex h-11 w-full items-center gap-2 rounded-tag px-2 text-left transition-colors duration-150 ease-out hover:bg-bg-muted disabled:pointer-events-none disabled:opacity-40', danger && 'text-danger hover:bg-danger-soft')}
              onClick={() => {
                setOpen(false)
                onSelect()
              }}
            >
              <ItemIcon size={16} className="shrink-0" aria-hidden="true" />
              <span className="flex-1">{itemLabel}</span>
              {hint && <span className="t-caption text-text-secondary">{hint}</span>}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
