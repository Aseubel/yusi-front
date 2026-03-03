import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, RichTextEditor } from './ui'
import { toast } from 'sonner'
import DOMPurify from 'dompurify'
import { useState, useEffect, useCallback } from 'react'
import { writeDiary, editDiary, getDiaryList, submitToPlaza, type Diary as DiaryType } from '../lib'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, MessageCircle, Edit2, X, Book, MapPin, Share2, Clock, Users } from 'lucide-react'
import { useChatStore } from '../stores'
import { useEncryptionStore } from '../stores/encryptionStore'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'
import { LocationPicker } from './LocationPicker'
import { type GeoLocation } from '../lib/location'

// const emotionConfig = {
//   Joy: { label: '喜悦', color: 'bg-amber-400', text: 'text-amber-600' },
//   Sadness: { label: '悲伤', color: 'bg-sky-400', text: 'text-sky-600' },
//   Anxiety: { label: '焦虑', color: 'bg-orange-400', text: 'text-orange-600' },
//   Love: { label: '温暖', color: 'bg-rose-400', text: 'text-rose-600' },
//   Anger: { label: '愤怒', color: 'bg-red-500', text: 'text-red-600' },
//   Fear: { label: '恐惧', color: 'bg-violet-400', text: 'text-violet-600' },
//   Hope: { label: '希望', color: 'bg-emerald-400', text: 'text-emerald-600' },
//   Calm: { label: '平静', color: 'bg-teal-400', text: 'text-teal-600' },
//   Confusion: { label: '困惑', color: 'bg-indigo-400', text: 'text-indigo-600' },
//   Neutral: { label: '随想', color: 'bg-slate-400', text: 'text-slate-500' }
// }

// const emotionKeywords = {
//   Joy: ['开心', '快乐', '幸福', '喜悦', '满足', '兴奋', '甜', '好棒', '好开心'],
//   Sadness: ['难过', '悲伤', '失落', '想哭', '眼泪', '遗憾', '孤单', '沮丧'],
//   Anxiety: ['焦虑', '紧张', '担心', '不安', '压力', '恐慌', '崩溃', '急躁'],
//   Love: ['温暖', '爱', '喜欢', '感动', '亲密', '依恋', '拥抱', '陪伴'],
//   Anger: ['生气', '愤怒', '烦躁', '讨厌', '失望', '恼火', '憋屈', '怒'],
//   Fear: ['害怕', '恐惧', '不敢', '惊吓', '阴影', '惶恐'],
//   Hope: ['希望', '期待', '相信', '一定会', '转机', '未来', '愿望'],
//   Calm: ['平静', '安静', '放松', '舒缓', '安然', '淡定', '自在'],
//   Confusion: ['困惑', '迷茫', '不确定', '矛盾', '搞不懂', '疑惑'],
//   Neutral: []
// }

// const inferEmotion = (text: string) => {
//   const contentText = text.trim()
//   if (!contentText) return 'Neutral' as const
//   const lower = contentText.toLowerCase()
//   let bestKey: keyof typeof emotionKeywords = 'Neutral'
//   let bestScore = 0
//   Object.entries(emotionKeywords).forEach(([key, words]) => {
//     const score = words.reduce((acc, word) => acc + (lower.includes(word.toLowerCase()) ? 1 : 0), 0)
//     if (score > bestScore) {
//       bestScore = score
//       bestKey = key as keyof typeof emotionKeywords
//     }
//   })
//   return bestScore === 0 ? 'Neutral' : bestKey
// }

// 简单的 HTML 检测
const isRichText = (text: string) => /<\/?[a-z][\s\S]*>/i.test(text)

function DiaryContent({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [diaries, setDiaries] = useState<DiaryType[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingList, setLoadingList] = useState(false)
  const [decryptedContents, setDecryptedContents] = useState<Record<string, string>>({})
  const [location, setLocation] = useState<GeoLocation | null>(null)

  // 离线草稿：加载
  useEffect(() => {
    if (!editingId && userId) {
      try {
        const saved = localStorage.getItem(`diary_draft_${userId}`)
        if (saved) {
          const draft = JSON.parse(saved)
          if (draft.title) setTitle(draft.title)
          if (draft.content) setContent(draft.content)
          if (draft.date) setDate(draft.date)
          if (draft.location) setLocation(draft.location)
        }
      } catch (e) {
        console.error('Failed to load diary draft', e)
      }
    }
  }, [userId, editingId])

  // 离线草稿：保存
  useEffect(() => {
    if (!editingId && userId) {
      // 只有在内容有实质更新时才保存，防止空内容覆盖有效草稿
      if (title || content || location) {
        const draft = { title, content, date, location }
        localStorage.setItem(`diary_draft_${userId}`, JSON.stringify(draft))
      } else {
        localStorage.removeItem(`diary_draft_${userId}`)
      }
    }
  }, [title, content, date, location, userId, editingId])

  // const [clusterMode, setClusterMode] = useState<'time' | 'location' | 'emotion'>('time')
  // const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d' | '180d' | '1y'>('all')
  // const [selectedCluster, setSelectedCluster] = useState<string | null>(null)

  const { openChatWithDiary } = useChatStore()
  const {
    initialize: initEncryption,
    hasActiveKey,
    encrypt,
    decrypt,
    keyMode,
    isInitialized: encryptionInitialized,
    cryptoKey
  } = useEncryptionStore()

  useEffect(() => {
    initEncryption()
  }, [initEncryption])

  const decryptDiary = useCallback(async (diary: DiaryType): Promise<string> => {
    if (!diary.clientEncrypted || !cryptoKey) {
      return diary.content
    }
    try {
      return await decrypt(diary.content)
    } catch {
      console.warn('Failed to decrypt diary:', diary.diaryId)
      return '[无法解密，请检查密钥]'
    }
  }, [cryptoKey, decrypt])

  const loadDiaries = useCallback(async (targetPage = 1) => {
    if (!userId) return
    setLoadingList(true)

    try {
      const response = await getDiaryList(userId, targetPage, 5)

      setDiaries(response.content)
      setTotalPages(response.totalPages)
      setPage(targetPage)

      if (hasActiveKey()) {
        const decrypted: Record<string, string> = {}
        for (const diary of response.content) {
          decrypted[diary.diaryId] = await decryptDiary(diary)
        }
        setDecryptedContents(prev => ({ ...prev, ...decrypted }))
      }
    } catch (e) {
      console.error('Failed to load diaries', e)
    } finally {
      setLoadingList(false)
    }
  }, [userId, hasActiveKey, decryptDiary])

  useEffect(() => {
    if (encryptionInitialized) {
      loadDiaries(1)
    }
  }, [encryptionInitialized, loadDiaries])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      loadDiaries(newPage)
      const historySection = document.getElementById('history-section')
      if (historySection) {
        historySection.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  useEffect(() => {
    if (cryptoKey && diaries.length > 0) {
      const decryptAll = async () => {
        const decrypted: Record<string, string> = {}
        for (const diary of diaries) {
          decrypted[diary.diaryId] = await decryptDiary(diary)
        }
        setDecryptedContents(decrypted)
      }
      decryptAll()
    }
  }, [cryptoKey, diaries, decryptDiary])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('标题与内容不能为空')
      return
    }

    if (!hasActiveKey()) {
      toast.error('请先解锁或配置密钥')
      navigate('/settings')
      return
    }

    setLoading(true)
    try {
      const isClientEncrypted = keyMode === 'CUSTOM'
      const payloadContent = isClientEncrypted ? await encrypt(content) : content

      const { hasCloudBackup } = useEncryptionStore.getState()

      const plainContent = keyMode === 'CUSTOM' && hasCloudBackup ? content : undefined

      if (editingId) {
        await editDiary({
          userId,
          diaryId: editingId,
          title,
          content: payloadContent,
          entryDate: date,
          clientEncrypted: isClientEncrypted,
          plainContent,
          latitude: location?.latitude,
          longitude: location?.longitude,
          address: location?.address,
          placeName: location?.placeName,
          placeId: location?.placeId
        })
        toast.success('日记已更新')
        setEditingId(null)
      } else {
        await writeDiary({
          userId,
          title,
          content: payloadContent,
          entryDate: date,
          clientEncrypted: isClientEncrypted,
          plainContent,
          latitude: location?.latitude,
          longitude: location?.longitude,
          address: location?.address,
          placeName: location?.placeName,
          placeId: location?.placeId
        })
        toast.success('日记已保存')
        localStorage.removeItem(`diary_draft_${userId}`)
      }
      setTitle('')
      setContent('')
      setDate(new Date().toISOString().split('T')[0])
      setLocation(null)
      loadDiaries(1)
    } catch {
      toast.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (diary: DiaryType) => {
    setEditingId(diary.diaryId)
    setTitle(diary.title)
    const decrypted = decryptedContents[diary.diaryId] || diary.content
    setContent(decrypted)
    setDate(diary.entryDate)
    if (Number.isFinite(Number(diary.latitude)) && Number.isFinite(Number(diary.longitude))) {
      setLocation({
        latitude: Number(diary.latitude),
        longitude: Number(diary.longitude),
        address: diary.address,
        placeName: diary.placeName,
        placeId: diary.placeId
      })
    } else {
      setLocation(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setDate(new Date().toISOString().split('T')[0])
    setLocation(null)
  }

  const handleShareToPlaza = async (diary: DiaryType) => {
    const decryptedContent = decryptedContents[diary.diaryId] || diary.content
    if (decryptedContent.startsWith('[🔒') || decryptedContent.startsWith('[无法解密')) {
      toast.error('无法分享加密未解锁的日记')
      return
    }
    try {
      await submitToPlaza(decryptedContent, diary.diaryId, 'DIARY')
      toast.success('已分享到广场')
    } catch {
      toast.error('分享失败，请稍后重试')
    }
  }

  const handleChat = (diary: DiaryType) => {
    const decryptedContent = decryptedContents[diary.diaryId] || diary.content
    openChatWithDiary({
      diaryId: diary.diaryId,
      title: diary.title,
      entryDate: diary.entryDate,
      content: decryptedContent
    })
  }

  const getDisplayContent = (diary: DiaryType): string => {
    if (!diary.clientEncrypted) {
      return diary.content
    }
    return decryptedContents[diary.diaryId] || '[🔒 内容已加密，请解锁查看]'
  }

  // useEffect(() => {
  //   setSelectedCluster(null)
  // }, [clusterMode, timeRange])

  // const footprintEntries = useMemo(() => {
  //   return diaries.flatMap((diary) => {
  //     const latitude = Number(diary.latitude)
  //     const longitude = Number(diary.longitude)
  //     if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
  //       return []
  //     }
  //     const rawContent = diary.clientEncrypted
  //       ? decryptedContents[diary.diaryId] || ''
  //       : diary.content
  //     const emotion = inferEmotion(rawContent)
  //     return [
  //       {
  //         id: diary.diaryId,
  //         title: diary.title,
  //         entryDate: diary.entryDate,
  //         latitude,
  //         longitude,
  //         placeName: diary.placeName || diary.address || '未知地点',
  //         address: diary.address,
  //         emotion,
  //         preview: rawContent.slice(0, 48)
  //       }
  //     ]
  //   })
  // }, [diaries, decryptedContents])

  // const filteredEntries = useMemo(() => {
  //   if (timeRange === 'all') return footprintEntries
  //   const now = new Date()
  //   const rangeMap = {
  //     '7d': 7,
  //     '30d': 30,
  //     '180d': 180,
  //     '1y': 365
  //   }
  //   const days = rangeMap[timeRange]
  //   return footprintEntries.filter((entry) => {
  //     const date = new Date(entry.entryDate)
  //     if (Number.isNaN(date.getTime())) return false
  //     const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  //     return diff <= days
  //   })
  // }, [footprintEntries, timeRange])

  // const clusters = useMemo(() => {
  //   const map = new Map<string, typeof filteredEntries>()
  //   filteredEntries.forEach((entry) => {
  //     let key = ''
  //     if (clusterMode === 'time') {
  //       key = entry.entryDate.slice(0, 7)
  //     } else if (clusterMode === 'location') {
  //       key = entry.placeName
  //     } else {
  //       key = entry.emotion
  //     }
  //     if (!map.has(key)) {
  //       map.set(key, [])
  //     }
  //     map.get(key)!.push(entry)
  //   })
  //   const list = Array.from(map.entries()).map(([key, items]) => ({ key, items }))
  //   if (clusterMode === 'time') {
  //     return list.sort((a, b) => b.key.localeCompare(a.key))
  //   }
  //   return list.sort((a, b) => b.items.length - a.items.length)
  // }, [filteredEntries, clusterMode])

  // const activeEntries = useMemo(() => {
  //   if (!selectedCluster) return filteredEntries
  //   return filteredEntries.filter((entry) => {
  //     if (clusterMode === 'time') return entry.entryDate.startsWith(selectedCluster)
  //     if (clusterMode === 'location') return entry.placeName === selectedCluster
  //     return entry.emotion === selectedCluster
  //   })
  // }, [filteredEntries, selectedCluster, clusterMode])

  // const mapBounds = useMemo(() => {
  //   if (activeEntries.length === 0) {
  //     return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 }
  //   }
  //   const lats = activeEntries.map((p) => p.latitude)
  //   const lngs = activeEntries.map((p) => p.longitude)
  //   const minLat = Math.min(...lats)
  //   const maxLat = Math.max(...lats)
  //   const minLng = Math.min(...lngs)
  //   const maxLng = Math.max(...lngs)
  //   return { minLat, maxLat, minLng, maxLng }
  // }, [activeEntries])

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl font-bold flex items-center gap-3 justify-center md:justify-start">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Book className="w-6 h-6" />
            </div>
            <span className="text-gradient">AI知己 · 私密日记</span>
          </h2>
          <p className="text-muted-foreground">端到端加密，仅你可见，AI 伴你同行。</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/timeline')}
            className="rounded-full shadow-sm hover:border-primary/50 hover:text-primary transition-all"
          >
            <Clock className="w-4 h-4 mr-2" />
            人生时间线
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/community')}
            className="rounded-full shadow-sm hover:border-primary/50 hover:text-primary transition-all"
          >
            <Users className="w-4 h-4 mr-2" />
            关系图谱
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20"
      >
        <Card className="glass-card border-white/20 dark:border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">{editingId ? '编辑日记' : '写日记'}</CardTitle>
            <CardDescription>记录你的经历、想法与感受。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">日期</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">标题</label>
                <Input
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="给今天起个名字..."
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">内容</label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="此刻你在想什么？..."
                className="min-h-[300px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">位置</label>
              <LocationPicker value={location} onChange={setLocation} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border/50 pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              所有内容端到端加密，仅用于AI分析
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {editingId && (
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1 sm:flex-none">
                  <X className="w-4 h-4 mr-1" /> 取消
                </Button>
              )}
              <Button isLoading={loading} onClick={handleSave} className="flex-1 sm:flex-none px-8 shadow-lg shadow-primary/20">
                {editingId ? '更新日记' : '保存日记'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="relative z-10"
      >
        <Card className="glass-card border-white/20 dark:border-white/10 shadow-xl">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                足迹地图
              </CardTitle>
              <CardDescription>按时间、地点、情感聚类回看你的日记足迹。</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={clusterMode === 'time' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setClusterMode('time')}
              >
                时间聚类
              </Button>
              <Button
                variant={clusterMode === 'location' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setClusterMode('location')}
              >
                地点聚类
              </Button>
              <Button
                variant={clusterMode === 'emotion' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setClusterMode('emotion')}
              >
                情感聚类
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background min-h-[360px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.15),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.12),transparent_45%)]" />
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-20">
                {[...Array(24)].map((_, index) => (
                  <div key={index} className="border border-white/10 dark:border-white/5" />
                ))}
              </div>
              {activeEntries.length === 0 ? (
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <MapPin className="w-10 h-10 opacity-40" />
                  <div className="text-sm">暂无足迹，添加带位置的日记开始点亮地图</div>
                </div>
              ) : (
                <div className="relative z-10 h-full">
                  {activeEntries.map((entry) => {
                    const latSpan = Math.max(mapBounds.maxLat - mapBounds.minLat, 0.0001)
                    const lngSpan = Math.max(mapBounds.maxLng - mapBounds.minLng, 0.0001)
                    const x = ((entry.longitude - mapBounds.minLng) / lngSpan) * 100
                    const y = (1 - (entry.latitude - mapBounds.minLat) / latSpan) * 100
                    const emotion = emotionConfig[entry.emotion]
                    return (
                      <button
                        key={entry.id}
                        className="group absolute flex items-center justify-center"
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onClick={() => setSelectedCluster(clusterMode === 'emotion' ? entry.emotion : clusterMode === 'location' ? entry.placeName : entry.entryDate.slice(0, 7))}
                        title={`${entry.entryDate} · ${entry.placeName}`}
                      >
                        <span className={`absolute w-6 h-6 rounded-full ${emotion.color} opacity-20 blur-sm`} />
                        <span className={`w-3 h-3 rounded-full ${emotion.color} shadow-lg ring-2 ring-white/70 dark:ring-white/20 transition-transform duration-200 group-hover:scale-125`} />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: '全部' },
                  { key: '7d', label: '近7天' },
                  { key: '30d', label: '近30天' },
                  { key: '180d', label: '近半年' },
                  { key: '1y', label: '近一年' }
                ].map((item) => (
                  <Button
                    key={item.key}
                    variant={timeRange === item.key ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeRange(item.key as typeof timeRange)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 backdrop-blur p-4 space-y-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>聚类结果</span>
                  <span className="text-muted-foreground">{clusters.length} 组</span>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {clusters.map((cluster) => {
                    const isActive = selectedCluster === cluster.key
                    const first = cluster.items[0]
                    const emotion = emotionConfig[first.emotion]
                    return (
                      <button
                        key={cluster.key}
                        onClick={() => setSelectedCluster(cluster.key)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${isActive ? 'border-primary/40 bg-primary/5' : 'border-border/40 hover:bg-muted/30'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {clusterMode === 'emotion'
                              ? emotionConfig[cluster.key as keyof typeof emotionConfig]?.label || cluster.key
                              : cluster.key}
                          </span>
                          <span className="text-xs text-muted-foreground">{cluster.items.length} 条</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`w-2 h-2 rounded-full ${emotion.color}`} />
                          <span className="truncate">{first.title}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 text-sm">
                <div className="font-medium">情感图例</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(emotionConfig).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2 text-muted-foreground">
                      <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                      <span>{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div> */}

      <div className="space-y-6" id="history-section">
        <h3 className="text-xl font-semibold px-2 border-l-4 border-primary/50 pl-4">历史日记</h3>

        {diaries.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
            <Book className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">暂无日记，开始记录第一篇吧</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {diaries.map((diary, index) => (
              <motion.div
                key={diary.diaryId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/40">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold text-primary">{diary.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <span>{diary.entryDate}</span>
                          {diary.clientEncrypted && (
                            <span className="inline-flex items-center text-[10px] bg-background/50 px-1.5 py-0.5 rounded text-muted-foreground border">
                              <Lock className="w-3 h-3 mr-1" /> 已加密
                            </span>
                          )}
                          {diary.placeName && (
                            <span className="inline-flex items-center text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary/70 border border-primary/20">
                              <MapPin className="w-3 h-3 mr-1" /> {diary.placeName}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(diary)} title="编辑">
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {isRichText(getDisplayContent(diary)) ? (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 break-words"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getDisplayContent(diary)) }}
                      />
                    ) : (
                      <div className="text-sm leading-7 whitespace-pre-wrap font-sans text-foreground/90 break-words">
                        {getDisplayContent(diary)}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/10 flex justify-end gap-3 py-3 px-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChat(diary)}
                      className="text-xs group hover:border-primary/50 hover:text-primary"
                    >
                      <MessageCircle className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" />
                      展开对话
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareToPlaza(diary)}
                      className="text-xs group hover:border-primary/50 hover:text-primary"
                    >
                      <Share2 className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" />
                      分享到广场
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4 pb-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loadingList}
                  className="w-9 h-9 p-0"
                >
                  &lt;
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (page > 3 && page < totalPages - 2) {
                      pageNum = page - 2 + i;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    }
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loadingList}
                      className={`w-9 h-9 p-0 ${page === pageNum ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-accent'}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || loadingList}
                  className="w-9 h-9 p-0"
                >
                  &gt;
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const Diary = () => {
  const { user } = useAuthStore()

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse-slow">
          <Book className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">AI知己 · 私密日记</h2>
          <p className="text-muted-foreground max-w-sm">端到端加密，仅你可见，AI 伴你同行。</p>
        </div>
        <Link to="/login" state={{ from: '/diary' }}>
          <Button size="lg" className="px-8 shadow-lg shadow-primary/20">前往登录</Button>
        </Link>
      </div>
    )
  }

  return <DiaryContent userId={user.userId} />
}
