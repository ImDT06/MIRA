import * as Popover from '@radix-ui/react-popover'
import * as RadixSelect from '@radix-ui/react-select'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Eye, EyeOff } from 'lucide-react'
import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref, type TextareaHTMLAttributes } from 'react'
import { addDays, cn, shiftISODate, toISODate, weekDates, WEEKDAYS_SHORT } from '../../lib/utils'
import { IconButton } from './Button'

const CONTROL =
  't-body w-full rounded-ctl border bg-bg-surface text-text-primary placeholder:text-text-secondary transition-[border-color,box-shadow] duration-150 ease-out focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:bg-bg-muted disabled:text-text-secondary'

const controlState = (error?: string) => (error ? 'border-danger' : 'border-border-default hover:border-text-secondary')

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="t-caption mt-1 flex items-start gap-1 text-danger">
      <CircleAlert size={16} className="shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  ref?: Ref<HTMLInputElement>
}

export function Field({ label, error, hint, className, ref, ...props }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="t-small mb-1.5 block font-medium">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL, controlState(error), 'h-11 px-3')}
        {...props}
      />
      {error ? (
        <FieldError id={`${id}-error`}>{error}</FieldError>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="t-caption mt-1 text-text-secondary">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export function PasswordField({ label, error, hint, className, ...props }: FieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="t-small mb-1.5 block font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(CONTROL, controlState(error), 'h-11 pl-3 pr-12')}
          {...props}
        />
        <IconButton
          label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className="absolute right-0 top-0"
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </IconButton>
      </div>
      {error ? (
        <FieldError id={`${id}-error`}>{error}</FieldError>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="t-caption mt-1 text-text-secondary">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

interface SelectFieldProps {
  label: string
  options: readonly string[]
  value: string
  onChange: (event: { target: { value: string } }) => void
  className?: string
}

export function SelectField({ label, options, value, onChange, className }: SelectFieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="t-small mb-1.5 block font-medium">
        {label}
      </label>
      <RadixSelect.Root value={value} onValueChange={(next) => onChange({ target: { value: next } })}>
        <RadixSelect.Trigger id={id} className={cn(CONTROL, controlState(), 'group flex h-11 cursor-pointer items-center justify-between gap-2 px-3 text-left data-[state=open]:border-accent data-[state=open]:shadow-[0_0_0_3px_var(--accent-soft)]')}>
          <span className="min-w-0 truncate">
            <RadixSelect.Value />
          </span>
          <RadixSelect.Icon>
            <ChevronDown size={18} className="shrink-0 text-text-secondary transition-transform duration-150 ease-out group-data-[state=open]:rotate-180" aria-hidden="true" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content position="popper" sideOffset={4} collisionPadding={12} className="pop z-[70] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-ctl bg-bg-surface shadow-float">
            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option}
                  value={option}
                  className="t-small flex h-10 cursor-pointer items-center justify-between gap-3 rounded-tag px-2.5 outline-none data-[highlighted]:bg-bg-muted data-[state=checked]:font-medium data-[state=checked]:text-accent-strong"
                >
                  <RadixSelect.ItemText>{option}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator>
                    <Check size={16} aria-hidden="true" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  )
}

// Luôn hiện ngày/tháng/năm, không phụ thuộc ngôn ngữ máy như ô ngày mặc định của trình duyệt.
export function DateField({ label, value, onChange, className }: Omit<SelectFieldProps, 'options'>) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(value.slice(0, 7) || addDays(0).slice(0, 7))
  const today = addDays(0)
  const [year, monthNumber] = month.split('-').map(Number)
  const first = `${month}-01`
  const start = weekDates(first)[0]
  const days = Array.from({ length: 42 }, (_, index) => shiftISODate(start, index))
  const shiftMonth = (delta: number) => {
    const next = new Date(year, monthNumber - 1 + delta, 1)
    setMonth(toISODate(next).slice(0, 7))
  }
  const display = value ? value.split('-').reverse().join('/') : 'Chọn ngày'

  return (
    <div className={className}>
      <label htmlFor={id} className="t-small mb-1.5 block font-medium">
        {label}
      </label>
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next && value) setMonth(value.slice(0, 7))
        }}
      >
        <Popover.Trigger id={id} className={cn(CONTROL, controlState(), 'flex h-11 cursor-pointer items-center justify-between gap-2 px-3 text-left data-[state=open]:border-accent data-[state=open]:shadow-[0_0_0_3px_var(--accent-soft)]')}>
          {display}
          <CalendarDays size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            collisionPadding={12}
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              ;(event.currentTarget as HTMLElement).querySelector<HTMLElement>('[aria-pressed="true"]')?.focus({ preventScroll: true })
            }}
            className="pop z-[70] w-[304px] rounded-ctl bg-bg-surface p-3 shadow-float">
            <div className="mb-2 flex items-center justify-between">
              <IconButton label="Tháng trước" className="size-9" onClick={() => shiftMonth(-1)}>
                <ChevronLeft size={18} />
              </IconButton>
              <span className="t-small font-semibold" aria-live="polite">
                Tháng {monthNumber}, {year}
              </span>
              <IconButton label="Tháng sau" className="size-9" onClick={() => shiftMonth(1)}>
                <ChevronRight size={18} />
              </IconButton>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <span key={day} className="t-caption py-1 text-text-secondary" aria-hidden="true">
                  {WEEKDAYS_SHORT[day]}
                </span>
              ))}
              {days.map((iso) => {
                const selected = iso === value
                return (
                  <button
                    key={iso}
                    type="button"
                    aria-label={iso.split('-').reverse().join('/')}
                    aria-pressed={selected}
                    onClick={() => {
                      onChange({ target: { value: iso } })
                      setOpen(false)
                    }}
                    className={cn(
                      't-small press inline-flex h-10 items-center justify-center rounded-tag',
                      selected ? 'bg-accent font-semibold text-on-primary' : 'hover:bg-bg-muted',
                      !selected && !iso.startsWith(month) && 'text-text-secondary opacity-50',
                      !selected && iso === today && 'font-semibold text-accent-strong ring-1 ring-inset ring-accent',
                    )}
                  >
                    {Number(iso.slice(8))}
                  </button>
                )
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => `${String(Math.floor(index / 4)).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`)

// Luôn hiển thị 24 giờ, không phụ thuộc ngôn ngữ trình duyệt như ô giờ mặc định (AM/PM).
export function TimeField({ value, ...props }: Omit<SelectFieldProps, 'options'> & { value: string }) {
  const options = TIME_OPTIONS.includes(value) ? TIME_OPTIONS : [value, ...TIME_OPTIONS].sort()
  return <SelectField options={options} value={value} {...props} />
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextareaField({ label, error, className, ...props }: TextareaFieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="t-small mb-1.5 block font-medium">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={Boolean(error) || undefined}
        className={cn(CONTROL, controlState(error), 'block min-h-24 resize-y px-3 py-2')}
        {...props}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
