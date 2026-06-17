import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        {
          'bg-success/10 text-success': variant === 'success',
          'bg-warning/10 text-warning': variant === 'warning',
          'bg-danger/10 text-danger': variant === 'danger',
          'border border-textPrimary/20 text-textPrimary': variant === 'info',
          'bg-bgElevated text-textSecondary border border-borderSubtle': variant === 'default',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
