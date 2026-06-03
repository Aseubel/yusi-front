import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { agentGrowthApi, conflictApi, fusionApi, type AgentGrowth, type CognitiveConflict } from '../lib/api'
import { Brain, BookOpen, MessageCircle, Calendar, Sparkles, AlertCircle, GitMerge } from 'lucide-react'

export default function AgentGrowthPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<AgentGrowth | null>(null)
  const [conflicts, setConflicts] = useState<CognitiveConflict[]>([])
  const [fusing, setFusing] = useState(false)
  const [fusedCount, setFusedCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      agentGrowthApi.get().then(res => setData(res.data.data ?? null)),
      conflictApi.getUnresolved().then(res => setConflicts(res.data.data ?? [])),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-6xl">🌱</div>
        <h2 className="text-xl font-semibold">{t('growth.emptyTitle')}</h2>
        <p className="text-muted-foreground text-center max-w-md">{t('growth.emptyHint')}</p>
      </div>
    )
  }

  const metrics = [
    { icon: BookOpen, label: t('growth.diaryCount'), value: data.diaryCount, suffix: t('growth.pieces') },
    { icon: MessageCircle, label: t('growth.chatTurns'), value: data.chatTurnCount, suffix: t('growth.turns') },
    { icon: Brain, label: t('growth.insights'), value: data.midMemoryInsightCount, suffix: t('growth.items') },
    { icon: Calendar, label: t('growth.days'), value: data.companionDays, suffix: t('growth.dayUnit') },
  ]

  const typeLabels: Record<string, string> = {
    '人物': t('growth.types.person'),
    '事件': t('growth.types.event'),
    '地点': t('growth.types.place'),
    '情绪': t('growth.types.emotion'),
    '主题': t('growth.types.topic'),
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      {/* 了解指数 — hero */}
      <div className="text-center mb-12">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          {/* ring progress */}
          <svg className="absolute inset-0 w-32 h-32 -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="58" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
            <circle cx="64" cy="64" r="58" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
              strokeDasharray={`${data.understandingIndex * 3.64} 364`} strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-2">
          {t('growth.index')} <span className="text-primary">{data.understandingIndex}</span>
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">{data.description}</p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {metrics.map(({ icon: Icon, label, value, suffix }) => (
          <div key={label} className="p-4 rounded-xl border bg-card text-center">
            <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{value}<span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span></div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* 画像完整度 */}
      <div className="mb-8 p-5 rounded-xl border bg-card">
        <h3 className="font-semibold mb-3">{t('growth.personaCompleteness')}</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${data.personaCompleteness}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-primary w-10 text-right">{data.personaCompleteness}%</span>
        </div>
      </div>

      {/* 图谱实体 */}
      {data.lifeGraphEntityCount > 0 && (
        <div className="mb-8 p-5 rounded-xl border bg-card">
          <h3 className="font-semibold mb-3">{t('growth.lifeGraph')}</h3>
          <div className="grid grid-cols-5 gap-2 text-center">
            {Object.entries(data.lifeGraphBreakdown).map(([type, count]) => (
              <div key={type} className="p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">{typeLabels[type] || type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 认知冲突（F11.3） */}
      {conflicts.length > 0 && (
        <div className="mb-8 p-5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            {t('growth.conflictsTitle', { count: conflicts.length })}
          </h3>
          <ul className="space-y-2">
            {conflicts.map(c => (
              <li key={c.id} className="text-sm text-muted-foreground pl-2 border-l-2 border-amber-300">
                {c.description}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">{t('growth.conflictsHint')}</p>
        </div>
      )}

      {/* 记忆融合（F11.4） */}
      <div className="mb-8 p-5 rounded-xl border bg-card">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-primary" />
          {t('growth.fusionTitle')}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{t('growth.fusionHint')}</p>
        {fusedCount !== null && (
          <p className="text-sm text-green-600 mb-3">✅ {t('growth.fusionResult', { count: fusedCount })}</p>
        )}
        <button
          onClick={async () => {
            setFusing(true)
            try {
              const res = await fusionApi.run()
              setFusedCount(res.data.data ?? 0)
            } catch { } finally { setFusing(false) }
          }}
          disabled={fusing}
          className="py-2 px-4 rounded-lg border border-border text-sm hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {fusing ? '⏳' : '🔄'} {t('growth.fusionButton')}
        </button>
      </div>
    </div>
  )
}
