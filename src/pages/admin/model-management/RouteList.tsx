import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, GitBranch, ListFilter, Plus, Route, Search, XCircle } from 'lucide-react'
import { Badge, Button, Input, Select } from '../../../components/ui'
import type { ModelRuntimeState } from '../../../lib/api'
import type { GovernanceDraft, RouteDraft } from '../../../lib/modelRouting'

interface RouteListProps {
  draft: GovernanceDraft
  runtimeStates: ModelRuntimeState[]
  selectedRouteId: string | null
  onSelect: (routeId: string) => void
  onAdd: () => void
}

type RouteHealth = 'healthy' | 'degraded' | 'down'

export const RouteList = ({ draft, runtimeStates, selectedRouteId, onSelect, onAdd }: RouteListProps) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const stateById = useMemo(() => new Map(runtimeStates.map((state) => [state.instanceId, state])), [runtimeStates])
  const enabledCount = draft.routes.filter((route) => route.enabled).length
  const fallbackCount = draft.routes.reduce((total, route) => total + route.fallbackTiers.length, 0)
  const visibleRoutes = useMemo(() => {
    const query = search.trim().toLowerCase()
    return draft.routes.filter((route) => {
      const matchesQuery = !query || [route.scene, route.id, route.primaryTier, ...route.fallbackTiers]
        .some((value) => value.toLowerCase().includes(query))
      const matchesStatus = status === 'ALL' || (status === 'ENABLED' ? route.enabled : !route.enabled)
      return matchesQuery && matchesStatus
    })
  }, [draft.routes, search, status])

  const tierHealth = (tierId: string): RouteHealth => {
    const tier = draft.tiers.find((item) => item.id === tierId)
    if (!tier || !tier.members.length) return 'down'
    const states = tier.members.map((id) => stateById.get(id)).filter(Boolean)
    if (states.some((state) => state && state.available && state.phase === 'HALF_OPEN')) return 'degraded'
    if (states.length > 0 && states.every((state) => state && !state.available)) return 'down'
    return 'healthy'
  }

  return (
    <section className="space-y-5" aria-labelledby="route-list-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Route className="h-3.5 w-3.5" aria-hidden="true" />
            {t('modelManagement.routes.kicker')}
          </p>
          <h2 id="route-list-heading" className="text-xl font-semibold tracking-tight">{t('modelManagement.routes.listTitle')}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{t('modelManagement.routes.listSubtitle')}</p>
        </div>
        <Button variant="outline" onClick={onAdd} className="gap-2 self-start lg:self-auto">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('modelManagement.routes.addRoute')}
        </Button>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
        <RouteStat label={t('modelManagement.routes.totalRoutes')} value={draft.routes.length} detail={t('modelManagement.routes.totalRoutesDetail')} />
        <RouteStat label={t('modelManagement.routes.enabledRoutes')} value={enabledCount} detail={t('modelManagement.routes.enabledRoutesDetail')} tone="text-emerald-600 dark:text-emerald-300" />
        <RouteStat label={t('modelManagement.routes.fallbacks')} value={fallbackCount} detail={t('modelManagement.routes.fallbacksDetail')} tone="text-amber-600 dark:text-amber-300" />
      </div>

      <div className="flex flex-col gap-3 border-y border-border py-3 md:flex-row">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">{t('modelManagement.routes.search')}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('modelManagement.routes.search')} className="pl-9" />
        </label>
        <Select value={status} onValueChange={setStatus} options={[
          { value: 'ALL', label: t('modelManagement.routes.allStatuses') },
          { value: 'ENABLED', label: t('modelManagement.routes.enabled') },
          { value: 'DISABLED', label: t('modelManagement.registry.disabled') },
        ]} />
      </div>

      {draft.routes.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/10 text-center text-sm text-muted-foreground">
          <GitBranch className="h-9 w-9 opacity-40" aria-hidden="true" />
          {t('modelManagement.routes.empty')}
        </div>
      ) : !visibleRoutes.length ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/10 text-center text-sm text-muted-foreground">
          <ListFilter className="h-9 w-9 opacity-40" aria-hidden="true" />
          {t('modelManagement.routes.filteredEmpty')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/30" role="list" aria-label={t('modelManagement.routes.listTitle')}>
          <div className="hidden grid-cols-[minmax(220px,1.35fr)_minmax(150px,0.9fr)_minmax(150px,0.9fr)_120px_32px] gap-4 border-b border-border bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid">
            <span>{t('modelManagement.routes.scene')}</span>
            <span>{t('modelManagement.routes.primaryTier')}</span>
            <span>{t('modelManagement.routes.fallbackTiers')}</span>
            <span>{t('modelManagement.routes.health')}</span>
            <span />
          </div>
          {visibleRoutes.map((route) => (
            <RouteRow
              key={route.id}
              route={route}
              selected={route.id === selectedRouteId}
              health={tierHealth(route.primaryTier)}
              onSelect={() => onSelect(route.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

const RouteStat = ({ label, value, detail, tone = 'text-foreground' }: { label: string; value: number; detail: string; tone?: string }) => (
  <div className="min-h-[92px] bg-background px-4 py-3">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className={`mt-2 text-2xl font-semibold tabular-nums ${tone}`}>{value}</div>
    <div className="mt-0.5 text-xs text-muted-foreground">{detail}</div>
  </div>
)

const RouteRow = ({ route, selected, health, onSelect }: { route: RouteDraft; selected: boolean; health: RouteHealth; onSelect: () => void }) => {
  const { t } = useTranslation()
  const healthLabel = health === 'healthy' ? t('modelManagement.routes.healthy') : health === 'degraded' ? t('modelManagement.routes.degraded') : t('modelManagement.routes.down')
  const HealthIcon = health === 'healthy' ? CheckCircle2 : health === 'degraded' ? AlertTriangle : XCircle
  const sceneLabel = route.scene === '*' ? t('modelManagement.routes.wildcard') : route.scene

  return (
    <div role="listitem" className={`border-b border-border last:border-b-0 ${selected ? 'bg-primary/[0.045]' : 'bg-background/70'}`}>
      <Button
        variant="ghost"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className="group h-auto min-h-[92px] w-full justify-start rounded-none px-4 py-4 text-left active:scale-100 hover:bg-muted/30"
      >
        <span className="grid w-full gap-3 lg:grid-cols-[minmax(220px,1.35fr)_minmax(150px,0.9fr)_minmax(150px,0.9fr)_120px_32px] lg:items-center lg:gap-4">
          <span className="flex min-w-0 items-start gap-3">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${route.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} aria-hidden="true" />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold text-foreground">{sceneLabel}</span>
                {route.scene === '*' && <Badge variant="outline">{t('modelManagement.routes.wildcard')}</Badge>}
                {!route.enabled && <Badge variant="outline">{t('modelManagement.registry.disabled')}</Badge>}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono">{route.id}</span>
                <span aria-hidden="true" className="text-border">/</span>
                <span>{t('modelManagement.routes.priorityValue', { value: route.priority })}</span>
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2 text-sm lg:block">
            <span className="text-xs text-muted-foreground lg:hidden">{t('modelManagement.routes.primaryTier')}:</span>
            <span className="font-mono font-medium">{route.primaryTier || t('modelManagement.routes.noPrimary')}</span>
          </span>
          <span className="flex items-center gap-2 text-sm lg:block">
            <span className="text-xs text-muted-foreground lg:hidden">{t('modelManagement.routes.fallbackTiers')}:</span>
            <span className="text-muted-foreground">{route.fallbackTiers.length ? t('modelManagement.routes.fallbackCount', { count: route.fallbackTiers.length }) : t('modelManagement.routes.noFallback')}</span>
          </span>
          <span className="flex items-center gap-2 text-sm">
            <HealthIcon className={`h-4 w-4 shrink-0 ${health === 'healthy' ? 'text-emerald-500' : health === 'degraded' ? 'text-amber-500' : 'text-rose-500'}`} aria-hidden="true" />
            <span className="text-muted-foreground">{healthLabel}</span>
          </span>
          <ArrowRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 lg:block" aria-hidden="true" />
        </span>
      </Button>
    </div>
  )
}
