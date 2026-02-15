import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Users, Briefcase, Home, Heart, Sparkles, Calendar, TrendingUp, ChevronRight } from 'lucide-react'
import { cn } from '../utils'
import { motion, AnimatePresence } from 'framer-motion'

interface EntitySummary {
  entityId: number
  displayName: string
  entityType: string
  mentionCount: number
  centralityScore: number
}

interface CommunityInsight {
  communityId: string
  communityName: string
  type: 'WORK' | 'FAMILY' | 'FRIENDS' | 'HOBBY' | 'OTHER'
  description: string
  entities: EntitySummary[]
  entityCount: number
  relationCount: number
  cohesion: number
  firstActiveDate: string | null
  lastActiveDate: string | null
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
  }
} as const

const typeConfig = {
  WORK: { icon: Briefcase, color: 'from-blue-500 to-cyan-500', label: '工作圈', bgColor: 'bg-blue-500/10' },
  FAMILY: { icon: Home, color: 'from-orange-500 to-amber-500', label: '家庭圈', bgColor: 'bg-orange-500/10' },
  FRIENDS: { icon: Heart, color: 'from-pink-500 to-rose-500', label: '朋友圈', bgColor: 'bg-pink-500/10' },
  HOBBY: { icon: Sparkles, color: 'from-purple-500 to-violet-500', label: '兴趣圈', bgColor: 'bg-purple-500/10' },
  OTHER: { icon: Users, color: 'from-gray-500 to-slate-500', label: '生活圈', bgColor: 'bg-gray-500/10' }
}

const Skeleton = () => (
  <div className="max-w-5xl mx-auto space-y-8 pb-20">
    <header className="text-center space-y-4 mb-12">
      <div className="h-10 w-48 mx-auto rounded-lg bg-muted animate-pulse" />
      <div className="h-5 w-64 mx-auto rounded bg-muted animate-pulse" />
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-64 rounded-xl bg-muted/50 animate-pulse" />
      ))}
    </div>
  </div>
)

const EmptyState = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6"
  >
    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
      <Users className="w-12 h-12 text-primary" />
    </div>
    <div className="space-y-3">
      <h2 className="text-2xl font-bold">发现你的关系网络</h2>
      <p className="text-muted-foreground max-w-sm">
        随着你记录更多故事，AI 将帮助你发现生命中那些重要的人和环境。
      </p>
    </div>
  </motion.div>
)

export const Community = () => {
  const [communities, setCommunities] = useState<CommunityInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await api.get('/lifegraph/communities')
        if (res.data.success) {
          setCommunities(res.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch communities', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCommunities()
  }, [])

  if (loading) return <Skeleton />
  if (!communities.length) return <EmptyState />

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
          关系图谱
        </h1>
        <p className="text-muted-foreground text-lg">
          发现你生命中那些重要的人和环境
        </p>
      </motion.header>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <AnimatePresence>
          {communities.map((community) => {
            const config = typeConfig[community.type]
            const Icon = config.icon
            const isExpanded = expandedId === community.communityId

            return (
              <motion.div
                key={community.communityId}
                variants={itemVariants}
                layout
                className={cn(
                  "group cursor-pointer",
                  isExpanded && "md:col-span-2"
                )}
              >
                <Card 
                  className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    "border border-border/50 hover:border-primary/30",
                    "hover:shadow-xl hover:shadow-primary/5",
                    isExpanded && "ring-2 ring-primary/20"
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : community.communityId)}
                >
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-5",
                    config.color
                  )} />

                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          config.bgColor
                        )}>
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{community.communityName}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform",
                        isExpanded && "rotate-90"
                      )} />
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {community.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {community.entityCount} 人/物
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        凝聚力 {Math.round(community.cohesion * 100)}%
                      </span>
                      {community.lastActiveDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          最近活跃
                        </span>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 pt-6 border-t border-border/50"
                        >
                          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                            核心成员
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {community.entities.map((entity) => (
                              <Badge 
                                key={entity.entityId}
                                variant="outline"
                                className="px-3 py-1.5"
                              >
                                {entity.displayName}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ×{entity.mentionCount}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
