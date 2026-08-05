import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowRight, CheckCircle2, CircleX, GitBranch, Loader2, Route, Server } from 'lucide-react'
import { Badge } from '../../../components/ui'
import type { ModelRoutePreview } from '../../../lib/api'

interface RoutePreviewProps {
  preview: ModelRoutePreview | null
  loading: boolean
  stale: boolean
}

export const RoutePreview = ({ preview, loading, stale }: RoutePreviewProps) => {
  const { t } = useTranslation()
  return (
    <section className="space-y-4 border border-border bg-muted/10 p-4 md:p-5" aria-labelledby="route-preview-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="route-preview-heading" className="flex items-center gap-2 text-base font-semibold"><Route className="h-4 w-4 text-primary" aria-hidden="true" />{t('modelManagement.preview.title')}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{stale ? t('modelManagement.preview.stale') : t('modelManagement.preview.description')}</p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label={t('modelManagement.preview.loading')} />}
      </div>

      {!preview && !loading && <div className="flex min-h-28 items-center justify-center border border-dashed border-border text-sm text-muted-foreground"><GitBranch className="mr-2 h-4 w-4 opacity-50" aria-hidden="true" />{t('modelManagement.preview.empty')}</div>}

      {preview && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs" aria-label={t('modelManagement.preview.chainLabel')}>
            <ChainNode label={t('modelManagement.preview.request')} value={t('modelManagement.preview.requestValue')} />
            <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <ChainNode label={t('modelManagement.preview.policy')} value={preview.policyId} />
            <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <ChainNode label={t('modelManagement.preview.primaryTier')} value={preview.primaryTier} accent />
          </div>

          <div className="space-y-2">
            {preview.candidates.map((candidate, index) => {
              const unavailable = !candidate.available && candidate.excludedReason !== 'fallback-tier'
              return <div key={`${candidate.tierId}-${candidate.modelId}-${index}`} className={`grid gap-2 border p-3 sm:grid-cols-[minmax(110px,0.7fr)_minmax(140px,1fr)_minmax(160px,1.3fr)] sm:items-center ${unavailable ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20' : 'border-border bg-background'}`}>
                <div className="flex items-center gap-2 text-xs font-semibold"><span className="font-mono text-muted-foreground">{index + 1}</span><span>{candidate.tierId}</span></div>
                <div className="flex min-w-0 items-center gap-2"><Server className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" /><span className="truncate font-mono text-sm">{candidate.modelId}</span></div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{candidate.provider || t('modelManagement.registry.unsupportedProvider')}</span>{candidate.modelName && <span className="truncate">{candidate.modelName}</span>}{unavailable ? <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-300"><CircleX className="h-3.5 w-3.5" aria-hidden="true" />{candidate.excludedReason}</span> : candidate.excludedReason === 'fallback-tier' ? <Badge variant="outline">{t('modelManagement.preview.fallbackCandidate')}</Badge> : <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{t('modelManagement.preview.available')}</span>}</div>
              </div>
            })}
          </div>

          <div className="grid gap-3 border-t border-border pt-3 md:grid-cols-[1.4fr_1fr]">
            <div><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('modelManagement.preview.routeReason')}</span><p className="mt-1 break-words font-mono text-xs leading-5 text-foreground/80">{preview.routeReason}</p></div>
            <div><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('modelManagement.preview.warnings')}</span>{preview.warnings.length ? <ul className="mt-1 space-y-1 text-xs text-amber-700 dark:text-amber-300">{preview.warnings.map((warning) => <li key={warning} className="flex gap-1.5"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{warning}</li>)}</ul> : <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">{t('modelManagement.preview.noWarnings')}</p>}</div>
          </div>
        </>
      )}
    </section>
  )
}

const ChainNode = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => <span className={`inline-flex min-h-10 flex-col justify-center border px-3 py-1.5 ${accent ? 'border-primary/40 bg-primary/10' : 'border-border bg-background'}`}><span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</span><span className="max-w-[180px] truncate font-mono text-xs font-semibold">{value}</span></span>
