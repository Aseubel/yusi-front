import { useEffect, useState } from 'react'
import { Button, Card, Select } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { matchApi } from '../lib/api'
import { Heart, X, MessageCircle, Sparkles, Settings, User, Clock, BookOpen, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

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

interface MatchStatus {
  enabled: boolean
  intent: string
  diaryCount: number
  pendingMatches: number
  completedMatches: number
  nextMatchTime: string
  canEnable: boolean
  enableHint: string | null
}

import { SoulChatWindow } from '../components/SoulChatWindow'

export const Match = () => {
  const { t } = useTranslation()
  const { user, login } = useAuthStore()
  const [isEnabled, setIsEnabled] = useState(false)
  const [intent, setIntent] = useState('寻找知己')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<SoulMatch[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null)
  const [showSettings, setShowSettings] = useState(false)

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
      fetchMatchStatus()
      fetchMatches()
    }
  }, [user])

  const fetchMatchStatus = async () => {
    try {
      const res = await matchApi.getStatus()
      setMatchStatus(res.data.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchMatches = async () => {
    setRefreshing(true)
    try {
      const res = await matchApi.getRecommendations()
      setMatches(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSaveSettings = async (targetEnabled?: boolean) => {
    const finalEnabled = typeof targetEnabled === 'boolean' ? targetEnabled : isEnabled

    // Check diary count before enabling
    if (finalEnabled && matchStatus && !matchStatus.canEnable) {
      toast.error(matchStatus.enableHint || t('match.minDiariesRequired'))
      return
    }

    setLoading(true)
    try {
      const res = await matchApi.updateSettings({ enabled: finalEnabled, intent })
      // Update local user state
      const { token, refreshToken } = useAuthStore.getState()
      if (token && refreshToken) {
        login(res.data.data, token, refreshToken)
      }
      toast.success(finalEnabled ? t('match.enabled') : t('match.disabled'))
      setShowSettings(false)

      // Refresh status and matches
      await fetchMatchStatus()
      fetchMatches()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (matchId: number, action: 1 | 2) => {
    try {
      await matchApi.handleAction(matchId, action)
      toast.success(action === 1 ? t('match.interested') : t('match.skipped'))
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
          <h2 className="text-2xl font-bold">{t('match.title')}</h2>
          <p className="text-muted-foreground max-w-sm">{t('match.subtitle')}</p>
        </div>
        <Link to="/login" state={{ from: '/match' }}>
          <Button size="lg" className="px-8 shadow-lg shadow-primary/20">{t('match.login')}</Button>
        </Link>
      </div>
    )
  }

  // Status panel component
  const StatusPanel = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="p-6 glass-card border-primary/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${matchStatus?.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="font-medium">{matchStatus?.enabled ? t('match.statusEnabled') : t('match.statusDisabled')}</span>
            </div>
            {matchStatus?.enabled && (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">{matchStatus.diaryCount} {t('match.diaries')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{t('match.nextMatch')}: {matchStatus.nextMatchTime}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{matchStatus.pendingMatches} {t('match.pending')} / {matchStatus.completedMatches} {t('match.matched')}</span>
                </div>
              </>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="mr-2 h-4 w-4" />
            {t('match.settings')}
          </Button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-border"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t('match.intent.label')}
                </label>
                <Select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                >
                  <option value="寻找知己">{t('match.intent.soulmate')}</option>
                  <option value="寻找朋友">{t('match.intent.friend')}</option>
                  <option value="寻找树洞">{t('match.intent.listener')}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('match.matchStatus')}</label>
                <div className="flex items-center gap-4">
                  <Button
                    variant={isEnabled ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setIsEnabled(!isEnabled)}
                    className="flex-1"
                  >
                    {isEnabled ? t('match.enabled') : t('match.disabled')}
                  </Button>
                </div>
              </div>
            </div>
            {matchStatus && !matchStatus.canEnable && isEnabled && (
              <p className="mt-4 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                ⚠️ {matchStatus.enableHint}
              </p>
            )}
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>{t('common.cancel')}</Button>
              <Button size="sm" onClick={() => handleSaveSettings()} isLoading={loading}>{t('match.saveSettings')}</Button>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  )

  return (
    <>
      <div className="container-page py-12 min-h-screen flex flex-col items-center">
        <div className="w-full grid gap-4 mb-6 items-center text-center md:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col items-center justify-center md:col-start-2">
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-gradient">{t('match.title')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('match.description')}
            </p>
          </div>
        </div>

        <div className="space-y-4 w-full">
          <StatusPanel />

          {matches.length === 0 && !refreshing ? (
            <div className="text-center py-24 text-muted-foreground bg-muted/20 rounded-3xl border border-dashed border-border/50">
              <Sparkles className="h-12 w-12 mx-auto mb-6 opacity-20" />
              <h3 className="text-lg font-medium mb-2">{t('match.noRecommendations')}</h3>
              <p className="text-sm max-w-md mx-auto leading-relaxed mb-2">
                {t('match.noRecommendationsHint1')}
              </p>
              <p className="text-sm max-w-md mx-auto leading-relaxed text-muted-foreground/70">
                {t('match.noRecommendationsHint2')}
              </p>
              <Button variant="outline" className="mt-8" onClick={fetchMatches}>{t('match.refresh')}</Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                        <div className="bg-linear-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 p-8">
                          <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-mono text-primary border border-primary/20 shadow-sm">
                              {t('match.anonymousLetter')}
                            </span>
                            {match.isMatched && (
                              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-bold border border-green-500/20 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {t('match.matched')}
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
                                {t('match.startChat')}
                              </Button>
                            ) : myStatus === 1 ? (
                              <span className="text-primary flex items-center gap-2">
                                <Heart className="w-4 h-4 fill-primary" />
                                {t('match.waitingResponse')}
                              </span>
                            ) : (
                              <span>{t('match.howDoYouThink')}</span>
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
                                {t('match.skip')}
                              </Button>
                              <Button
                                className="bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 shadow-md flex-1 sm:flex-none"
                                onClick={() => handleAction(match.id, 1)}
                              >
                                <Heart className="w-4 h-4 mr-2 fill-current" />
                                {t('match.interested')}
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
      </div>

      <SoulChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        matchId={currentMatchId}
      />
    </>
  )
}
