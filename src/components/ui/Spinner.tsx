import { clsx } from 'clsx'

export function Spinner({ className, size = 'md' }: { className?: string, size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-t-transparent border-textPrimary',
        {
          'w-4 h-4 border-2': size === 'sm',
          'w-6 h-6 border-2': size === 'md',
          'w-10 h-10 border-4': size === 'lg',
        },
        className
      )}
    />
  )
}
