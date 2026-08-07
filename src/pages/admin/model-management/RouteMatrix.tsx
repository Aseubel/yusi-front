import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, GitBranch, Plus, XCircle } from 'lucide-react'
import { Badge, Button } from '../../../components/ui'
import type { ModelRuntimeState } from '../../../lib/api'
import { routeKey, type GovernanceDraft, type RouteDraft } from '../../../lib/modelRouting'

interface RouteMatrixProps {
  draft: GovernanceDraft
  runtimeStates: ModelRuntimeState[]
  selectedRouteId: string | null
  onSelect: (routeId: string) => void
  onAdd: () => void
}

export const RouteMatrix = ({ draft, runtimeStates, selectedRouteId, onSelect, onAdd }: RouteMatrixProps) => {
  const { t } = useTranslation()
  const routes = useMemo(() => new Map(draft.routes.map((route) => [routeKey(route.scene), route])), [draft.routes])
  const scenes = [...new Set(draft.routes.map((route) => route.scene))]
  const stateById = useMemo(() => new Map(runtimeStates.map((state) => [state.instanceId, state])), [runtimeStates])

  const getRoute = (scene: string) => routes.get(routeKey(scene))
  const tierHealth = (tierId: string): 'healthy' | 'degraded' | 'down' => {
    const tier = draft.tiers.find((item) => item.id === tierId)
    if (!tier || !tier.members.length) return 'down'
    const states = tier.members.map((id) => stateById.get(id)).filter(Boolean)
    if (states.some((state) => state && state.available && state.phase === 'HALF_OPEN')) return 'degraded'
    if (states.length > 0 && states.every((state) => state && !state.available)) return 'down'
    return 'healthy'
  }

  const routeLabel = (route: RouteDraft): string => route.primaryTier || t('modelManagement.routes.noPrimary')

  return (
    <section className="space-y-5" aria-labelledby="route-matrix-heading">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="route-matrix-heading" className="text-xl font-semibold tracking-tight">{t('modelManagement.routes.matrixTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('modelManagement.routes.matrixSubtitle')}</p>
        </div>
        <Button variant="outline" onClick={onAdd} className="gap-2 self-start"><Plus className="h-4 w-4" aria-hidden="true" />{t('modelManagement.routes.addRoute')}</Button>
      </div>

      {draft.routes.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 border border-dashed border-border text-center text-sm text-muted-foreground"><GitBranch className="h-9 w-9 opacity-40" aria-hidden="true" />{t('modelManagement.routes.empty')}</div>
      ) : (
        <>
          <div className="hidden overflow-hidden border border-border md:block">
            <div className="grid border-b border-border bg-muted/30" style={{ gridTemplateColumns: `repeat(${Math.max(1, scenes.length)}, minmax(150px, 1fr))` }}>
              {scenes.map((scene) => <div key={scene} className="border-l border-border px-4 py-3 text-sm font-semibold">{scene === '*' ? t('modelManagement.routes.wildcard') : scene}</div>)}
            </div>
            <div className="grid border-b border-border last:border-b-0" style={{ gridTemplateColumns: `repeat(${Math.max(1, scenes.length)}, minmax(150px, 1fr))` }}>
              {scenes.map((scene) => {
                const route = getRoute(scene)
                return <RouteCell key={scene} route={route} selected={route?.id === selectedRouteId} health={route ? tierHealth(route.primaryTier) : 'down'} label={route ? routeLabel(route) : t('modelManagement.routes.noRoute')} onClick={() => route && onSelect(route.id)} />
              })}
              </div>
          </div>

          <div className="space-y-3 md:hidden">
            {draft.routes.map((route) => <button key={route.id} type="button" onClick={() => onSelect(route.id)} className={`w-full border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedRouteId === route.id ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/30'}`}><div className="flex items-start justify-between gap-3"><span className="font-mono text-sm font-semibold">{route.scene}</span><HealthMark health={tierHealth(route.primaryTier)} /></div><div className="mt-3 flex items-center justify-between gap-3"><span className="text-sm">{routeLabel(route)}</span><span className="text-xs text-muted-foreground">{t('modelManagement.routes.fallbackCount', { count: route.fallbackTiers.length })}</span></div><div className="mt-2 flex flex-wrap gap-1.5"><Badge variant="outline">{route.riskLevel || 'LOW'}</Badge>{!route.enabled && <Badge variant="outline">{t('modelManagement.registry.disabled')}</Badge>}</div></button>)}
          </div>
        </>
      )}
    </section>
  )
}

const RouteCell = ({ route, selected, health, label, onClick }: { route?: RouteDraft; selected: boolean; health: 'healthy' | 'degraded' | 'down'; label: string; onClick: () => void }) => {
  const { t } = useTranslation()
  return (
    <button type="button" onClick={onClick} disabled={!route} aria-label={route?.scene || label} className={`min-h-[116px] border-l border-border p-4 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selected ? 'bg-primary/10' : route ? 'bg-background hover:bg-muted/30' : 'bg-muted/10'}`}>
      {route ? <><div className="flex items-start justify-between gap-2"><span className="truncate text-sm font-semibold">{label}</span><HealthMark health={health} /></div><div className="mt-3 flex flex-wrap gap-1.5"><Badge variant="outline">{route.riskLevel || 'LOW'}</Badge><span className="text-xs text-muted-foreground">{t('modelManagement.routes.fallbackCount', { count: route.fallbackTiers.length })}</span></div></> : <span className="text-sm text-muted-foreground">{label}</span>}
    </button>
  )
}

const HealthMark = ({ health }: { health: 'healthy' | 'degraded' | 'down' }) => {
  if (health === 'down') return <XCircle className="h-4 w-4 shrink-0 text-rose-500" aria-label="down" />
  if (health === 'degraded') return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-label="degraded" />
  return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-label="healthy" />
}
