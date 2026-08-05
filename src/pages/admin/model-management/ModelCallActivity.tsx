import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, ArrowLeft, ArrowRight, CircleAlert, Clock3, FileSearch, Filter, Loader2, RotateCcw } from 'lucide-react'
import { Badge, Button, Input, Select, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../components/ui'
import { modelApi, type ModelAttemptQuery, type ModelCallTraceItem } from '../../../lib/api'

interface ModelCallActivityProps {
  tiers: string[]
  providers: string[]
}

interface ActivityFilters extends ModelAttemptQuery {
  page: number
  size: number
}

const formatDate = (value: string | null | undefined): string => value ? new Date(value).toLocaleString() : '-'

export const ModelCallActivity = ({ tiers, providers }: ModelCallActivityProps) => {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<ActivityFilters>({ page: 0, size: 20 })
  const [items, setItems] = useState<ModelCallTraceItem[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ModelCallTraceItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await modelApi.getAttempts(filters)
      const page = response.data.data
      setItems(page?.content ?? [])
      setTotalElements(page?.totalElements ?? 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const updateFilter = <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => setFilters((current) => ({ ...current, [key]: value, ...(key === 'page' ? {} : { page: 0 }) }))
  const pageCount = Math.max(1, Math.ceil(totalElements / filters.size))
  const currentPage = filters.page + 1

  return (
    <section className="space-y-4" aria-labelledby="model-activity-heading">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h2 id="model-activity-heading" className="flex items-center gap-2 text-lg font-semibold"><Activity className="h-5 w-5 text-primary" aria-hidden="true" />{t('modelManagement.activity.title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('modelManagement.activity.subtitle')}</p></div><Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label={t('common.refresh')} title={t('common.refresh')}><RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /></Button></div>
      <div className="grid gap-2 border-y border-border py-3 sm:grid-cols-2 lg:grid-cols-4"><Input value={filters.scene ?? ''} onChange={(event) => updateFilter('scene', event.target.value || undefined)} placeholder={t('modelManagement.activity.sceneFilter')} /><Select value={filters.modelTier ?? 'ALL'} onValueChange={(value) => updateFilter('modelTier', value === 'ALL' ? undefined : value)} options={[{ value: 'ALL', label: t('modelManagement.health.allTiers') }, ...tiers.map((tier) => ({ value: tier, label: tier }))]} /><Select value={filters.provider ?? 'ALL'} onValueChange={(value) => updateFilter('provider', value === 'ALL' ? undefined : value)} options={[{ value: 'ALL', label: t('modelManagement.health.allProviders') }, ...providers.map((provider) => ({ value: provider, label: provider }))]} /><Select value={filters.fallbackUsed == null ? 'ALL' : String(filters.fallbackUsed)} onValueChange={(value) => updateFilter('fallbackUsed', value === 'ALL' ? undefined : value === 'true')} options={[{ value: 'ALL', label: t('modelManagement.activity.allAttempts') }, { value: 'true', label: t('modelManagement.activity.fallbackOnly') }, { value: 'false', label: t('modelManagement.activity.primaryOnly') }]} /><Input type="datetime-local" value={filters.from ?? ''} onChange={(event) => updateFilter('from', event.target.value || undefined)} aria-label={t('modelManagement.activity.from')} /><Input type="datetime-local" value={filters.to ?? ''} onChange={(event) => updateFilter('to', event.target.value || undefined)} aria-label={t('modelManagement.activity.to')} /></div>

      <div className="overflow-hidden border border-border bg-background"><div className="hidden grid-cols-[150px_minmax(110px,0.8fr)_minmax(145px,1fr)_100px_100px_110px_110px] gap-3 border-b border-border bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid"><span>{t('modelManagement.activity.time')}</span><span>{t('modelManagement.activity.scene')}</span><span>{t('modelManagement.activity.model')}</span><span>{t('modelManagement.activity.tier')}</span><span>{t('modelManagement.activity.status')}</span><span>{t('modelManagement.activity.latency')}</span><span>{t('modelManagement.activity.usage')}</span></div>{loading ? <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-label={t('modelManagement.activity.loading')} /></div> : items.map((item) => <button key={item.attemptId} type="button" onClick={() => setSelected(item)} className="grid w-full gap-3 border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:grid-cols-[150px_minmax(110px,0.8fr)_minmax(145px,1fr)_100px_100px_110px_110px] lg:items-center"><span className="text-xs tabular-nums text-muted-foreground">{formatDate(item.createdAt)}</span><span className="text-sm font-medium">{item.scene}</span><span className="min-w-0"><span className="block truncate font-mono text-sm">{item.modelId || '-'}</span><span className="block truncate text-xs text-muted-foreground">{item.provider || '-'}</span></span><span className="font-mono text-xs text-muted-foreground">{item.selectedTier || item.primaryTier || '-'}</span><span><Badge variant={item.status === 'SUCCESS' || item.status === 'COMPLETED' ? 'secondary' : 'destructive'}>{item.fallbackUsed ? t('modelManagement.activity.fallback') : item.status}</Badge></span><span className="flex items-center gap-1 text-sm tabular-nums"><Clock3 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />{item.latencyMs == null ? '-' : `${item.latencyMs} ms`}</span><span className="text-xs tabular-nums text-muted-foreground">{item.inputTokens ?? 0} → {item.outputTokens ?? 0}</span></button>)}{!loading && !items.length && <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><Filter className="h-4 w-4" aria-hidden="true" />{t('modelManagement.activity.empty')}</div>}</div>

      {totalElements > 0 && <div className="flex items-center justify-center gap-3"><Button variant="outline" size="icon" onClick={() => updateFilter('page', Math.max(0, filters.page - 1))} disabled={filters.page === 0 || loading} aria-label={t('modelManagement.activity.previous')} title={t('modelManagement.activity.previous')}><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button><span className="text-sm tabular-nums text-muted-foreground">{currentPage} / {pageCount}</span><Button variant="outline" size="icon" onClick={() => updateFilter('page', Math.min(pageCount - 1, filters.page + 1))} disabled={filters.page >= pageCount - 1 || loading} aria-label={t('modelManagement.activity.next')} title={t('modelManagement.activity.next')}><ArrowRight className="h-4 w-4" aria-hidden="true" /></Button></div>}

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}><SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">{selected && <><SheetHeader><SheetTitle className="flex items-center gap-2"><FileSearch className="h-5 w-5 text-primary" aria-hidden="true" />{t('modelManagement.activity.detailTitle')}</SheetTitle><SheetDescription>{t('modelManagement.activity.detailDescription')}</SheetDescription></SheetHeader><div className="mt-6 space-y-5"><div className="flex flex-wrap gap-2"><Badge variant={selected.status === 'SUCCESS' || selected.status === 'COMPLETED' ? 'secondary' : 'destructive'}>{selected.status}</Badge>{selected.fallbackUsed && <Badge variant="outline">{t('modelManagement.activity.fallback')}</Badge>}</div><dl className="grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2"><Detail label={t('modelManagement.activity.time')} value={formatDate(selected.createdAt)} /><Detail label={t('modelManagement.activity.scene')} value={selected.scene} /><Detail label={t('modelManagement.activity.tier')} value={selected.selectedTier || selected.primaryTier || '-'} /><Detail label={t('modelManagement.activity.model')} value={`${selected.provider || '-'} / ${selected.modelId || '-'}`} /><Detail label={t('modelManagement.activity.latency')} value={selected.latencyMs == null ? '-' : `${selected.latencyMs} ms`} /><Detail label={t('modelManagement.activity.usage')} value={`${selected.inputTokens ?? 0} input · ${selected.outputTokens ?? 0} output`} /><Detail label={t('modelManagement.activity.cost')} value={selected.cost == null ? t('modelManagement.console.stats.unknown') : String(selected.cost)} /><Detail label={t('modelManagement.activity.errorCode')} value={selected.errorCode || '-'} /></dl><div><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('modelManagement.activity.routeReason')}</span><p className="mt-2 break-words font-mono text-xs leading-5">{selected.routeReason || '-'}</p></div>{selected.errorCode && <div className="flex gap-2 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{selected.errorCode}</div>}</div></>}</SheetContent></Sheet>
    </section>
  )
}

const Detail = ({ label, value }: { label: string; value: string }) => <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>
