import { cn } from '../../utils'
import { forwardRef } from 'react'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shape?: 'circle' | 'square' | 'rounded'
  status?: 'online' | 'offline' | 'away' | 'busy' | 'none'
  border?: boolean
  borderColor?: string
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className, 
    src, 
    alt = '', 
    name = '', 
    size = 'md', 
    shape = 'circle',
    status = 'none',
    border = false,
    borderColor,
    ...props 
  }, ref) => {
    // Generate initials from name
    const getInitials = (name: string) => {
      if (!name) return '?'
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    // Generate a consistent color based on name
    const getColorFromName = (name: string) => {
      if (!name) return 'bg-primary-500'
      const colors = [
        'bg-primary-500',
        'bg-emotion-joy',
        'bg-emotion-love',
        'bg-emotion-hope',
        'bg-emotion-calm',
        'bg-info',
      ]
      const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return colors[index % colors.length]
    }

    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
      '2xl': 'w-20 h-20 text-2xl',
    }

    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded-lg',
    }

    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-3.5 h-3.5',
      '2xl': 'w-4 h-4',
    }

    const statusColors = {
      online: 'bg-success',
      offline: 'bg-text-muted',
      away: 'bg-warning',
      busy: 'bg-error',
      none: '',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden',
          'font-medium text-white',
          sizes[size],
          shapes[shape],
          border && 'ring-2 ring-offset-2 ring-offset-background',
          border && (borderColor || 'ring-border'),
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center', getColorFromName(name))}>
            {getInitials(name)}
          </div>
        )}
        
        {status !== 'none' && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-background',
              statusSizes[size],
              statusColors[status]
            )}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export default Avatar
