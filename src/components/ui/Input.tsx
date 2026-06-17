import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          'w-full bg-black/25 border border-[rgba(146,142,160,0.2)] rounded-xl px-5 py-3.5 text-[var(--text-primary)] font-ui text-base outline-none transition-all duration-250',
          'placeholder:text-[rgba(146,142,160,0.5)]',
          'hover:border-[rgba(198,191,255,0.2)] hover:bg-black/35',
          'focus:border-[rgba(108,92,231,0.6)] focus:shadow-[0_0_0_1px_rgba(108,92,231,0.35),_0_0_20px_rgba(108,92,231,0.1)] focus:bg-black/40',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
