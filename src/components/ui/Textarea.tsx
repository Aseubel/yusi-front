import { cn } from '../../utils'
import { forwardRef, useState, useEffect } from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'ghost' | 'glass'
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  autoResize?: boolean
  minRows?: number
  maxRows?: number
  maxLength?: number
  showCount?: boolean
  error?: boolean
  success?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant = 'default',
    resize = 'vertical',
    autoResize = false,
    minRows = 3,
    maxRows = 10,
    maxLength,
    showCount,
    error,
    success,
    value,
    onChange,
    disabled,
    ...rest 
  }, ref) => {
    const [rows, setRows] = useState(minRows)
    const [charCount, setCharCount] = useState(0)

    useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        const textarea = e.target
        const lineHeight = 24 // Approximate line height
        const padding = 32 // Top + bottom padding
        const scrollHeight = textarea.scrollHeight - padding
        const newRows = Math.max(minRows, Math.min(maxRows, Math.ceil(scrollHeight / lineHeight)))
        setRows(newRows)
      }

      setCharCount(e.target.value.length)
      onChange?.(e)
    }

    const baseStyles = cn(
      'w-full bg-surface border border-border rounded-input',
      'px-4 py-3 text-text-primary placeholder:text-text-muted',
      'transition-all duration-fast',
      'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none',
      'hover:border-border-hover',
      disabled && 'opacity-50 cursor-not-allowed',
      error && 'border-error focus:border-error focus:ring-error/10',
      success && 'border-success focus:border-success focus:ring-success/10'
    )

    const variants = {
      default: '',
      ghost: 'bg-transparent border-transparent hover:bg-white/5 focus:bg-white/5',
      glass: 'bg-surface-glass backdrop-blur-xl border-white/10',
    }

    const resizes = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          rows={autoResize ? rows : minRows}
          maxLength={maxLength}
          className={cn(baseStyles, variants[variant], resizes[resize], className)}
          onChange={handleChange}
          disabled={disabled}
          value={value}
          {...rest}
        />
        {showCount && (
          <div className="flex justify-end mt-1.5 text-xs text-text-muted">
            <span className={cn(
              maxLength && charCount > maxLength * 0.9 && 'text-warning',
              maxLength && charCount >= maxLength && 'text-error'
            )}>
              {charCount}
              {maxLength && ` / ${maxLength}`}
            </span>
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
