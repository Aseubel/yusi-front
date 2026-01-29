import { useEffect, useState } from 'react'
import { Button, Card } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { matchApi } from '../lib/api'
import { Heart, X, MessageCircle, Sparkles, Settings, User } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface SoulMatch {
  id: number
  userAId: string
  userBId: string
  letterAtoB: string
  letterBtoA: string
  statusA: number // 0: Pending, 1: Interested, 2: Skipped
  statusB: number
  isMatched: boolean
  createTime: string
}

import { SoulChatWindow } from '../components/SoulChatWindow'

export const Match = () => {
  const { user, login } = useAuthStore() // login used to update user state
  const [isEnabled, setIsEnabled] = useState(false)
  const [intent, setIntent] = useState('寻找知己')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<SoulMatch[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [currentMatchId, setCurrentMatchId] = useState<number | null>(null)

  const handleOpenChat = (matchId: number) => {
    setCurrentMatchId(matchId)
    setIsChatOpen(true)
  }

  useEffect(() => {
    if (user) {
      setIsEnabled(!!user.isMatchEnabled)
      setIntent(user.matchIntent || '寻找知己')
      if (user.isMatchEnabled) {
        fetchMatches()
      }
    }
  }, [user])

  const fetchMatches = async () => {
    setRefreshing(true)
    try {
      const res = await matchApi.getRecommendations()
      setMatches(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      const res = await matchApi.updateSettings({ enabled: isEnabled, intent })
      // Update local user state
      // Assuming res.data returns the updated user object
      // We need to keep the token and refreshToken from the store
      const { token, refreshToken } = useAuthStore.getState()
      if (token && refreshToken) {
        login(res.data, token, refreshToken)
      }
      toast.success(isEnabled ? '灵魂匹配已开启' : '灵魂匹配已关闭')
      if (isEnabled) {
        fetchMatches()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (matchId: number, action: 1 | 2) => {
    try {
      await matchApi.handleAction(matchId, action)
      toast.success(action === 1 ? '已发送感兴趣信号' : '已跳过')
      fetchMatches() // Refresh list
    } catch (e) {
      console.error(e)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse-slow">
             <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">开启灵魂匹配</h2>
            <p className="text-muted-foreground max-w-sm">寻找与你灵魂契合的伙伴，开启深度连接。</p>
          </div>
          <Link to="/login" state={{ from: '/match' }}>
            <Button size="lg" className="px-8 shadow-lg shadow-primary/20">前往登录</Button>
          </Link>
        </div>
    )
  }

  return (
    <>
      <div className="container-page py-12 max-w-4xl min-h-screen flex flex-col items-center">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-gradient">灵魂匹配</h1>
            <p className="text-muted-foreground text-lg">
              基于 AI 深度分析，为你寻找真正懂你的灵魂伴侣。
            </p>
          </div>
          {user.isMatchEnabled && (
            <Button variant="outline" size="sm" onClick={() => setIsEnabled(false)} className="self-start md:self-center">
              <Settings className="mr-2 h-4 w-4" />
              设置
            </Button>
          )}
        </div>

        {!user.isMatchEnabled && !isEnabled ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-10 max-w-lg mx-auto text-center space-y-8 glass-card border-primary/20">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center shadow-inner">
                <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div>
                <h2 className="text-2xl font-bold mb-3">开启灵魂探索之旅</h2>
                <p className="text-muted-foreground leading-relaxed">
                    开启后，系统将每天为你推荐 1-3 位在价值观、性格和情感模式上高度契合的“灵魂伙伴”。
                    <br className="mt-2" />
                    我们通过双方 AI 的<span className="text-primary font-medium">“匿名推荐信”</span>来介绍彼此。
                </p>
                </div>

                <div className="space-y-4 text-left bg-muted/30 p-6 rounded-xl border border-border/50">
                <label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    你的交友意图
                </label>
                <select
                    className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                >
                    <option value="寻找知己">寻找知己 (Soulmate)</option>
                    <option value="寻找朋友">寻找朋友 (Friend)</option>
                    <option value="寻找树洞">寻找树洞 (Listener)</option>
                </select>
                </div>

                <div className="pt-2">
                <Button size="lg" className="w-full text-lg h-12 shadow-xl shadow-primary/20" onClick={() => { setIsEnabled(true); handleSaveSettings(); }} isLoading={loading}>
                    开启匹配
                </Button>
                </div>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8 w-full">
            {!user.isMatchEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <Card className="p-4 mb-6 border-primary/20 bg-primary/5 flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        你修改了设置，请保存以生效
                    </span>
                    <Button size="sm" onClick={handleSaveSettings} isLoading={loading}>保存设置</Button>
                </Card>
              </motion.div>
            )}

            {matches.length === 0 && !refreshing ? (
              <div className="text-center py-24 text-muted-foreground bg-muted/20 rounded-3xl border border-dashed border-border/50">
                <Sparkles className="h-12 w-12 mx-auto mb-6 opacity-20" />
                <h3 className="text-lg font-medium mb-2">暂时没有新的推荐</h3>
                <p className="text-sm max-w-md mx-auto leading-relaxed">请多写几篇日记，让 AI 更了解你，并在每天凌晨 2 点留意新的推荐。</p>
                <Button variant="outline" className="mt-8" onClick={fetchMatches}>刷新列表</Button>
              </div>
            ) : (
              <div className="grid gap-8">
                {matches.map((match, index) => {
                  const isUserA = match.userAId === user.userId
                  const letter = isUserA ? match.letterAtoB : match.letterBtoA
                  const myStatus = isUserA ? match.statusA : match.statusB

                  // Filter out skipped matches from view if desired, or show them as grayed out
                  if (myStatus === 2) return null

                  return (
                    <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="overflow-hidden border-primary/10 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 p-8">
                            <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-mono text-primary border border-primary/20 shadow-sm">
                                💌 匿名推荐信
                            </span>
                            {match.isMatched && (
                                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-bold border border-green-500/20 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                配对成功
                                </span>
                            )}
                            </div>
                            <div className="prose prose-lg dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap leading-relaxed italic text-foreground/80 font-serif">
                                "{letter}"
                            </p>
                            </div>
                        </div>

                        <div className="p-6 bg-card/50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground font-medium">
                            {match.isMatched ? (
                                <Button
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50 w-full sm:w-auto"
                                onClick={() => handleOpenChat(match.id)}
                                >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                开启匿名聊天
                                </Button>
                            ) : myStatus === 1 ? (
                                <span className="text-primary flex items-center gap-2">
                                <Heart className="w-4 h-4 fill-primary" />
                                已发送感兴趣信号，等待对方回应...
                                </span>
                            ) : (
                                <span>你觉得这位灵魂伙伴怎么样？</span>
                            )}
                            </div>

                            {!match.isMatched && myStatus === 0 && (
                            <div className="flex gap-4 w-full sm:w-auto">
                                <Button
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive flex-1 sm:flex-none"
                                onClick={() => handleAction(match.id, 2)}
                                >
                                <X className="w-4 h-4 mr-2" />
                                跳过
                                </Button>
                                <Button
                                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 shadow-md flex-1 sm:flex-none"
                                onClick={() => handleAction(match.id, 1)}
                                >
                                <Heart className="w-4 h-4 mr-2 fill-current" />
                                感兴趣
                                </Button>
                            </div>
                            )}
                        </div>
                        </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <SoulChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        matchId={currentMatchId}
      />
    </>
  )
}
