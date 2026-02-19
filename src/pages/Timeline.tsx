import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Calendar, Star, Sparkles, Heart, Milestone } from 'lucide-react'
import { cn } from '../utils'
import { motion, AnimatePresence } from 'framer-motion'

interface TimelineNode {
  entityId: number
  title: string
  date: string
  summary: string
  importance: number
  emotion?: string
  relatedPeople?: string[]
}

interface LifeChapter {
  title: string
  startDate: string
  endDate: string
  keywords: string[]
  nodes: TimelineNode[]
  summary: string
}

// 动画配置
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
} as const

const chapterHeaderVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 20
    }
  }
} as const

// 骨架屏组件
const TimelineSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-12 pb-20">
    <header className="text-center space-y-4 mb-16">
      <div className="h-10 w-48 mx-auto rounded-lg bg-muted animate-pulse" />
      <div className="h-5 w-64 mx-auto rounded bg-muted animate-pulse" />
    </header>

    {[1, 2, 3].map((chapter) => (
      <div key={chapter} className="relative space-y-8">
        <div className="flex justify-center mb-8">
          <div className="h-10 w-40 rounded-full bg-muted animate-pulse" />
        </div>
        {[1, 2].map((node) => (
          <div key={node} className="flex justify-center">
            <div className="w-full md:w-[calc(50%-2rem)] p-5 rounded-xl bg-muted/50 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-3" />
              <div className="h-5 w-3/4 bg-muted rounded mb-4" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-5/6 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
)

// 空状态组件
const EmptyState = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4"
  >
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      className="relative"
    >
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
        <Milestone className="w-12 h-12 text-primary" />
      </div>
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20"
      />
    </motion.div>
    
    <div className="space-y-3">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        暂无人生时间线
      </h2>
      <p className="text-muted-foreground max-w-sm leading-relaxed">
        随着你记录更多日记，AI 将自动为你梳理出人生重要节点，编织属于你的故事。
      </p>
    </div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <Sparkles className="w-4 h-4 text-primary" />
      <span>记录至少 5 篇日记后开始生成</span>
    </motion.div>
  </motion.div>
)

export const Timeline = () => {
  const [chapters, setChapters] = useState<LifeChapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await api.get('/lifegraph/timeline')
        if (res.data.code === 200) {
          setChapters(res.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch timeline', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTimeline()
  }, [])

  if (loading) {
    return <TimelineSkeleton />
  }

  if (!chapters.length) {
    return <EmptyState />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 px-4">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4 mb-16"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
            人生时光轴
          </h1>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-lg"
        >
          你的每一个重要瞬间，都值得被铭记
        </motion.p>
      </motion.header>

      {/* Timeline */}
      <div className="relative">
        {/* 中心线 */}
        <div className="absolute inset-0 ml-5 md:ml-[50%] md:-translate-x-px">
          <div className="h-full w-0.5 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        </div>

        <AnimatePresence>
          {chapters.map((chapter, chapterIdx) => (
            <motion.div
              key={chapterIdx}
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="relative space-y-24 mb-24"
            >
              {/* Chapter Header */}
              <motion.div 
                variants={chapterHeaderVariants}
                className="sticky top-20 z-10 flex justify-center"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                  <div className="relative bg-background/90 backdrop-blur-xl border border-primary/20 px-6 py-3 rounded-full shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-3">
                      <Sparkles className="w-4 h-4" />
                      {chapter.title}
                      <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                        {chapter.keywords.join(' · ')}
                      </span>
                    </h2>
                  </div>
                </div>
              </motion.div>

              {/* Timeline Nodes */}
              <div className="space-y-12">
                {chapter.nodes.map((node, nodeIdx) => (
                  <motion.div
                    key={node.entityId}
                    variants={itemVariants}
                    custom={nodeIdx}
                    className={cn(
                      "relative flex items-center justify-between md:justify-normal group",
                      nodeIdx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    )}
                  >
                    {/* Node Dot */}
                    <div className={cn(
                      "absolute left-5 md:left-1/2 z-10 -translate-x-1/2",
                      "before:absolute before:inset-0 before:rounded-full",
                      node.importance > 0.8
                        ? "before:bg-primary before:animate-ping before:opacity-20"
                        : ""
                    )}>
                      <div className={cn(
                        "relative rounded-full border-2 transition-all duration-300",
                        node.importance > 0.8
                          ? "w-5 h-5 bg-primary border-background shadow-[0_0_0_4px_rgba(var(--primary),0.2)] group-hover:shadow-[0_0_0_6px_rgba(var(--primary),0.3)]"
                          : "w-3 h-3 bg-background border-primary/50 group-hover:border-primary group-hover:scale-125"
                      )} />
                    </div>

                    {/* Node Card */}
                    <div className={cn(
                      "flex w-full md:w-[calc(50%-2rem)] pl-12 md:pl-0",
                      nodeIdx % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8"
                    )}>
                      <motion.div
                        whileHover={{ y: -4, scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="w-full"
                      >
                        <Card className={cn(
                          "w-full p-5 transition-all duration-300 overflow-hidden",
                          "border border-border/50 hover:border-primary/30",
                          "hover:shadow-xl hover:shadow-primary/5",
                          node.importance > 0.8 && "bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20"
                        )}>
                          {/* Importance Glow */}
                          {node.importance > 0.8 && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                          )}

                          <div className={cn(
                            "relative flex flex-col gap-2 mb-3",
                            nodeIdx % 2 === 0 ? "md:items-end" : "md:items-start"
                          )}>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{node.date}</span>
                              {node.importance > 0.8 && (
                                <motion.div
                                  animate={{ rotate: [0, 15, -15, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                >
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                </motion.div>
                              )}
                            </div>
                            <h3 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                              {node.title}
                            </h3>
                          </div>

                          <p className="relative text-sm text-muted-foreground leading-relaxed mb-4">
                            {node.summary || "暂无摘要"}
                          </p>

                          <div className={cn(
                            "relative flex flex-wrap gap-2",
                            nodeIdx % 2 === 0 ? "md:justify-end" : "md:justify-start"
                          )}>
                            {node.relatedPeople?.map(person => (
                              <Badge 
                                key={person} 
                                variant="secondary" 
                                className="text-xs hover:bg-primary/10 transition-colors"
                              >
                                <Heart className="w-3 h-3 mr-1 text-rose-400" />
                                {person}
                              </Badge>
                            ))}
                            {node.emotion && (
                              <Badge 
                                variant="outline" 
                                className="text-xs border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                              >
                                #{node.emotion}
                              </Badge>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
