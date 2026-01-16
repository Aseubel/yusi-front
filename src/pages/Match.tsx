import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { Button, Card } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { matchApi } from '../lib/api'
import { Heart, X, MessageCircle, Sparkles, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

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
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Sparkles className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">灵魂匹配需要登录后使用</p>
          <Link to="/login" state={{ from: '/match' }}>
            <Button>前往登录</Button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container-page py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">灵魂匹配</h1>
            <p className="text-muted-foreground">
              基于 AI 深度分析，为你寻找真正懂你的灵魂伴侣。
            </p>
          </div>
          {user.isMatchEnabled && (
            <Button variant="outline" size="sm" onClick={() => setIsEnabled(false)}>
              <Settings className="mr-2 h-4 w-4" />
              设置
            </Button>
          )}
        </div>

        {!user.isMatchEnabled && !isEnabled ? (
          <Card className="p-8 max-w-md mx-auto text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">开启灵魂探索之旅</h2>
              <p className="text-muted-foreground text-sm">
                开启后，系统将每天为你推荐 1-3 位在价值观、性格和情感模式上高度契合的“灵魂伙伴”。
                <br />
                我们通过双方 AI 的“匿名推荐信”来介绍彼此。
              </p>
            </div>

            <div className="space-y-4 text-left">
              <label className="text-sm font-medium">你的交友意图</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
              >
                <option value="寻找知己">寻找知己 (Soulmate)</option>
                <option value="寻找朋友">寻找朋友 (Friend)</option>
                <option value="寻找树洞">寻找树洞 (Listener)</option>
              </select>
            </div>

            <div className="pt-4">
              <Button className="w-full" onClick={() => { setIsEnabled(true); handleSaveSettings(); }} isLoading={loading}>
                开启匹配
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {!user.isMatchEnabled && (
              <Card className="p-4 mb-6 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">你修改了设置，请保存以生效</span>
                  <Button size="sm" onClick={handleSaveSettings} isLoading={loading}>保存设置</Button>
                </div>
              </Card>
            )}

            {matches.length === 0 && !refreshing ? (
              <div className="text-center py-20 text-muted-foreground">
                <Sparkles className="h-10 w-10 mx-auto mb-4 opacity-20" />
                <p>暂时没有新的推荐。</p>
                <p className="text-sm mt-2">请多写几篇日记，让 AI 更了解你，并在每天凌晨 2 点留意新的推荐。</p>
                <Button variant="outline" className="mt-6" onClick={fetchMatches}>刷新</Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {matches.map((match) => {
                  const isUserA = match.userAId === user.userId
                  const letter = isUserA ? match.letterAtoB : match.letterBtoA
                  const myStatus = isUserA ? match.statusA : match.statusB

                  // Filter out skipped matches from view if desired, or show them as grayed out
                  if (myStatus === 2) return null

                  return (
                    <Card key={match.id} className="overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-2 py-1 rounded bg-background/50 text-xs font-mono text-muted-foreground border">
                            匿名推荐信
                          </span>
                          {match.isMatched && (
                            <span className="px-2 py-1 rounded bg-green-500/20 text-green-700 text-xs font-bold border border-green-500/30">
                              配对成功
                            </span>
                          )}
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <p className="whitespace-pre-wrap leading-relaxed italic text-foreground/90">
                            {letter}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-background/50 border-t flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {match.isMatched ? (
                            <Button
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleOpenChat(match.id)}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              开启匿名聊天
                            </Button>
                          ) : myStatus === 1 ? (
                            <span className="text-primary font-medium">
                              已发送感兴趣信号，等待对方回应...
                            </span>
                          ) : (
                            <span>你觉得这位灵魂伙伴怎么样？</span>
                          )}
                        </div>

                        {!match.isMatched && myStatus === 0 && (
                          <div className="flex gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleAction(match.id, 2)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              跳过
                            </Button>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0"
                              onClick={() => handleAction(match.id, 1)}
                            >
                              <Heart className="w-4 h-4 mr-1 fill-current" />
                              感兴趣
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
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
    </Layout>
  )
}
