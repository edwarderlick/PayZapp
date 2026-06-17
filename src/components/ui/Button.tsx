import { forwardRef } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { motion, HTMLMotionProps } from 'framer-motion'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'variant' | 'size'> {
  variant?: 'primary' | 'neon' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <motion.button
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-2xl font-display font-bold tracking-wide transition-all duration-250 cursor-pointer disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden select-none',
          {
            /* primary */
            'bg-gradient-to-b from-[#00D4AA] to-[#4834d4] text-white shadow-[0_0_24px_rgba(108,92,231,0.4)] hover:shadow-[0_0_40px_rgba(108,92,231,0.6)] hover:from-[#7d70f0] hover:to-[#5847d2]':
              variant === 'primary',
            /* neon */
            'bg-transparent border border-[#00D4AA]/45 text-[#00D4AA] hover:bg-[#00D4AA]/10 hover:border-[#00D4AA]/50 hover:shadow-[0_0_24px_rgba(108,92,231,0.25)]':
              variant === 'neon',
            /* ghost */
            'bg-transparent text-[rgba(255,255,255,0.4)] hover:text-[#c8c4d7] hover:bg-white/[0.05]':
              variant === 'ghost',
            /* danger */
            'bg-gradient-to-b from-red-500 to-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]':
              variant === 'danger',
            /* sizes */
            'px-4 py-2 text-xs rounded-xl': size === 'sm',
            'px-6 py-3 text-sm':            size === 'md',
            'px-8 py-4 text-base':          size === 'lg',
          },
          className
        )}
        {...props}
      >
        {/* Shimmer overlay on hover */}
        {variant === 'primary' && !disabled && (
          <span
            className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
            style={{
              background:
                'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
            }}
          />
        )}
        {props.children as React.ReactNode}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'
