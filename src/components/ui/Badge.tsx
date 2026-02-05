import { cn } from '../../utils'
import { forwardRef } from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  dotColor?: string
  pulse?: boolean
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, dotColor, pulse, children, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center gap-1.5 font-medium whitespace-nowrap',
      'transition-colors duration-fast'
    )

    const variants = {
      default: 'bg-surface text-text-secondary border border-border',
      primary: 'bg-primary-500/10 text-primary-400 border border-primary-500/20',
      secondary: 'bg-surface-hover text-text-primary border border-border-hover',
      success: 'bg-success/10 text-success border border-success/20',
      warning: 'bg-warning/10 text-warning border border-warning/20',
      error: 'bg-error/10 text-error border border-error/20',
      info: 'bg-info/10 text-info border border-info/20',
      ghost: 'bg-transparent text-text-muted',
      outline: 'bg-transparent text-text-secondary border border-border hover:border-border-hover',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs rounded-full',
      md: 'px-2.5 py-1 text-xs rounded-full',
      lg: 'px-3 py-1.5 text-sm rounded-full',
    }

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              pulse && 'animate-pulse',
              dotColor || {
                'bg-text-secondary': variant === 'default',
                'bg-primary-400': variant === 'primary',
                'bg-success': variant === 'success',
                'bg-warning': variant === 'warning',
                'bg-error': variant === 'error',
                'bg-info': variant === 'info',
              }
            )}
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge
