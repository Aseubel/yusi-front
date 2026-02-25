import { cn } from '../../utils'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...rest }, ref) => {
    const base = 'relative inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer overflow-hidden'

    const variants = {
      primary: 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-0.5 border-0',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-0.5 border-0',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25 border-0',
      ghost: 'hover:bg-primary/10 hover:text-primary border-0',
      outline: 'border border-input bg-background hover:bg-primary/10 hover:text-primary',
      glass: 'bg-background/60 backdrop-blur-md border border-border/50 hover:bg-background/80 hover:border-border text-foreground shadow-sm',
    }

    const sizes = {
      sm: 'h-8 px-4 text-xs',
      md: 'h-10 px-6 py-2 text-sm',
      lg: 'h-12 px-8 text-base',
      icon: 'h-10 w-10 p-2',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={isLoading || rest.disabled}
        {...rest}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
        {variant === 'primary' && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'
