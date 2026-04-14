import { useEffect, useState } from 'react'
import { Button, Card, Select } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { matchApi, type MatchRecommendation, type MatchStatus } from '../lib/api'
import { Heart, X, MessageCircle, Sparkles, Settings, User, Clock, BookOpen, Users, Lightbulb, Compass, ShieldCheck, RefreshCw, Bot, ArrowRight, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { SoulChatWindow } from '../components/SoulChatWindow'

export const Match = () => {
  const { t } = useTranslation()
  const { user, login } = useAuthStore()
  const [isEnabled, setIsEnabled] = useState(false)
  const [intent, setIntent] = useState('寻找知己')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<MatchRecommendation[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [expandedMatchIds, setExpandedMatchIds] = useState<number[]>([])

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
      await Promise.all([fetchMatches(), fetchMatchStatus()])
    } catch (e) {
      console.error(e)
    }
  }

  const getScoreTone = (score?: number | null) => {
    if (typeof score !== 'number') return 'text-muted-foreground'
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 75) return 'text-primary'
    return 'text-amber-600 dark:text-amber-400'
  }

  const formatMatchDate = (date?: string | null) => {
    if (!date) return ''
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toLocaleDateString()
  }

  const getCardStatusMeta = (match: MatchRecommendation) => {
    if (match.matched) {
      return {
        label: t('match.statusMatchedTitle'),
        hint: t('match.statusMatchedHint'),
        badgeClass: 'bg-emerald-500/12 text-emerald-600 border-emerald-500/20',
      }
    }
    if (match.myStatus === 1) {
      return {
        label: t('match.statusWaitingTitle'),
        hint: t('match.statusWaitingHint'),
        badgeClass: 'bg-primary/10 text-primary border-primary/20',
      }
    }
    return {
      label: t('match.statusPendingTitle'),
      hint: t('match.statusPendingHint'),
      badgeClass: 'bg-amber-500/12 text-amber-600 border-amber-500/20',
    }
  }

  const toggleMatchExpanded = (matchId: number) => {
    setExpandedMatchIds((prev) =>
      prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId]
    )
  }

  const buildInsightItems = (match: MatchRecommendation) => {
    return [
      {
        key: 'reason',
        title: t('match.reasonTitle'),
        icon: Lightbulb,
        content: match.reason,
      },
      {
        key: 'timingReason',
        title: t('match.timingReasonTitle'),
        icon: Compass,
        content: match.timingReason,
      },
      {
        key: 'iceBreaker',
        title: t('match.iceBreakerTitle'),
        icon: ShieldCheck,
        content: match.iceBreaker,
      },
    ].filter((item) => !!item.content)
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

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[28px] border border-primary/10 bg-linear-to-br from-primary/8 via-background to-pink-500/6 p-6 shadow-lg shadow-primary/5"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_38%)] pointer-events-none" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1 text-xs font-medium text-primary">
                  <Bot className="h-3.5 w-3.5" />
                  {t('match.agentPanelTitle')}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{t('match.agentPanelHeadline')}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {t('match.agentPanelDescription')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3 shadow-sm">
                  <div className="text-xs text-muted-foreground">{t('match.pending')}</div>
                  <div className="mt-1 text-xl font-semibold">{matchStatus?.pendingMatches ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3 shadow-sm">
                  <div className="text-xs text-muted-foreground">{t('match.matched')}</div>
                  <div className="mt-1 text-xl font-semibold">{matchStatus?.completedMatches ?? 0}</div>
                </div>
                <Button variant="outline" className="rounded-2xl bg-background/80" onClick={fetchMatches}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('match.refresh')}
                </Button>
              </div>
            </div>
          </motion.div>

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
                  const letter = match.recommendationLetter
                  const myStatus = match.myStatus
                  const statusMeta = getCardStatusMeta(match)
                  const insightItems = buildInsightItems(match)
                  const isExpanded = expandedMatchIds.includes(match.matchId)

                  // Filter out skipped matches from view if desired, or show them as grayed out
                  if (myStatus === 2) return null

                  return (
                    <motion.div
                      key={match.matchId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="group relative overflow-hidden border-primary/10 shadow-lg transition-shadow duration-300 hover:shadow-2xl hover:shadow-primary/10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_45%)] opacity-80 pointer-events-none" />
                        <div className="relative bg-linear-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 p-8">
                          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-mono text-primary border border-primary/20 shadow-sm">
                                {t('match.aiRecommendation')}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}>
                                {statusMeta.label}
                              </span>
                            </div>
                            {formatMatchDate(match.createTime) && (
                              <span className="text-xs text-muted-foreground/80">
                                {t('match.recommendedAt')}: {formatMatchDate(match.createTime)}
                              </span>
                            )}
                          </div>

                          <div className="mb-6 flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-mono text-primary border border-primary/20 shadow-sm">
                              {t('match.anonymousLetter')}
                            </span>
                            {match.counterpartUserName && (
                              <span className="px-3 py-1 rounded-full bg-background/70 text-xs border border-border/60">
                                {t('match.recommendedPartner')}: {match.counterpartUserName}
                              </span>
                            )}
                            {typeof match.score === 'number' && (
                              <span className={`px-3 py-1 rounded-full bg-background/70 text-xs border border-border/60 ${getScoreTone(match.score)}`}>
                                {t('match.resonanceScore')}: {match.score}
                              </span>
                            )}
                          </div>

                          <div className="mb-6 rounded-[24px] border border-white/40 bg-background/75 p-5 shadow-[0_12px_40px_-24px_rgba(124,58,237,0.55)] backdrop-blur">
                            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              <Star className="h-3.5 w-3.5" />
                              {t('match.agentNarrative')}
                            </div>
                            <p className={`whitespace-pre-wrap leading-8 italic text-foreground/85 font-serif text-[15px] ${isExpanded ? '' : 'line-clamp-5'}`}>
                              "{letter}"
                            </p>
                          </div>

                          <div className="mb-4 rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                            <div className="flex items-start gap-3">
                              <Bot className="mt-0.5 h-4 w-4 text-primary" />
                              <div>
                                <div className="text-sm font-medium">{t('match.agentInsightLabel')}</div>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">{statusMeta.hint}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-muted-foreground">
                              {isExpanded ? t('match.expandedHint') : t('match.collapsedHint')}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-2xl"
                              onClick={() => toggleMatchExpanded(match.matchId)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="mr-2 h-4 w-4" />
                                  {t('match.collapseDetails')}
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="mr-2 h-4 w-4" />
                                  {t('match.expandDetails')}
                                </>
                              )}
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 grid gap-3">
                              {insightItems.map((item) => {
                                const Icon = item.icon
                                return (
                                  <div key={item.key} className="rounded-2xl border border-primary/10 bg-background/60 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/80">
                                      <Icon className="h-4 w-4 text-primary" />
                                      {item.title}
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">{item.content}</p>
                                  </div>
                                )
                              })}
                              {match.counterpartLetter && (
                                <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-4">
                                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/80">
                                    <ArrowRight className="h-4 w-4 text-primary" />
                                    {t('match.otherPerspectiveTitle')}
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                    {match.counterpartLetter}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="relative border-t bg-card/55 p-6">
                          <div className="mb-4 text-sm text-muted-foreground font-medium">
                            {match.matched ? (
                              <Button
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50 w-full sm:w-auto"
                                onClick={() => handleOpenChat(match.matchId)}
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

                          {!match.matched && myStatus === 0 && (
                            <div className="flex gap-4 w-full sm:w-auto">
                              <Button
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive flex-1 sm:flex-none rounded-2xl"
                                onClick={() => handleAction(match.matchId, 2)}
                              >
                                <X className="w-4 h-4 mr-2" />
                                {t('match.skip')}
                              </Button>
                              <Button
                                className="bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 shadow-md flex-1 sm:flex-none rounded-2xl"
                                onClick={() => handleAction(match.matchId, 1)}
                              >
                                <Heart className="w-4 h-4 mr-2 fill-current" />
                                {t('match.interested')}
                              </Button>
                            </div>
                          )}

                          {match.matched && (
                            <p className="mt-3 text-xs leading-5 text-muted-foreground">
                              {t('match.statusMatchedHint')}
                            </p>
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
