import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarClock,
  Database,
  Eye,
  EyeOff,
  Link2,
  RefreshCw,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Input,
} from '../../components/ui'
import {
  lifeGraphMemoryApi,
  type LifeGraphMemoryItem,
  type LifeGraphMemoryResponse,
  type UpdateLifeGraphMemoryRequest,
} from '../../lib/api'
import { canUseForMatching, formatPercent } from '../../lib/memoryCenter'

const emptyResponse: LifeGraphMemoryResponse = {
  entities: [],
  activeCount: 0,
  hiddenCount: 0,
  expiredCount: 0,
  matchableCount: 0,
}

const formatDateTime = (value: string | null | undefined, locale: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatDateInput = (value: string | null | undefined) => value ? value.slice(0, 10) : ''

const statusStyles: Record<LifeGraphMemoryItem['lifecycleStatus'], string> = {
  ACTIVE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  HIDDEN: 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300',
  EXPIRED: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
}

function IconButton({
  label,
  children,
  onClick,
  disabled = false,
  destructive = false,
}: {
  label: string
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:h-9 sm:w-9 ${
        destructive
          ? 'border-destructive/20 text-destructive hover:bg-destructive/10'
          : 'border-border/70 text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary'
      }`}
    >
      {children}
    </button>
  )
}

export function LifeGraphMemoryPanel() {
  const { t, i18n } = useTranslation()
  const [response, setResponse] = useState<LifeGraphMemoryResponse>(emptyResponse)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [editingExpiryId, setEditingExpiryId] = useState<number | null>(null)
  const [expiryDraft, setExpiryDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<LifeGraphMemoryItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const result = await lifeGraphMemoryApi.get()
      setResponse(result.data.data ?? emptyResponse)
    } catch (error) {
      console.error('Failed to load relationship graph memory', error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const updateLocal = (updated: LifeGraphMemoryItem) => {
    setResponse(current => {
      const entities = current.entities.map(entity => entity.id === updated.id ? updated : entity)
      return summarize(entities)
    })
  }

  const summarize = (entities: LifeGraphMemoryItem[]): LifeGraphMemoryResponse => ({
    entities,
    activeCount: entities.filter(entity => entity.lifecycleStatus === 'ACTIVE').length,
    hiddenCount: entities.filter(entity => entity.lifecycleStatus === 'HIDDEN').length,
    expiredCount: entities.filter(entity => entity.lifecycleStatus === 'EXPIRED').length,
    matchableCount: entities.filter(entity => canUseForMatching(entity.lifecycleStatus, entity.matchAllowed)).length,
  })

  const updateEntity = async (id: number, request: UpdateLifeGraphMemoryRequest, successMessage?: string) => {
    setSavingId(id)
    try {
      const result = await lifeGraphMemoryApi.update(id, request)
      const updated = result.data.data
      if (!updated) throw new Error('Relationship graph update returned no data')
      updateLocal(updated)
      if (successMessage) toast.success(successMessage)
      return updated
    } catch (error) {
      console.error('Failed to update relationship graph memory', error)
      toast.error(t('memoryCenter.relationshipGraph.updateFailed'))
      return null
    } finally {
      setSavingId(null)
    }
  }

  const saveExpiry = async (entity: LifeGraphMemoryItem) => {
    const request: UpdateLifeGraphMemoryRequest = expiryDraft
      ? { validUntil: `${expiryDraft}T23:59:59` }
      : { clearValidUntil: true }
    const updated = await updateEntity(entity.id, request, t('memoryCenter.relationshipGraph.expiryUpdated'))
    if (updated) {
      setEditingExpiryId(null)
      setExpiryDraft('')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await lifeGraphMemoryApi.remove(deleteTarget.id)
      setResponse(current => summarize(current.entities.filter(entity => entity.id !== deleteTarget.id)))
      setDeleteTarget(null)
      toast.success(t('memoryCenter.relationshipGraph.deleteSuccess'))
    } catch (error) {
      console.error('Failed to delete relationship graph memory', error)
      toast.error(t('memoryCenter.relationshipGraph.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="space-y-4" aria-label={t('common.loading')}><div className="h-64 animate-pulse border border-border/60 bg-muted/30" /><div className="h-64 animate-pulse border border-border/60 bg-muted/30" /></div>
  }

  if (loadError) {
    return (
      <EmptyState
        icon={Database}
        title={t('memoryCenter.relationshipGraph.loadFailed')}
        description={t('memoryCenter.relationshipGraph.loadFailedDescription')}
        action={{ label: t('memoryCenter.reload'), onClick: () => void load() }}
      />
    )
  }

  if (response.entities.length === 0) {
    return (
      <EmptyState
        icon={Link2}
        title={t('memoryCenter.relationshipGraph.emptyTitle')}
        description={t('memoryCenter.relationshipGraph.emptyDescription')}
        action={{ label: t('memoryCenter.refresh'), onClick: () => void load() }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['active', response.activeCount, 'text-emerald-600 dark:text-emerald-300'],
          ['matchable', response.matchableCount, 'text-primary'],
          ['hidden', response.hiddenCount, 'text-slate-500'],
          ['expired', response.expiredCount, 'text-amber-600 dark:text-amber-300'],
        ].map(([label, value, tone]) => (
          <div key={label} className="border border-border/70 bg-card/50 p-4">
            <span className="text-xs font-medium text-muted-foreground">{t(`memoryCenter.stats.${label}`)}</span>
            <div className={`mt-2 text-2xl font-bold ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          {t('memoryCenter.relationshipGraph.safeNote')}
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          {t('memoryCenter.refresh')}
        </Button>
      </div>

      <div className="space-y-4">
        {response.entities.map(entity => {
          const isSaving = savingId === entity.id
          const isEditingExpiry = editingExpiryId === entity.id
          const effectivelyMatchable = canUseForMatching(entity.lifecycleStatus, entity.matchAllowed)
          const reason = entity.lifecycleStatus === 'HIDDEN'
            ? t('memoryCenter.reasonHidden')
            : entity.lifecycleStatus === 'EXPIRED'
              ? t('memoryCenter.reasonExpired')
              : null

          return (
            <Card key={entity.id} className={`overflow-hidden rounded-xl border-border/70 bg-card/70 ${entity.lifecycleStatus !== 'ACTIVE' ? 'opacity-90' : ''}`}>
              <div className="border-b border-border/60 px-5 py-4 md:px-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={statusStyles[entity.lifecycleStatus]}>
                        {t(`memoryCenter.relationshipGraph.status.${entity.lifecycleStatus}`)}
                      </Badge>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        {t(`memoryCenter.relationshipGraph.types.${entity.type}`, { defaultValue: entity.type })}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold">{entity.displayName}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/85">
                      {entity.summary || t('memoryCenter.relationshipGraph.noSummary')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <IconButton
                      label={entity.hidden ? t('memoryCenter.restore') : t('memoryCenter.hide')}
                      onClick={() => void updateEntity(
                        entity.id,
                        { hidden: !entity.hidden },
                        entity.hidden ? t('memoryCenter.relationshipGraph.restoredSuccess') : t('memoryCenter.relationshipGraph.hiddenSuccess')
                      )}
                      disabled={isSaving}
                    >
                      {entity.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </IconButton>
                    <IconButton
                      label={t('memoryCenter.relationshipGraph.delete')}
                      onClick={() => setDeleteTarget(entity)}
                      disabled={isSaving}
                      destructive
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 px-5 py-5 md:grid-cols-[1fr_1.2fr] md:px-6">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">{t('memoryCenter.relationshipGraph.mentions')}</div>
                    <div className="font-semibold">{entity.mentionCount}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">{t('memoryCenter.relationshipGraph.relations')}</div>
                    <div className="font-semibold">{entity.relationCount}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">{t('memoryCenter.confidence')}</div>
                    <div className="font-semibold">{formatPercent(entity.confidence)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">{t('memoryCenter.updatedAt')}</div>
                    <div className="text-xs leading-5 text-foreground/80">{formatDateTime(entity.updatedAt, i18n.language)}</div>
                  </div>

                  <div className="border-t border-border/60 pt-4 sm:col-span-2">
                    <div className="mb-2 text-xs text-muted-foreground">{t('memoryCenter.relationshipGraph.sources')}</div>
                    <div className="flex flex-wrap gap-2">
                      {entity.sources.length === 0 ? (
                        <span className="text-xs text-muted-foreground">{t('memoryCenter.relationshipGraph.noSources')}</span>
                      ) : entity.sources.map((source, index) => (
                        <span key={`${source.sourceId}-${index}`} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-xs text-foreground/80">
                          <Database className="h-3 w-3 text-primary" />
                          #{source.sourceId}
                          {source.entryDate && <span className="text-muted-foreground">{source.entryDate}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {t('memoryCenter.validUntil')}
                      </div>
                      {isEditingExpiry ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="date"
                            value={expiryDraft}
                            onChange={event => setExpiryDraft(event.target.value)}
                            className="min-h-11 w-full text-xs sm:h-9 sm:min-h-0 sm:w-40"
                          />
                          <button
                            type="button"
                            onClick={() => setExpiryDraft('')}
                            className="min-h-11 px-1 text-left text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline sm:min-h-0"
                          >
                            {t('memoryCenter.clearExpiry')}
                          </button>
                          <IconButton label={t('memoryCenter.relationshipGraph.saveExpiry')} onClick={() => void saveExpiry(entity)} disabled={isSaving}>
                            <CalendarClock className="h-4 w-4" />
                          </IconButton>
                          <IconButton label={t('memoryCenter.cancelEdit')} onClick={() => setEditingExpiryId(null)} disabled={isSaving}>
                            <X className="h-4 w-4" />
                          </IconButton>
                        </div>
                      ) : (
                        <span className={`text-sm font-medium ${entity.lifecycleStatus === 'EXPIRED' ? 'text-amber-600 dark:text-amber-300' : ''}`}>
                          {entity.validUntil ? formatDateTime(entity.validUntil, i18n.language) : t('memoryCenter.neverExpires')}
                        </span>
                      )}
                    </div>
                    {!isEditingExpiry && (
                      <IconButton
                        label={t('memoryCenter.adjustExpiry')}
                        onClick={() => {
                          setExpiryDraft(formatDateInput(entity.validUntil))
                          setEditingExpiryId(entity.id)
                        }}
                        disabled={isSaving}
                      >
                        <CalendarClock className="h-4 w-4" />
                      </IconButton>
                    )}
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
                    <Checkbox
                      id={`graph-match-${entity.id}`}
                      checked={entity.matchAllowed}
                      disabled={isSaving}
                      onCheckedChange={checked => void updateEntity(
                        entity.id,
                        { matchAllowed: checked === true },
                        t('memoryCenter.relationshipGraph.updateSuccess')
                      )}
                      className="mt-0.5"
                    />
                    <label htmlFor={`graph-match-${entity.id}`} className="min-w-0 cursor-pointer">
                      <span className="block text-sm font-medium">{t('memoryCenter.allowMatching')}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {effectivelyMatchable
                          ? t('memoryCenter.matchingEnabled')
                          : t('memoryCenter.matchingUnavailable', { reason: reason ?? t('memoryCenter.matchingDisabled') })}
                      </span>
                    </label>
                    <ShieldCheck className="ml-auto h-4 w-4 shrink-0 text-primary" />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('memoryCenter.relationshipGraph.deleteTitle')}
        description={t('memoryCenter.relationshipGraph.deleteDescription')}
        variant="danger"
        confirmText={t('memoryCenter.relationshipGraph.deleteConfirm')}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null)
        }}
      />
    </div>
  )
}
