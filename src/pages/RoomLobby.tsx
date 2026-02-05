import { cn } from '../utils'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Users, 
  Sparkles, 
  Lock,
  Unlock,
  Clock,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card'
import { toast } from 'sonner'

interface Room {
  id: string
  name: string
  description?: string
  scenario: string
  hostName: string
  participantCount: number
  maxParticipants: number
  isPrivate: boolean
  hasPassword: boolean
  status: 'waiting' | 'active' | 'ended'
  createdAt: string
  tags?: string[]
}

const roomTypes = [
  { value: 'all', label: '全部', icon: Sparkles },
  { value: 'public', label: '公开', icon: Unlock },
  { value: 'private', label: '私密', icon: Lock },
]

const sortOptions = [
  { value: 'latest', label: '最新创建', icon: Clock },
  { value: 'popular', label: '人数最多', icon: Users },
]

// Mock data for demonstration
const mockRooms: Room[] = [
  {
    id: '1',
    name: '深夜树洞',
    description: '分享你的故事，倾听他人的心声',
    scenario: '情感交流',
    hostName: '匿名用户',
    participantCount: 3,
    maxParticipants: 5,
    isPrivate: false,
    hasPassword: false,
    status: 'waiting',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    tags: ['情感', '倾听'],
  },
  {
    id: '2',
    name: '职场吐槽大会',
    description: '工作压力释放区',
    scenario: '职场话题',
    hostName: '打工人',
    participantCount: 8,
    maxParticipants: 10,
    isPrivate: false,
    hasPassword: false,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    tags: ['职场', '吐槽'],
  },
  {
    id: '3',
    name: '秘密花园',
    description: '私密空间，需要密码进入',
    scenario: '私密交流',
    hostName: '神秘人',
    participantCount: 2,
    maxParticipants: 4,
    isPrivate: true,
    hasPassword: true,
    status: 'waiting',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    tags: ['私密'],
  },
]

export function RoomLobby() {
  const [rooms] = useState<Room[]>(mockRooms)
  const [loading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [joinRoomId, setJoinRoomId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refresh rooms
  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast.success('已刷新')
  }

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    // Filter by type
    if (selectedType === 'public' && room.isPrivate) return false
    if (selectedType === 'private' && !room.isPrivate) return false
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        room.name.toLowerCase().includes(query) ||
        room.description?.toLowerCase().includes(query) ||
        room.scenario.toLowerCase().includes(query) ||
        room.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    return true
  })

  // Sort rooms
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return b.participantCount - a.participantCount
  })

  // Get status badge
  const getStatusBadge = (status: Room['status']) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="success" dot>等待中</Badge>
      case 'active':
        return <Badge variant="primary" dot dotColor="bg-primary-400">进行中</Badge>
      case 'ended':
        return <Badge variant="ghost">已结束</Badge>
      default:
        return null
    }
  }

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
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
          <h1 className="font-serif text-3xl font-bold text-text-primary">情景室</h1>
          <p className="text-text-secondary mt-1">加入或创建情景室，与志同道合的灵魂一起探索人生话题</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            创建房间
          </Button>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="搜索房间名称、情景或标签..."
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

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Room Type Filter */}
          <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border">
            {roomTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    selectedType === type.value
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {type.label}
                </button>
              )
            })}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border">
            {sortOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    sortBy === option.value
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {sortedRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="group h-full flex flex-col"
                hover
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="truncate">{room.name}</span>
                        {room.hasPassword && (
                          <Lock className="w-4 h-4 text-text-muted flex-shrink-0" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {room.description || `情景: ${room.scenario}`}
                      </CardDescription>
                    </div>
                    {getStatusBadge(room.status)}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  {/* Tags */}
                  {room.tags && room.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {room.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="ghost" size="sm">
                          #{tag}
                        </Badge>
                      ))}
                      {room.tags.length > 3 && (
                        <Badge variant="ghost" size="sm">
                          +{room.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="space-y-2 text-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {room.participantCount}/{room.maxParticipants} 人
                      </span>
                      {/* Progress bar */}
                      <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ 
                            width: `${(room.participantCount / room.maxParticipants) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatRelativeTime(room.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-border">
                  <Button
                    variant={room.status === 'waiting' ? 'primary' : 'secondary'}
                    size="sm"
                    fullWidth
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={() => setJoinRoomId(room.id)}
                    disabled={room.status === 'ended' || room.participantCount >= room.maxParticipants}
                  >
                    {room.status === 'ended' 
                      ? '已结束' 
                      : room.participantCount >= room.maxParticipants 
                        ? '已满员' 
                        : '加入房间'
                    }
                  </Button>
                </CardFooter>
              </Card>
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
              className="h-72 bg-surface rounded-card animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedRooms.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-surface mb-6">
            <Sparkles className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-text-primary mb-2">
            {searchQuery ? '未找到相关房间' : '还没有房间'}
          </h3>
          <p className="text-text-secondary mb-6">
            {searchQuery 
              ? '尝试使用其他关键词搜索' 
              : '创建第一个房间，开始你的情景探索之旅'}
          </p>
          <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-5 h-5" />}>
            创建房间
          </Button>
        </motion.div>
      )}

      {/* Create Room Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg"
          >
            <div className="bg-surface rounded-card border border-border p-6">
              <h2 className="font-serif text-xl font-semibold text-text-primary mb-4">创建房间</h2>
              <p className="text-text-secondary mb-6">创建一个新的情景探索房间</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => { setIsCreateOpen(false); toast.success('房间创建成功'); }}>
                  创建
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Join Room Dialog */}
      {joinRoomId && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg"
          >
            <div className="bg-surface rounded-card border border-border p-6">
              <h2 className="font-serif text-xl font-semibold text-text-primary mb-4">加入房间</h2>
              <p className="text-text-secondary mb-6">确认加入此房间?</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setJoinRoomId(null)}>
                  取消
                </Button>
                <Button onClick={() => { setJoinRoomId(null); toast.success('加入成功'); }}>
                  确认加入
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default RoomLobby
