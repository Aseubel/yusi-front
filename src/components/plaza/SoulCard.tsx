import { cn } from '../../utils'
import { motion } from 'framer-motion'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Sparkles,
  Clock,
  MapPin
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export type EmotionType = 'joy' | 'sadness' | 'anxiety' | 'love' | 'anger' | 'fear' | 'hope' | 'calm' | 'confusion' | 'neutral'

export interface SoulCardProps {
  id: string
  content: string
  emotion: EmotionType
  authorName?: string
  authorAvatar?: string
  timestamp: string
  location?: string
  likes: number
  comments: number
  isLiked?: boolean
  isEncrypted?: boolean
  tags?: string[]
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
  onClick?: () => void
  className?: string
}

const emotionConfig: Record<EmotionType, { 
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
}> = {
  joy: { 
    label: '喜悦', 
    color: 'text-emotion-joy', 
    bgColor: 'bg-emotion-joy/10',
    borderColor: 'border-emotion-joy/20',
    icon: <Sparkles className="w-3.5 h-3.5" />
  },
  sadness: { 
    label: '悲伤', 
    color: 'text-emotion-sadness', 
    bgColor: 'bg-emotion-sadness/10',
    borderColor: 'border-emotion-sadness/20',
    icon: <span className="text-sm">💧</span>
  },
  anxiety: { 
    label: '焦虑', 
    color: 'text-emotion-anxiety', 
    bgColor: 'bg-emotion-anxiety/10',
    borderColor: 'border-emotion-anxiety/20',
    icon: <span className="text-sm">⚡</span>
  },
  love: { 
    label: '温暖', 
    color: 'text-emotion-love', 
    bgColor: 'bg-emotion-love/10',
    borderColor: 'border-emotion-love/20',
    icon: <Heart className="w-3.5 h-3.5" />
  },
  anger: { 
    label: '愤怒', 
    color: 'text-emotion-anger', 
    bgColor: 'bg-emotion-anger/10',
    borderColor: 'border-emotion-anger/20',
    icon: <span className="text-sm">🔥</span>
  },
  fear: { 
    label: '恐惧', 
    color: 'text-emotion-fear', 
    bgColor: 'bg-emotion-fear/10',
    borderColor: 'border-emotion-fear/20',
    icon: <span className="text-sm">🌑</span>
  },
  hope: { 
    label: '希望', 
    color: 'text-emotion-hope', 
    bgColor: 'bg-emotion-hope/10',
    borderColor: 'border-emotion-hope/20',
    icon: <span className="text-sm">🌱</span>
  },
  calm: { 
    label: '平静', 
    color: 'text-emotion-calm', 
    bgColor: 'bg-emotion-calm/10',
    borderColor: 'border-emotion-calm/20',
    icon: <span className="text-sm">🍃</span>
  },
  confusion: { 
    label: '困惑', 
    color: 'text-emotion-confusion', 
    bgColor: 'bg-emotion-confusion/10',
    borderColor: 'border-emotion-confusion/20',
    icon: <span className="text-sm">❓</span>
  },
  neutral: { 
    label: '随想', 
    color: 'text-emotion-neutral', 
    bgColor: 'bg-emotion-neutral/10',
    borderColor: 'border-emotion-neutral/20',
    icon: <span className="text-sm">💭</span>
  },
}

export function SoulCard({
  id,
  content,
  emotion,
  timestamp,
  location,
  likes,
  comments,
  isLiked = false,
  isEncrypted = false,
  tags = [],
  onLike,
  onComment,
  onShare,
  onClick,
  className,
}: SoulCardProps) {
  const emotionData = emotionConfig[emotion]

  return (
    <motion.article
      layoutId={`soul-card-${id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-card',
        'bg-surface border border-border',
        'transition-all duration-normal',
        'hover:border-border-hover hover:shadow-card-hover',
        'cursor-pointer',
        className
      )}
    >
      {/* Emotion Accent Bar */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
        emotionData.bgColor.replace('/10', '')
      )} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Emotion Badge */}
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full',
              'text-xs font-medium',
              emotionData.bgColor,
              emotionData.color,
              emotionData.borderColor,
              'border'
            )}>
              {emotionData.icon}
              {emotionData.label}
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1 text-text-muted text-xs">
              <Clock className="w-3 h-3" />
              {timestamp}
            </div>
          </div>

          {/* Actions */}
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className={cn(
            'text-text-primary leading-relaxed line-clamp-4',
            'font-serif text-base'
          )}>
            {content}
          </p>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-text-muted hover:text-primary-400 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1.5 text-text-muted text-xs mb-4">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLike?.()
              }}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors',
                isLiked ? 'text-emotion-love' : 'text-text-muted hover:text-emotion-love'
              )}
            >
              <Heart className={cn(
                'w-4 h-4 transition-transform',
                isLiked && 'fill-current scale-110'
              )} />
              <span>{likes}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onComment?.()
              }}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{comments}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShare?.()
              }}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary-400 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Encrypted Badge */}
          {isEncrypted && (
            <Badge variant="ghost" size="sm" dot dotColor="bg-success">
              加密
            </Badge>
          )}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
        'bg-gradient-to-br from-transparent via-transparent to-emotion-love/5'
      )} />
    </motion.article>
  )
}

export default SoulCard
