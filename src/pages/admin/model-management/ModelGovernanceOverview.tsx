import { Activity, Boxes, GitBranch, Gauge, KeyRound, Server, ShieldAlert, ShieldCheck, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ModelGovernanceTab } from './types'
import type { ModelGovernanceSnapshot } from '../../../lib/api'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui'

interface ModelGovernanceOverviewProps {
  snapshot: ModelGovernanceSnapshot
  activeTab: ModelGovernanceTab
  onTabChange: (tab: ModelGovernanceTab) => void
}
const tabs: Array<{ id: ModelGovernanceTab; icon: typeof Gauge }> = [
  { id: 'overview', icon: Gauge },
  { id: 'models', icon: Boxes },
  { id: 'routes', icon: GitBranch },
  { id: 'activity', icon: Activity },
]

const percent = (value: number): string => `${(value * 100).toFixed(1)}%`

export const ModelGovernanceOverview = ({ snapshot, activeTab, onTabChange }: ModelGovernanceOverviewProps) => {
  const { t } = useTranslation()
  const summary = snapshot.summary
  const healthy = snapshot.runtimeStates.filter((state) => state.available && state.phase !== 'HALF_OPEN').length
  const degraded = snapshot.runtimeStates.filter((state) => state.available && state.phase === 'HALF_OPEN').length
  const down = snapshot.runtimeStates.filter((state) => !state.available).length
  const activeModels = snapshot.models.filter((model) => model.enabled).length

  const stats = [
    { label: t('modelManagement.console.stats.activeModels'), value: activeModels, detail: t('modelManagement.console.stats.ofModels', { count: snapshot.models.length }), icon: Server, tone: 'text-sky-600 dark:text-sky-300' },
    { label: t('modelManagement.console.stats.health'), value: `${healthy}/${Math.max(1, healthy + degraded + down)}`, detail: `${t('modelManagement.console.stats.degraded')} ${degraded} · ${t('modelManagement.console.stats.down')} ${down}`, icon: ShieldCheck, tone: 'text-emerald-600 dark:text-emerald-300' },
    { label: t('modelManagement.console.stats.fallbackRate'), value: percent(summary.fallbackRate), detail: `${summary.fallbackCount} ${t('modelManagement.console.stats.fallbackCalls')}`, icon: Zap, tone: 'text-amber-600 dark:text-amber-300' },
    { label: t('modelManagement.console.stats.latency'), value: `${summary.averageLatencyMs.toFixed(0)} ms`, detail: summary.p95LatencyMs == null ? t('modelManagement.console.stats.p95Pending') : `P95 ${summary.p95LatencyMs.toFixed(0)} ms`, icon: Activity, tone: 'text-violet-600 dark:text-violet-300' },
    { label: t('modelManagement.console.stats.cost'), value: summary.knownCost == null ? t('modelManagement.console.stats.unknown') : `$${summary.knownCost.toFixed(4)}`, detail: t('modelManagement.console.stats.unknownCost', { count: summary.unknownCostCount }), icon: KeyRound, tone: 'text-rose-600 dark:text-rose-300' },
  ]

  return (
    <section className="space-y-5" aria-labelledby="model-governance-heading">
      <div className="border-b border-border/70 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t('modelManagement.console.kicker')}
            </p>
            <h1 id="model-governance-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">
              {t('modelManagement.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t('modelManagement.console.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 font-mono tabular-nums">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t('modelManagement.console.version', { version: snapshot.version })}
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              {t('modelManagement.console.fixedRules')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="min-h-[112px] bg-background p-4 transition-colors hover:bg-muted/30">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                <Icon className={`h-4 w-4 ${stat.tone}`} aria-hidden="true" />
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{stat.detail}</div>
            </div>
          )
        })}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as ModelGovernanceTab)}
        aria-label={t('modelManagement.console.navigation')}
      >
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl border border-border bg-muted/30 p-1">
          {tabs.map(({ id, icon: Icon }) => {
            return (
              <TabsTrigger
                key={id}
                value={id}
                className="h-10 shrink-0 rounded-lg px-3"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(`modelManagement.console.tabs.${id}`)}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
    </section>
  )
}
