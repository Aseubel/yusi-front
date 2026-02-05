import { cn } from '../../utils'
import { forwardRef } from 'react'

// ============================================
// Card Root Component
// ============================================
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'outlined'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = true, padding = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-surface border border-border',
      glass: 'bg-surface-glass backdrop-blur-xl border border-white/10',
      elevated: 'bg-surface border border-border shadow-card',
      outlined: 'bg-transparent border border-border',
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-card transition-all duration-normal',
          variants[variant],
          hover && 'hover:border-border-hover hover:shadow-card-hover',
          paddings[padding],
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

// ============================================
// Card Header
// ============================================
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  divider?: boolean
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, divider = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-1.5',
        divider && 'pb-4 mb-4 border-b border-border',
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

// ============================================
// Card Title
// ============================================
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        'font-serif text-xl font-semibold text-text-primary leading-tight',
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

// ============================================
// Card Description
// ============================================
export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-sm text-text-secondary leading-relaxed',
        className
      )}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

// ============================================
// Card Content
// ============================================
export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

// ============================================
// Card Footer
// ============================================
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divider?: boolean
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, divider = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3',
        divider && 'pt-4 mt-4 border-t border-border',
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

// ============================================
// Card Image
// ============================================
export interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: 'video' | 'square' | 'auto'
  overlay?: boolean
}

export const CardImage = forwardRef<HTMLImageElement, CardImageProps>(
  ({ className, aspectRatio = 'auto', overlay, ...props }, ref) => {
    const aspectRatios = {
      video: 'aspect-video',
      square: 'aspect-square',
      auto: '',
    }

    return (
      <div className={cn('relative overflow-hidden rounded-t-card', aspectRatios[aspectRatio])}>
        <img
          ref={ref}
          className={cn('w-full h-full object-cover', className)}
          {...props}
        />
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        )}
      </div>
    )
  }
)
CardImage.displayName = 'CardImage'

// ============================================
// Card Actions
// ============================================
export const CardActions = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 ml-auto', className)}
      {...props}
    />
  )
)
CardActions.displayName = 'CardActions'

export { Card as default }
