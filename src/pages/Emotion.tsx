import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { 
  Smile, Frown, Meh, TrendingUp, TrendingDown, Minus, 
  Calendar, Sparkles, Target, BarChart3
} from 'lucide-react'
import { cn } from '../utils'
import { motion } from 'framer-motion'

interface EmotionPoint {
  date: string
  primaryEmotion: string
  intensity: number
  secondaryEmotions: string[]
  diaryId: string
  context: string | null
}

interface EmotionTrigger {
  triggerEntity: string
  triggerType: string
  occurrenceCount: number
  avgIntensityChange: number
  relatedEmotions: string[]
}

interface EmotionSummary {
  dominantEmotion: string
  avgIntensity: number
  totalEmotionEvents: number
  emotionTrend: string
  frequentEmotions: string[]
}

interface EmotionTimeline {
  emotionPoints: EmotionPoint[]
  triggers: EmotionTrigger[]
  summary: EmotionSummary
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
} as const

const emotionConfig: Record<string, { icon: typeof Smile; color: string; bgColor: string }> = {
  joy: { icon: Smile, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  excitement: { icon: Sparkles, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  happiness: { icon: Smile, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  contentment: { icon: Meh, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
  calm: { icon: Meh, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  neutral: { icon: Meh, color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
  anxiety: { icon: Frown, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  sadness: { icon: Frown, color: 'text-blue-600', bgColor: 'bg-blue-600/10' },
  anger: { icon: Frown, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  fear: { icon: Frown, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  frustration: { icon: Frown, color: 'text-amber-600', bgColor: 'bg-amber-600/10' },
  disappointment: { icon: Frown, color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
  loneliness: { icon: Frown, color: 'text-cyan-600', bgColor: 'bg-cyan-600/10' },
  stress: { icon: Frown, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
  tired: { icon: Meh, color: 'text-gray-500', bgColor: 'bg-gray-500/10' }
}

const trendConfig = {
  improving: { icon: TrendingUp, color: 'text-green-500', label: '好转' },
  declining: { icon: TrendingDown, color: 'text-red-500', label: '下滑' },
  stable: { icon: Minus, color: 'text-gray-400', label: '稳定' }
}

const Skeleton = () => (
  <div className="max-w-5xl mx-auto space-y-8 pb-20">
    <header className="text-center space-y-4 mb-12">
      <div className="h-10 w-48 mx-auto rounded-lg bg-muted animate-pulse" />
      <div className="h-5 w-64 mx-auto rounded bg-muted animate-pulse" />
    </header>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
      ))}
    </div>
    <div className="h-64 rounded-xl bg-muted/50 animate-pulse" />
  </div>
)

const EmptyState = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6"
  >
    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
      <Smile className="w-12 h-12 text-primary" />
    </div>
    <div className="space-y-3">
      <h2 className="text-2xl font-bold">记录你的故事</h2>
      <p className="text-muted-foreground max-w-sm">
        在日记中记录重要的选择和时刻，AI 将为你呈现属于你的记忆图谱。
      </p>
    </div>
  </motion.div>
)

export const Emotion = () => {
  const [data, setData] = useState<EmotionTimeline | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmotions = async () => {
      try {
        const res = await api.get('/lifegraph/emotions')
        if (res.data.success) {
          setData(res.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch emotions', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEmotions()
  }, [])

  if (loading) return <Skeleton />
  if (!data || !data.emotionPoints.length) return <EmptyState />

  const summary = data.summary
  const trendInfo = trendConfig[summary.emotionTrend as keyof typeof trendConfig] || trendConfig.stable
  const TrendIcon = trendInfo.icon
  const dominantConfig = emotionConfig[summary.dominantEmotion] || emotionConfig.neutral
  const DominantIcon = dominantConfig.icon

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
          记忆图谱
        </h1>
        <p className="text-muted-foreground text-lg">
          你的每一个选择，都在书写独一无二的人生故事
        </p>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5 text-center">
            <div className={cn(
              "w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center",
              dominantConfig.bgColor
            )}>
              <DominantIcon className={cn("w-7 h-7", dominantConfig.color)} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">主导情绪</p>
            <p className="text-xl font-bold capitalize">{summary.dominantEmotion}</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5 text-center">
            <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center bg-primary/10">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">情绪事件</p>
            <p className="text-xl font-bold">{summary.totalEmotionEvents} 次</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5 text-center">
            <div className={cn(
              "w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center",
              trendInfo.color.includes('green') ? 'bg-green-500/10' : 
              trendInfo.color.includes('red') ? 'bg-red-500/10' : 'bg-gray-500/10'
            )}>
              <TrendIcon className={cn("w-7 h-7", trendInfo.color)} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">情绪趋势</p>
            <p className="text-xl font-bold">{trendInfo.label}</p>
          </Card>
        </motion.div>
      </div>

      {data.triggers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">记忆触发点</h2>
            </div>
            <div className="space-y-3">
              {data.triggers.slice(0, 5).map((trigger, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {trigger.triggerType}
                    </Badge>
                    <span className="font-medium">{trigger.triggerEntity}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {trigger.relatedEmotions.slice(0, 3).map((e, i) => (
                        <Badge key={i} variant="secondary" className="text-xs capitalize">
                          {e}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {trigger.occurrenceCount} 次
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">记忆时间线</h2>
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4 max-h-96 overflow-y-auto pl-8"
            >
              {data.emotionPoints.map((point, idx) => {
                const config = emotionConfig[point.primaryEmotion] || emotionConfig.neutral
                const Icon = config.icon
                
                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="relative"
                  >
                    <div className={cn(
                      "absolute -left-5 top-3 w-3 h-3 rounded-full border-2 border-background",
                      config.bgColor
                    )} />
                    
                    <div className="p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("w-4 h-4", config.color)} />
                          <span className="font-medium capitalize">{point.primaryEmotion}</span>
                          {point.secondaryEmotions.length > 0 && (
                            <div className="flex gap-1">
                              {point.secondaryEmotions.slice(0, 2).map((e, i) => (
                                <Badge key={i} variant="outline" className="text-xs capitalize">
                                  {e}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{point.date}</span>
                      </div>
                      {point.context && (
                        <p className="text-sm text-muted-foreground truncate">
                          {point.context}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">常见情绪</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.frequentEmotions.map((emotion, idx) => {
              const config = emotionConfig[emotion] || emotionConfig.neutral
              return (
                <Badge 
                  key={idx}
                  variant="secondary"
                  className={cn("px-4 py-2 text-sm", config.bgColor)}
                >
                  <span className={cn("capitalize", config.color)}>{emotion}</span>
                </Badge>
              )
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
