import * as RadixSwitch from '@radix-ui/react-switch'
import * as RadixTabs from '@radix-ui/react-tabs'
import { Check } from 'lucide-react'
import { useId, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  // Chỉ dùng padding mặc định khi nơi gọi không tự đặt, vì p-5 sẽ đè các lớp p-0, p-4 cùng cấp trong CSS.
  const hasPadding = /(^|\s)p[xy]?-/.test(className ?? '')
  return <div className={cn('rounded-card bg-bg-surface shadow-card', !hasPadding && 'p-5', className)} {...props} />
}

// Đầu trang dùng chung để mọi màn có cùng nhịp: quay lại, tiêu đề, mô tả, thao tác chính.
export function PageHeader({ title, description, back, actions }: { title: string; description?: string; back?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-2">
      {back}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="t-h1 min-w-0">{title}</h1>
        {actions}
      </div>
      {description && <p className="t-small mt-1 text-text-secondary">{description}</p>}
    </div>
  )
}

// Hàng cài đặt: nhãn và giải thích bên trái, điều khiển bên phải; màn hẹp tự xuống dòng.
export function SettingRow({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
      <div className="min-w-0 flex-1 basis-56">
        <p className="t-small font-semibold">{title}</p>
        {description && <p className="t-caption mt-0.5 text-text-secondary">{description}</p>}
      </div>
      <div className="max-w-full shrink-0">{children}</div>
    </div>
  )
}

export function EmptyState({ icon, text, action }: { icon: ReactNode; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      {/* Hình minh hoạ gọn: biểu tượng trong các vòng tròn đồng tâm. */}
      <span className="relative inline-flex size-24 items-center justify-center rounded-full bg-accent-soft/40" aria-hidden="true">
        <span className="absolute inset-3 rounded-full bg-accent-soft/70" />
        <span className="relative inline-flex size-12 items-center justify-center rounded-full bg-bg-surface text-accent shadow-card [&>svg]:size-6">{icon}</span>
        <span className="absolute right-1 top-3 size-2 rounded-full bg-accent/40" />
        <span className="absolute bottom-3 left-1 size-1.5 rounded-full bg-accent/30" />
      </span>
      <p className="t-body max-w-[42ch] text-text-secondary">{text}</p>
      {action}
    </div>
  )
}

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export function Chip({ selected, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        't-button press inline-flex h-10 items-center gap-2 rounded-full border px-4',
        // Chip đang chọn dùng nền nhạt để không cạnh tranh với nút chính trên cùng màn.
        selected ? 'border-accent bg-accent-soft text-accent-strong' : 'border-border-default hover:border-accent hover:bg-accent-soft/60 hover:text-accent-strong',
        className,
      )}
      {...props}
    />
  )
}

export type TagTone = 'success' | 'warning' | 'danger' | 'accent' | 'neutral'

const TAG_TONES: Record<TagTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  accent: 'bg-accent-soft text-accent-strong',
  neutral: 'bg-bg-muted text-text-secondary',
}

export function Tag({ tone = 'neutral', children }: { tone?: TagTone; children: ReactNode }) {
  return (
    <span className={cn('t-caption inline-flex h-6 shrink-0 items-center gap-1 rounded-tag px-2', TAG_TONES[tone])}>
      {children}
    </span>
  )
}

interface ToggleProps {
  label: string
  // Phần tên chỉ dành cho trình đọc màn hình khi nhãn hiển thị chưa đủ rõ.
  srSuffix?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  // Ẩn nhãn khi hàng chứa công tắc đã có tiêu đề hiển thị; trình đọc màn hình vẫn đọc được.
  hideLabel?: boolean
}

export function Toggle({ label, srSuffix, checked, onChange, disabled, hideLabel }: ToggleProps) {
  const id = useId()
  return (
    <span className={cn('inline-flex min-h-11 items-center gap-2', disabled && 'opacity-40')}>
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="relative h-[26px] w-11 shrink-0 cursor-pointer rounded-full bg-border-default transition-colors duration-150 ease-out hover:bg-text-secondary/50 data-[state=checked]:bg-accent data-[state=checked]:hover:bg-accent-strong"
      >
        <RadixSwitch.Thumb className="block size-[22px] translate-x-0.5 rounded-full bg-[#fff] shadow-sm transition-transform duration-200 ease-out data-[state=checked]:translate-x-[20px]" />
      </RadixSwitch.Root>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 't-small cursor-pointer'}>
        {label}
        {srSuffix && <span className="sr-only">: {srSuffix}</span>}
      </label>
    </span>
  )
}

export function Checkbox({ label, checked, onChange, hideLabel }: ToggleProps) {
  return (
    <label className={cn('group/check relative inline-flex min-h-11 cursor-pointer items-center gap-2', hideLabel && 'min-w-11 justify-center')}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={hideLabel ? label : undefined}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-150 ease-out peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
          checked ? 'border-accent bg-accent text-on-primary' : 'border-text-secondary bg-bg-surface group-hover/check:border-accent group-hover/check:bg-accent-soft',
        )}
      >
        {checked && <Check size={16} strokeWidth={3} className="check-pop" />}
      </span>
      {!hideLabel && <span className="t-small">{label}</span>}
    </label>
  )
}

interface SegmentedProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; icon?: ReactNode }>
  // Cao bằng nút nhỏ (40 px) khi đứng cùng hàng với nút.
  compact?: boolean
}

export function Segmented({ label, value, onChange, options, compact }: SegmentedProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onChange}>
      <RadixTabs.List aria-label={label} className="inline-flex max-w-full gap-1 rounded-ctl bg-bg-muted p-1">
        {options.map((option) => (
          <RadixTabs.Trigger
            key={option.value}
            value={option.value}
            className={cn(
              't-button inline-flex items-center gap-1.5 whitespace-nowrap rounded-[8px] px-2.5 text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary data-[state=active]:bg-bg-surface data-[state=active]:text-text-primary data-[state=active]:shadow-card',
              compact ? 'h-8' : 'h-9',
            )}
          >
            {option.icon}
            {option.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  )
}
