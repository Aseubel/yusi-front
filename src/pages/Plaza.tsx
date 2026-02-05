import { cn } from '../utils'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Filter, 
  Sparkles, 
  TrendingUp, 
  Clock,
  Search,
  X
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { SoulCard } from '../components/plaza/SoulCard'
import type { EmotionType } from '../components/plaza/SoulCard'
import { getFeed, submitToPlaza, resonate } from '../lib/plaza'
import { toast } from 'sonner'

const emotions: { value: EmotionType; label: string; color: string }[] = [
  { value: 'joy', label: '喜悦', color: 'bg-emotion-joy' },
  { value: 'sadness', label: '悲伤', color: 'bg-emotion-sadness' },
  { value: 'anxiety', label: '焦虑', color: 'bg-emotion-anxiety' },
  { value: 'love', label: '温暖', color: 'bg-emotion-love' },
  { value: 'anger', label: '愤怒', color: 'bg-emotion-anger' },
  { value: 'fear', label: '恐惧', color: 'bg-emotion-fear' },
  { value: 'hope', label: '希望', color: 'bg-emotion-hope' },
  { value: 'calm', label: '平静', color: 'bg-emotion-calm' },
  { value: 'confusion', label: '困惑', color: 'bg-emotion-confusion' },
  { value: 'neutral', label: '随想', color: 'bg-emotion-neutral' },
]

const sortOptions = [
  { value: 'latest', label: '最新', icon: Clock },
  { value: 'popular', label: '热门', icon: TrendingUp },
]

interface PlazaItem {
  id: string
  content: string
  emotion: EmotionType
  authorName?: string
  createdAt: string
  location?: string
  likes: number
  comments: number
  isLiked?: boolean
  isEncrypted?: boolean
  tags?: string[]
}

export function Plaza() {
  const [items, setItems] = useState<PlazaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null)
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Load plaza items
  const loadItems = useCallback(async (reset = false) => {
    if (loading && !reset) return
    
    setLoading(true)
    try {
      const currentPage = reset ? 1 : page
      const response = await getFeed(
        currentPage,
        selectedEmotion || undefined
      )
      
      const newItems = (response?.content || []).map((item: any) => ({
        id: String(item.id),
        content: item.content,
        emotion: (item.emotion?.toLowerCase() || 'neutral') as EmotionType,
        authorName: item.userId,
        createdAt: item.createdAt,
        location: undefined,
        likes: item.resonanceCount || 0,
        comments: 0,
        isLiked: item.isResonated,
        isEncrypted: false,
        tags: [],
      }))
      
      if (reset) {
        setItems(newItems)
        setPage(2)
      } else {
        setItems(prev => [...prev, ...newItems])
        setPage(prev => prev + 1)
      }
      
      setHasMore(!response?.last)
    } catch (error) {
      toast.error('加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [page, selectedEmotion, loading])

  // Initial load
  useEffect(() => {
    loadItems(true)
  }, [selectedEmotion])

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadItems()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, loading, loadItems])

  // Handle like (resonate)
  const handleLike = async (id: string) => {
    try {
      await resonate(Number(id), 'EMPATHY')
      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      ))
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // Handle create post
  const handleCreatePost = async (content: string, _emotion: string) => {
    try {
      await submitToPlaza(content, '0', 'DIARY')
      toast.success('发布成功')
      setIsCreateDialogOpen(false)
      loadItems(true)
    } catch (error) {
      toast.error('发布失败')
    }
  }

  // Filter items by search
  const filteredItems = searchQuery
    ? items.filter(item => 
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 30) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold text-text-primary">灵魂广场</h1>
          <p className="text-text-secondary mt-1">匿名分享你的心声，发现与你共鸣的灵魂</p>
        </div>
        
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          分享心声
        </Button>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="搜索内容或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          {sortOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as 'latest' | 'popular')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  sortBy === option.value
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    : 'bg-surface text-text-secondary border border-border hover:border-border-hover'
                )}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            )
          })}

          {/* Filter Toggle */}
          <Button
            variant={isFilterOpen ? 'primary' : 'secondary'}
            size="icon"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Emotion Filter */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-4 bg-surface rounded-xl border border-border">
              <button
                onClick={() => setSelectedEmotion(null)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selectedEmotion === null
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                )}
              >
                全部
              </button>
              {emotions.map((emotion) => (
                <button
                  key={emotion.value}
                  onClick={() => setSelectedEmotion(emotion.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedEmotion === emotion.value
                      ? 'bg-surface-hover text-text-primary ring-2 ring-primary-500/30'
                      : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', emotion.color)} />
                  {emotion.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Emotion Badge */}
      {selectedEmotion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          <span className="text-sm text-text-muted">筛选:</span>
          <Badge
            variant="primary"
            className="cursor-pointer"
            onClick={() => setSelectedEmotion(null)}
          >
            {emotions.find(e => e.value === selectedEmotion)?.label}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        </motion.div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <SoulCard
                id={item.id}
                content={item.content}
                emotion={item.emotion}
                authorName={item.authorName}
                timestamp={formatRelativeTime(item.createdAt)}
                location={item.location}
                likes={item.likes}
                comments={item.comments}
                isLiked={item.isLiked}
                isEncrypted={item.isEncrypted}
                tags={item.tags}
                onLike={() => handleLike(item.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-surface rounded-card animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-surface mb-6">
            <Sparkles className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-text-primary mb-2">
            {searchQuery ? '未找到相关内容' : '还没有内容'}
          </h3>
          <p className="text-text-secondary mb-6">
            {searchQuery 
              ? '尝试使用其他关键词搜索' 
              : '成为第一个分享心声的人吧'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              分享心声
            </Button>
          )}
        </motion.div>
      )}

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-10" />

      {/* Create Post Dialog - Simple Modal */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-surface rounded-card border border-border p-6"
          >
            <h2 className="font-serif text-xl font-semibold text-text-primary mb-4">
              分享你的心声
            </h2>
            <textarea
              className="w-full h-32 bg-background border border-border rounded-lg p-3 text-text-primary placeholder:text-text-muted resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none"
              placeholder="写下你的想法、感受或故事..."
              maxLength={500}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={() => handleCreatePost('test', 'neutral')}>
                发布
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Plaza
