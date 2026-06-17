import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="card"
        className={clsx(
          'glass-card p-6 md:p-8 transition-all duration-300 hover:surface-hover',
          'halo-border',
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'
