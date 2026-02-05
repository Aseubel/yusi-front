import { cn } from '../../utils'
import { forwardRef } from 'react'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'glass'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: boolean
  success?: boolean
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    inputSize = 'md', 
    variant = 'default',
    leftIcon,
    rightIcon,
    error,
    success,
    fullWidth,
    disabled,
    ...rest 
  }, ref) => {
    const baseStyles = cn(
      'flex items-center gap-2',
      'bg-surface border border-border rounded-input',
      'text-text-primary placeholder:text-text-muted',
      'transition-all duration-fast',
      'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10',
      'hover:border-border-hover',
      disabled && 'opacity-50 cursor-not-allowed',
      error && 'border-error focus-within:border-error focus-within:ring-error/10',
      success && 'border-success focus-within:border-success focus-within:ring-success/10',
      fullWidth && 'w-full'
    )

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-5 text-base',
    }
    
    const size = inputSize

    const variants = {
      default: '',
      ghost: 'bg-transparent border-transparent hover:bg-white/5 focus-within:bg-white/5',
      glass: 'bg-surface-glass backdrop-blur-xl border-white/10',
    }

    return (
      <div className={cn(baseStyles, sizes[size], variants[variant], className)}>
        {leftIcon && (
          <span className="text-text-muted flex-shrink-0">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'flex-1 bg-transparent border-0 outline-none',
            'disabled:cursor-not-allowed',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium'
          )}
          disabled={disabled}
          {...rest}
        />
        {rightIcon && (
          <span className="text-text-muted flex-shrink-0">
            {rightIcon}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
