import { cn } from '../../utils'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'glass'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    leftIcon,
    rightIcon,
    fullWidth,
    children, 
    disabled,
    ...rest 
  }, ref) => {
    const baseStyles = cn(
      'relative inline-flex items-center justify-center gap-2 font-medium',
      'transition-all duration-fast ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:pointer-events-none disabled:opacity-50',
      'active:scale-[0.98]',
      fullWidth && 'w-full'
    )

    const variants = {
      primary: cn(
        'bg-gradient-to-r from-primary-600 to-primary-500 text-white',
        'border-0 shadow-lg shadow-primary-500/25',
        'hover:shadow-glow hover:shadow-primary-500/40',
        'hover:from-primary-500 hover:to-primary-400',
        'hover:-translate-y-0.5'
      ),
      secondary: cn(
        'bg-surface text-text-primary',
        'border border-border hover:border-border-hover',
        'hover:bg-surface-hover',
        'hover:-translate-y-0.5'
      ),
      ghost: cn(
        'bg-transparent text-text-secondary',
        'border-0',
        'hover:bg-white/5 hover:text-text-primary'
      ),
      outline: cn(
        'bg-transparent text-text-primary',
        'border border-border hover:border-primary-500/50',
        'hover:bg-primary-500/5'
      ),
      danger: cn(
        'bg-error/10 text-error',
        'border border-error/20',
        'hover:bg-error/20 hover:border-error/30',
        'hover:-translate-y-0.5'
      ),
      glass: cn(
        'bg-surface-glass backdrop-blur-xl text-text-primary',
        'border border-white/10',
        'hover:bg-white/10 hover:border-white/20'
      ),
    }

    const sizes = {
      xs: 'h-7 px-3 text-xs rounded-md',
      sm: 'h-8 px-4 text-sm rounded-lg',
      md: 'h-10 px-5 text-sm rounded-button',
      lg: 'h-12 px-6 text-base rounded-button',
      xl: 'h-14 px-8 text-lg rounded-xl',
      icon: 'h-10 w-10 p-2 rounded-button',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || disabled}
        {...rest}
      >
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
        
        {/* Shimmer effect for primary variant */}
        {variant === 'primary' && !disabled && (
          <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
