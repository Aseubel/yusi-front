import { cn } from '../../utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
  style?: React.CSSProperties
}

export const Skeleton = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  style: propStyle
}: SkeletonProps) => {
  const baseStyles = 'bg-muted'

  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl'
  }

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_infinite]',
    none: ''
  }

  const style: React.CSSProperties = { ...propStyle }
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        animations[animation],
        variant === 'text' && 'h-4',
        className
      )}
      style={style}
    />
  )
}

// 预设骨架屏组件
export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={cn(i === lines - 1 && 'w-4/5')}
      />
    ))}
  </div>
)

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('p-4 rounded-xl bg-card border border-border/50 space-y-3', className)}>
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" className="w-10 h-10" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
)

export const SkeletonList = ({ count = 3, className }: { count?: number; className?: string }) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)

export const SkeletonAvatar = ({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  return <Skeleton variant="circular" className={cn(sizes[size], className)} />
}

export const SkeletonButton = ({ className }: { className?: string }) => (
  <Skeleton variant="rounded" className={cn('h-10 w-24', className)} />
)

export const SkeletonImage = ({ className, aspectRatio = '16/9' }: { className?: string; aspectRatio?: string }) => (
  <Skeleton
    variant="rounded"
    className={cn('w-full', className)}
    style={{ aspectRatio }}
  />
)
