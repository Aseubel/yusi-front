import { motion, type MotionProps } from 'framer-motion'
import { cn } from '../../utils'
import { type LucideIcon, BookOpen, Search, Database, AlertCircle } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  iconClassName?: string
  animate?: boolean
}

const containerVariants: MotionProps['variants'] = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants: MotionProps['variants'] = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconClassName,
  animate = true
}: EmptyStateProps) => {
  const Wrapper = animate ? motion.div : 'div'
  const wrapperProps = animate
    ? {
        variants: containerVariants,
        initial: 'hidden',
        animate: 'visible'
      }
    : {}

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 space-y-6',
        className
      )}
    >
      {/* Icon */}
      <motion.div
        variants={itemVariants}
        className="relative"
      >
        <div className={cn(
          'w-20 h-20 rounded-2xl flex items-center justify-center',
          'bg-gradient-to-br from-primary/10 to-purple-500/10',
          'border border-primary/10',
          iconClassName
        )}>
          <Icon className="w-10 h-10 text-primary/80" />
        </div>
        {/* Decorative elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary/20"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5
          }}
          className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-purple-500/20"
        />
      </motion.div>

      {/* Text */}
      <div className="space-y-2 max-w-sm">
        <motion.h3
          variants={itemVariants}
          className="text-xl font-semibold text-foreground"
        >
          {title}
        </motion.h3>
        {description && (
          <motion.p
            variants={itemVariants}
            className="text-muted-foreground leading-relaxed"
          >
            {description}
          </motion.p>
        )}
      </div>

      {/* Action */}
      {action && (
        <motion.div variants={itemVariants}>
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        </motion.div>
      )}
    </Wrapper>
  )
}

// 预设空状态组件
interface PresetEmptyStateProps {
  className?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyDiaries = ({ className, action }: PresetEmptyStateProps) => (
  <EmptyState
    icon={BookOpen}
    title="还没有日记"
    description="开始记录你的第一篇日记，让每一天都值得回忆"
    action={action}
    className={className}
  />
)

export const EmptySearch = ({ className }: PresetEmptyStateProps) => (
  <EmptyState
    icon={Search}
    title="没有找到结果"
    description="试试其他关键词，或者调整筛选条件"
    className={className}
  />
)

export const EmptyData = ({ className }: PresetEmptyStateProps) => (
  <EmptyState
    icon={Database}
    title="暂无数据"
    description="这里还没有任何内容"
    className={className}
  />
)

export const EmptyError = ({ 
  className, 
  action 
}: PresetEmptyStateProps) => (
  <EmptyState
    icon={AlertCircle}
    title="加载失败"
    description="数据加载出现问题，请稍后重试"
    action={action || { label: '重新加载', onClick: () => window.location.reload() }}
    className={className}
  />
)
