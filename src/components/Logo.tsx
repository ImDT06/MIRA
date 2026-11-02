export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <rect width="48" height="48" rx="14.4" fill="#5E52B8" />
      <path
        d="M12 34V14l12 14 12-14v20"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.25 }} role="img" aria-label="MIRA">
      <LogoMark size={size} />
      <span className="font-semibold tracking-[-0.01em] text-text-primary" style={{ fontSize: size * 0.68, lineHeight: 1 }}>
        MIRA
      </span>
    </span>
  )
}
