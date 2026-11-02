import * as Tooltip from '@radix-ui/react-tooltip'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, Ref } from 'react'
import { cn } from '../../lib/utils'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'text' | 'danger'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-[color-mix(in_srgb,var(--primary)_88%,var(--accent))] hover:shadow-hover active:bg-[color-mix(in_srgb,var(--primary)_92%,black)]',
  accent: 'bg-accent text-on-primary hover:bg-accent-strong hover:shadow-hover active:bg-accent-strong',
  secondary: 'bg-bg-surface text-text-primary border border-border-default hover:border-text-secondary hover:bg-bg-muted active:bg-bg-muted',
  text: 'text-accent hover:bg-accent-soft active:bg-accent-soft',
  danger: 'bg-bg-surface text-danger border border-danger hover:bg-danger-soft active:bg-danger-soft',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  small?: boolean
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({ variant = 'primary', small, loading, className, children, disabled, ref, ...props }: ButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        't-button press relative inline-flex items-center justify-center gap-2 rounded-ctl px-4',
        small ? 'h-10' : 'h-11',
        VARIANTS[variant],
        disabled && !loading && 'opacity-40 pointer-events-none',
        loading && 'pointer-events-none',
        className,
      )}
      {...props}
    >
      <span className={cn('inline-flex items-center justify-center gap-2', loading && 'invisible')}>{children}</span>
      {loading && <LoaderCircle size={20} className="absolute animate-spin" aria-label="Đang xử lý" />}
    </button>
  )
}

const ICON_TONES = {
  default: 'text-text-secondary hover:bg-bg-muted hover:text-text-primary',
  active: 'text-accent hover:bg-accent-soft',
  solid: 'bg-primary text-on-primary hover:bg-[color-mix(in_srgb,var(--primary)_88%,var(--accent))] hover:shadow-hover',
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  tone?: keyof typeof ICON_TONES
  ref?: Ref<HTMLButtonElement>
}

export function IconButton({ label, tone = 'default', className, children, ref, ...props }: IconButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          className={cn(
            'press inline-flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40 disabled:pointer-events-none',
            ICON_TONES[tone],
            className,
          )}
          {...props}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={4} collisionPadding={8} className="t-caption pointer-events-none z-[80] max-w-64 rounded-tag bg-primary px-2 py-1 text-on-primary shadow-float">
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
