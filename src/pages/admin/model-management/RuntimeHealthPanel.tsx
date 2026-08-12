import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, AlertTriangle, CheckCircle2, Clock3, Filter, Server, XCircle } from 'lucide-react'
import { Badge, Select } from '../../../components/ui'
import type { ModelRuntimeState } from '../../../lib/api'
import type { GovernanceDraft } from '../../../lib/modelRouting'

interface RuntimeHealthPanelProps {
  draft: GovernanceDraft
  states: ModelRuntimeState[]
}

export const RuntimeHealthPanel = ({ draft, states }: RuntimeHealthPanelProps) => {
  const { t } = useTranslation()
  const [tierFilter, setTierFilter] = useState('ALL')
  const [providerFilter, setProviderFilter] = useState('ALL')
  const modelById = useMemo(() => new Map(draft.models.map((model) => [model.id, model])), [draft.models])
  const providerOptions = [...new Set(draft.models.map((model) => model.provider).filter(Boolean))] as string[]
  const filtered = states.filter((state) => {
    const model = modelById.get(state.instanceId)
    const inTier = tierFilter === 'ALL' || draft.tiers.some((tier) => tier.id === tierFilter && tier.members.includes(state.instanceId))
    return inTier && (providerFilter === 'ALL' || model?.provider === providerFilter)
  })
  const tierFor = (modelId: string) => draft.tiers.filter((tier) => tier.members.includes(modelId)).map((tier) => tier.id).join(', ') || '-'
  const phaseLabel = (state: ModelRuntimeState) => state.phase === 'UP' ? t('modelManagement.health.up') : state.phase === 'HALF_OPEN' ? t('modelManagement.health.halfOpen') : t('modelManagement.health.down')

  return (
    <section className="space-y-4" aria-labelledby="runtime-health-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="runtime-health-heading" className="flex items-center gap-2 text-lg font-semibold"><Activity className="h-5 w-5 text-primary" aria-hidden="true" />{t('modelManagement.health.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('modelManagement.health.subtitle')}</p>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
          <Select value={tierFilter} onValueChange={setTierFilter} options={[{ value: 'ALL', label: t('modelManagement.health.allTiers') }, ...draft.tiers.map((tier) => ({ value: tier.id, label: tier.id }))]} />
          <Select value={providerFilter} onValueChange={setProviderFilter} options={[{ value: 'ALL', label: t('modelManagement.health.allProviders') }, ...providerOptions.map((provider) => ({ value: provider, label: provider }))]} />
        </div>
      </div>

      <div className="overflow-hidden border border-border bg-background">
        <div className="hidden grid-cols-[minmax(180px,1.2fr)_130px_minmax(150px,1fr)_105px_100px_120px_1.4fr] gap-3 border-b border-border bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid">
          <span>{t('modelManagement.health.instance')}</span><span>{t('modelManagement.registry.provider')}</span><span>{t('modelManagement.health.tier')}</span><span>{t('modelManagement.health.phase')}</span><span>{t('modelManagement.health.latency')}</span><span>{t('modelManagement.health.errorRate')}</span><span>{t('modelManagement.health.lastError')}</span>
        </div>
        {filtered.map((state) => {
          const model = modelById.get(state.instanceId)
          const down = !state.available
          const halfOpen = state.phase === 'HALF_OPEN'
          return (
            <div key={state.instanceId} className="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(180px,1.2fr)_130px_minmax(150px,1fr)_105px_100px_120px_1.4fr] lg:items-center lg:gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${down ? 'bg-rose-500' : halfOpen ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div className="min-w-0"><div className="truncate font-mono text-sm font-semibold">{state.instanceId}</div><div className="truncate text-xs text-muted-foreground">{state.modelName || model?.realModelId || '-'}</div></div>
              </div>
              <MobileMetric label={t('modelManagement.registry.provider')} value={model?.provider || '-'} />
              <MobileMetric label={t('modelManagement.health.tier')} value={tierFor(state.instanceId)} mono />
              <div className="flex items-center justify-between gap-3 lg:block"><span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground lg:hidden">{t('modelManagement.health.phase')}</span><Badge variant={down ? 'destructive' : halfOpen ? 'outline' : 'secondary'}>{phaseLabel(state)}</Badge></div>
              <div className="flex items-center justify-between gap-3 text-sm tabular-nums lg:justify-start"><span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground lg:hidden">{t('modelManagement.health.latency')}</span><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />{state.avgLatencyMs.toFixed(0)} ms</span></div>
              <MobileMetric label={t('modelManagement.health.errorRate')} value={`${(state.errorRate * 100).toFixed(1)}%`} mono />
              <MobileMetric label={t('modelManagement.health.lastError')} value={state.lastError || t('modelManagement.health.noError')} className="break-words lg:truncate" />
            </div>
          )
        })}
        {!filtered.length && <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground"><Filter className="h-4 w-4" aria-hidden="true" />{t('modelManagement.health.empty')}</div>}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />{t('modelManagement.health.up')}</span><span className="inline-flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />{t('modelManagement.health.halfOpen')}</span><span className="inline-flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />{t('modelManagement.health.down')}</span><span className="inline-flex items-center gap-1.5"><Server className="h-3.5 w-3.5" aria-hidden="true" />{t('modelManagement.health.runtimeCount', { count: filtered.length })}</span></div>
    </section>
  )
}

const MobileMetric = ({ label, value, mono = false, className = '' }: { label: string; value: string; mono?: boolean; className?: string }) => (
  <div className="flex min-w-0 items-start justify-between gap-3 text-sm lg:block">
    <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted-foreground lg:hidden">{label}</span>
    <span className={`${mono ? 'font-mono text-xs' : 'text-muted-foreground'} min-w-0 text-right lg:text-left ${className}`}>{value}</span>
  </div>
)
