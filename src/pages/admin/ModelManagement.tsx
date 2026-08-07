import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Copy, Download, FileJson, Loader2, RefreshCw, Save, SlidersHorizontal } from 'lucide-react'
import { Button } from '../../components/ui'
import { toast } from 'sonner'
import { modelApi, type ModelGovernanceSnapshot, type ModelMetricSummary, type ModelRoutePreview, type ModelRuntimeState } from '../../lib/api'
import { createGovernanceDraft, createRouteDraft, isDraftDirty, toUpdateRequest, validateGovernanceDraft, type GovernanceDraft, type RouteDraft } from '../../lib/modelRouting'
import { ModelGovernanceOverview } from './model-management/ModelGovernanceOverview'
import { ModelRegistryPanel } from './model-management/ModelRegistryPanel'
import { ModelCallActivity } from './model-management/ModelCallActivity'
import { RouteList } from './model-management/RouteList'
import { RoutePolicyEditor } from './model-management/RoutePolicyEditor'
import { RoutePreview } from './model-management/RoutePreview'
import { RuntimeHealthPanel } from './model-management/RuntimeHealthPanel'
import type { ModelGovernanceTab } from './model-management/types'

interface ConflictState {
  server: ModelGovernanceSnapshot
}

const emptyMetrics: ModelMetricSummary = {
  routeCount: 0,
  fallbackCount: 0,
  fallbackRate: 0,
  successRate: 0,
  averageLatencyMs: 0,
  p95LatencyMs: null,
  rateLimitedCount: 0,
  errorCount: 0,
  inputTokens: 0,
  outputTokens: 0,
  knownCost: 0,
  unknownCostCount: 0,
}

export const ModelManagement = () => {
  const { t } = useTranslation()
  const [snapshot, setSnapshot] = useState<ModelGovernanceSnapshot | null>(null)
  const [draft, setDraft] = useState<GovernanceDraft | null>(null)
  const [runtimeStates, setRuntimeStates] = useState<ModelRuntimeState[]>([])
  const [metrics, setMetrics] = useState<ModelMetricSummary>(emptyMetrics)
  const [activeTab, setActiveTab] = useState<ModelGovernanceTab>('overview')
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [preview, setPreview] = useState<ModelRoutePreview | null>(null)
  const [previewSignature, setPreviewSignature] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [runtimeLoading, setRuntimeLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<ConflictState | null>(null)

  const loadConsole = useCallback(async (replaceDraft = true) => {
    setLoading(true)
    setError(null)
    try {
      const response = await modelApi.getConsole()
      const nextSnapshot = response.data.data
      if (!nextSnapshot) throw new Error(t('modelManagement.console.noSnapshot'))
      setSnapshot(nextSnapshot)
      setRuntimeStates(nextSnapshot.runtimeStates ?? [])
      setMetrics(nextSnapshot.summary ?? emptyMetrics)
      if (replaceDraft) {
        const nextDraft = createGovernanceDraft(nextSnapshot)
        setDraft(nextDraft)
        setSelectedRouteId((current) => current && nextDraft.routes.some((route) => route.id === current) ? current : nextDraft.routes[0]?.id ?? null)
        setPreview(null)
        setPreviewSignature('')
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('modelManagement.loadConfigFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const refreshRuntime = useCallback(async () => {
    setRuntimeLoading(true)
    try {
      const [statesResponse, metricsResponse] = await Promise.all([modelApi.states(), modelApi.getMetrics()])
      const states = statesResponse.data.data ?? []
      const nextMetrics = metricsResponse.data.data ?? emptyMetrics
      setRuntimeStates(states)
      setMetrics(nextMetrics)
      setSnapshot((current) => current ? { ...current, runtimeStates: states, summary: nextMetrics } : current)
    } catch {
      toast.error(t('modelManagement.health.refreshFailed'))
    } finally {
      setRuntimeLoading(false)
    }
  }, [t])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadConsole() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadConsole])
  const snapshotVersion = snapshot?.version
  useEffect(() => {
    if (snapshotVersion == null) return
    const timer = window.setTimeout(() => { void refreshRuntime() }, 0)
    return () => window.clearTimeout(timer)
  }, [refreshRuntime, snapshotVersion])

  const isDirty = Boolean(snapshot && draft && isDraftDirty(draft, snapshot))
  const validationErrors = draft ? validateGovernanceDraft(draft) : []
  const selectedRoute = draft?.routes.find((route) => route.id === selectedRouteId) ?? null
  const previewIsStale = Boolean(preview && selectedRoute && JSON.stringify(selectedRoute) !== previewSignature)
  const providers = useMemo(() => draft ? [...new Set(draft.models.map((model) => model.provider).filter(Boolean))] as string[] : [], [draft])

  const save = async () => {
    if (!draft || !isDirty || validationErrors.length) return
    setSaving(true)
    try {
      await modelApi.updateConsole(toUpdateRequest(draft))
      toast.success(t('modelManagement.console.saved'))
      setConflict(null)
      await loadConsole(true)
    } catch (saveError) {
      if (isConflict(saveError)) {
        try {
          const response = await modelApi.getConsole()
          if (response.data.data) setConflict({ server: response.data.data })
        } catch {
          // Keep the local draft visible even when the conflict snapshot cannot be fetched.
        }
        toast.error(t('modelManagement.console.conflict'))
      } else {
        toast.error(saveError instanceof Error ? saveError.message : t('modelManagement.console.saveFailed'))
      }
    } finally {
      setSaving(false)
    }
  }

  const previewRoute = async (route: RouteDraft) => {
    setPreviewSignature(JSON.stringify(route))
    setPreviewLoading(true)
    try {
      const response = await modelApi.previewRoute({
        scene: route.scene,
        riskLevel: route.riskLevel,
        estimatedInputTokens: route.maxInputTokens ?? undefined,
        reservedOutputTokens: route.maxOutputTokens ?? undefined,
      })
      setPreview(response.data.data ?? null)
    } catch {
      toast.error(t('modelManagement.preview.failed'))
    } finally {
      setPreviewLoading(false)
    }
  }

  const addRoute = () => {
    if (!draft) return
    const used = new Set(draft.routes.map((route) => route.id))
    let index = draft.routes.length + 1
    let id = `route-${index}`
    while (used.has(id)) { index += 1; id = `route-${index}` }
    const route = createRouteDraft({ id, scene: draft.defaultScene || 'chat', primaryTier: draft.defaultTier || draft.tiers[0]?.id || '' })
    const next = { ...draft, routes: [...draft.routes, route] }
    setDraft(next)
    setSelectedRouteId(route.id)
    setActiveTab('routes')
  }

  const exportDraft = () => {
    if (!draft) return
    const payload = JSON.stringify(toUpdateRequest(draft), null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `model-governance-v${draft.version}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success(t('modelManagement.advanced.exported'))
  }

  const copyDraft = async () => {
    if (!draft) return
    await navigator.clipboard.writeText(JSON.stringify(toUpdateRequest(draft), null, 2))
    toast.success(t('modelManagement.advanced.copied'))
  }

  if (loading && !draft) return <div className="flex min-h-96 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" aria-label={t('modelManagement.console.loading')} /></div>
  if (!draft || !snapshot) return <div className="space-y-4 border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200"><p>{error || t('modelManagement.console.noSnapshot')}</p><Button variant="outline" onClick={() => void loadConsole()} className="gap-2"><RefreshCw className="h-4 w-4" aria-hidden="true" />{t('common.refresh')}</Button></div>

  return (
    <div className="space-y-6 pb-8">
      <ModelGovernanceOverview snapshot={{ ...snapshot, runtimeStates, summary: metrics }} activeTab={activeTab} onTabChange={setActiveTab} />

      {error && <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}
      {conflict && <div className="flex flex-col gap-3 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/20 dark:text-amber-200 md:flex-row md:items-center md:justify-between"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{t('modelManagement.console.conflictDescription', { version: conflict.server.version })}</span></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => { const nextDraft = createGovernanceDraft(conflict.server); setSnapshot(conflict.server); setRuntimeStates(conflict.server.runtimeStates ?? []); setMetrics(conflict.server.summary ?? emptyMetrics); setDraft(nextDraft); setConflict(null) }}>{t('modelManagement.console.reloadServer')}</Button><Button variant="ghost" size="sm" onClick={() => setConflict(null)}>{t('modelManagement.console.keepDraft')}</Button></div></div>}

      {activeTab === 'overview' && <RuntimeHealthPanel draft={draft} states={runtimeStates} />}
      {activeTab === 'models' && <ModelRegistryPanel draft={draft} runtimeStates={runtimeStates} onChange={setDraft} />}
      {activeTab === 'routes' && <div className="space-y-6"><RouteList draft={draft} runtimeStates={runtimeStates} selectedRouteId={selectedRouteId} onSelect={setSelectedRouteId} onAdd={addRoute} />{selectedRoute && <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]"><RoutePolicyEditor route={selectedRoute} tiers={draft.tiers} models={draft.models} onChange={(route) => setDraft({ ...draft, routes: draft.routes.map((item) => item.id === route.id ? route : item) })} onTierStrategyChange={(tierId, strategy) => setDraft({ ...draft, tiers: draft.tiers.map((tier) => tier.id === tierId ? { ...tier, strategy } : tier) })} onPreview={previewRoute} /><RoutePreview preview={preview} loading={previewLoading} stale={previewIsStale} /></div>}</div>}
      {activeTab === 'activity' && <ModelCallActivity tiers={draft.tiers.map((tier) => tier.id)} providers={providers} />}

      <section className="border-t border-border pt-4" aria-label={t('modelManagement.advanced.title')}>
        <Button variant="ghost" type="button" onClick={() => setAdvancedOpen((open) => !open)} aria-expanded={advancedOpen} className="h-auto min-h-11 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:text-foreground active:scale-100"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{t('modelManagement.advanced.toggle')}</Button>
        {advancedOpen && <div className="mt-3 border border-border bg-muted/10 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="flex items-center gap-2 text-sm font-semibold"><FileJson className="h-4 w-4 text-primary" aria-hidden="true" />{t('modelManagement.advanced.title')}</h3><p className="mt-1 text-xs text-muted-foreground">{t('modelManagement.advanced.description')}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void copyDraft()} className="gap-2"><Copy className="h-4 w-4" aria-hidden="true" />{t('modelManagement.advanced.copy')}</Button><Button variant="outline" size="sm" onClick={exportDraft} className="gap-2"><Download className="h-4 w-4" aria-hidden="true" />{t('modelManagement.advanced.export')}</Button></div></div><pre className="mt-4 max-h-80 overflow-auto border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">{JSON.stringify(toUpdateRequest(draft), null, 2)}</pre></div>}
      </section>

      <div className="sticky bottom-3 z-20 flex flex-col gap-3 border border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className={`h-2 w-2 rounded-full ${isDirty ? 'bg-amber-500' : 'bg-emerald-500'}`} />{isDirty ? t('modelManagement.console.unsaved') : t('modelManagement.console.synced')}<span className="font-mono">v{draft.version}</span>{validationErrors.length > 0 && <span className="text-rose-600 dark:text-rose-300">{t('modelManagement.console.validationCount', { count: validationErrors.length })}</span>}</div><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => void Promise.all([loadConsole(true), refreshRuntime()])} disabled={loading || runtimeLoading} className="gap-2"><RefreshCw className={`h-4 w-4 ${loading || runtimeLoading ? 'animate-spin' : ''}`} aria-hidden="true" />{t('common.refresh')}</Button><Button onClick={() => void save()} disabled={!isDirty || validationErrors.length > 0 || saving} isLoading={saving} className="gap-2"><Save className="h-4 w-4" aria-hidden="true" />{t('common.save')}</Button></div></div>
    </div>
  )
}

const isConflict = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false
  const error = value as { response?: { status?: number }; message?: string }
  return error.response?.status === 409 || error.message?.includes('过期') === true || error.message?.toLowerCase().includes('conflict') === true
}
