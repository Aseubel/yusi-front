import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  BrainCog,
  CalendarDays,
  CalendarClock,
  Check,
  Clock3,
  Database,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Network,
  UserRound,
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
} from '../components/ui'
import {
  memoryCenterApi,
  type MemoryCenterItem,
  type MemoryCenterResponse,
  type UpdateMemoryRequest,
} from '../lib/api'
import { LifeGraphMemoryPanel } from '../components/memory/LifeGraphMemoryPanel'
import { PersonaMemoryPanel } from '../components/memory/PersonaMemoryPanel'
import { LifeGraph2D } from './LifeGraph2D'
import { Timeline } from './Timeline'
import SoulReport from './SoulReport'
import { getMemoryCenterSection } from '../lib/memoryCenter'

type MemoryFilter = 'ALL' | 'ACTIVE' | 'HIDDEN' | 'EXPIRED'

const emptyCenter: MemoryCenterResponse = {
  memories: [],
  activeCount: 0,
  hiddenCount: 0,
  expiredCount: 0,
  matchableCount: 0,
}

const summarize = (memories: MemoryCenterItem[]): MemoryCenterResponse => ({
  memories,
  activeCount: memories.filter(memory => memory.lifecycleStatus === 'ACTIVE').length,
  hiddenCount: memories.filter(memory => memory.lifecycleStatus === 'HIDDEN').length,
  expiredCount: memories.filter(memory => memory.lifecycleStatus === 'EXPIRED').length,
  matchableCount: memories.filter(memory =>
    memory.lifecycleStatus === 'ACTIVE' && memory.matchAllowed
  ).length,
})

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

const statusStyles: Record<MemoryCenterItem['lifecycleStatus'], string> = {
  ACTIVE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  HIDDEN: 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300',
  EXPIRED: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  MERGED: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
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

export default function MemoryCenter() {
  const { t, i18n } = useTranslation()
  const [center, setCenter] = useState<MemoryCenterResponse>(emptyCenter)
  const [filter, setFilter] = useState<MemoryFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [editingSummaryId, setEditingSummaryId] = useState<number | null>(null)
  const [summaryDraft, setSummaryDraft] = useState('')
  const [editingExpiryId, setEditingExpiryId] = useState<number | null>(null)
  const [expiryDraft, setExpiryDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MemoryCenterItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const section = getMemoryCenterSection(searchParams.get('section'))

  const handleSectionChange = (nextSection: typeof section) => {
    const nextParams = new URLSearchParams(searchParams)
    if (nextSection === 'MID_TERM') {
      nextParams.delete('section')
    } else {
      nextParams.set('section', nextSection)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const response = await memoryCenterApi.get()
      setCenter(response.data.data ?? emptyCenter)
    } catch (error) {
      console.error('Failed to load memory center', error)
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

  const visibleMemories = useMemo(() => {
    if (filter === 'ALL') return center.memories
    return center.memories.filter(memory => memory.lifecycleStatus === filter)
  }, [center.memories, filter])

  const updateLocalMemory = (updated: MemoryCenterItem) => {
    setCenter(current => summarize(
      current.memories.map(memory => memory.id === updated.id ? updated : memory)
    ))
  }

  const updateMemory = async (id: number, request: UpdateMemoryRequest, successMessage?: string) => {
    setSavingId(id)
    try {
      const response = await memoryCenterApi.update(id, request)
      if (!response.data.data) throw new Error('Memory update returned no data')
      updateLocalMemory(response.data.data)
      if (successMessage) toast.success(successMessage)
      return response.data.data
    } catch (error) {
      console.error('Failed to update memory', error)
      toast.error(t('memoryCenter.updateFailed'))
      return null
    } finally {
      setSavingId(null)
    }
  }

  const beginSummaryEdit = (memory: MemoryCenterItem) => {
    setEditingSummaryId(memory.id)
    setSummaryDraft(memory.summary)
  }

  const cancelSummaryEdit = () => {
    setEditingSummaryId(null)
    setSummaryDraft('')
  }

  const saveSummary = async (memory: MemoryCenterItem) => {
    const summary = summaryDraft.trim()
    if (!summary) {
      toast.error(t('memoryCenter.summaryRequired'))
      return
    }
    const updated = await updateMemory(memory.id, { summary }, t('memoryCenter.updateSuccess'))
    if (updated) cancelSummaryEdit()
  }

  const beginExpiryEdit = (memory: MemoryCenterItem) => {
    setEditingExpiryId(memory.id)
    setExpiryDraft(formatDateInput(memory.validUntil))
  }

  const cancelExpiryEdit = () => {
    setEditingExpiryId(null)
    setExpiryDraft('')
  }

  const saveExpiry = async (memory: MemoryCenterItem) => {
    const request: UpdateMemoryRequest = expiryDraft
      ? { validUntil: `${expiryDraft}T23:59:59` }
      : { clearValidUntil: true }
    const updated = await updateMemory(memory.id, request, t('memoryCenter.expiryUpdated'))
    if (updated) cancelExpiryEdit()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await memoryCenterApi.remove(deleteTarget.id)
      setCenter(current => summarize(current.memories.filter(memory => memory.id !== deleteTarget.id)))
      toast.success(t('memoryCenter.deleteSuccess'))
      setDeleteTarget(null)
    } catch (error) {
      console.error('Failed to delete memory', error)
      toast.error(t('memoryCenter.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const sourceLabel = (sourceType: string) => t(`memoryCenter.sources.${sourceType}`, {
    defaultValue: t('memoryCenter.sources.UNKNOWN'),
  })

  const statusLabel = (status: MemoryCenterItem['lifecycleStatus']) =>
    t(`memoryCenter.status.${status}`)

  const matchReason = (memory: MemoryCenterItem) => {
    if (memory.lifecycleStatus === 'HIDDEN') return t('memoryCenter.reasonHidden')
    if (memory.lifecycleStatus === 'EXPIRED') return t('memoryCenter.reasonExpired')
    if (memory.lifecycleStatus === 'MERGED') return t('memoryCenter.reasonMerged')
    return null
  }

  const renderEmpty = () => {
    if (loadError) {
      return (
        <EmptyState
          icon={Database}
          title={t('memoryCenter.loadFailed')}
          description={t('memoryCenter.loadFailedDescription')}
          action={{ label: t('memoryCenter.reload'), onClick: () => void load() }}
        />
      )
    }
    if (filter !== 'ALL') {
      return (
        <EmptyState
          icon={EyeOff}
          title={t('memoryCenter.emptyFiltered')}
          description={t('memoryCenter.emptyFilteredDescription')}
        />
      )
    }
    return (
      <EmptyState
        icon={BrainCog}
        title={t('memoryCenter.emptyTitle')}
        description={t('memoryCenter.emptyDescription')}
      />
    )
  }

  const stats = [
    { label: t('memoryCenter.stats.active'), value: center.activeCount, icon: Sparkles, tone: 'text-emerald-600 dark:text-emerald-300' },
    { label: t('memoryCenter.stats.matchable'), value: center.matchableCount, icon: ShieldCheck, tone: 'text-primary' },
    { label: t('memoryCenter.stats.hidden'), value: center.hiddenCount, icon: EyeOff, tone: 'text-slate-500' },
    { label: t('memoryCenter.stats.expired'), value: center.expiredCount, icon: Clock3, tone: 'text-amber-600 dark:text-amber-300' },
  ]

  return (
    <div className="min-h-screen bg-background px-3 py-5 pb-24 sm:px-4 sm:py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              to="/agent-growth"
              title={t('memoryCenter.back')}
              aria-label={t('memoryCenter.back')}
              className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <BrainCog className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Yusi / Memory</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t('memoryCenter.title')}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                {t('memoryCenter.subtitle')}
              </p>
            </div>
          </div>
          {section === 'MID_TERM' && (
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('memoryCenter.refresh')}
            </Button>
          )}
        </header>

        <div className="mobile-scroll-x mb-5 flex flex-nowrap gap-1 rounded-full border border-border/70 bg-muted/40 p-1 sm:mb-7">
          {([
            ['MID_TERM', 'midTerm', BrainCog],
            ['PERSONA', 'persona', UserRound],
            ['RELATIONSHIP_GRAPH', 'relationshipGraph', Network],
            ['TIMELINE', 'timeline', CalendarDays],
            ['SOUL_REPORT', 'soulReport', FileText],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSectionChange(value)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-10 sm:px-4 ${
                section === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={section === value}
            >
              <Icon className="h-4 w-4" />
              {t(`memoryCenter.sections.${label}`)}
            </button>
          ))}
        </div>

        {section === 'MID_TERM' ? (<>
        <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="border border-border/70 bg-card/50 p-3 backdrop-blur-sm sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className={`h-4 w-4 ${tone}`} />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight">
                {value}<span className="ml-1 text-xs font-normal text-muted-foreground">{t('memoryCenter.stats.items')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-4 border-b border-border/70 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{t('memoryCenter.privacyNote')}</span>
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-full border border-border/70 bg-muted/40 p-1">
            {([
              ['ALL', 'all'],
              ['ACTIVE', 'active'],
              ['HIDDEN', 'hidden'],
              ['EXPIRED', 'expired'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`min-h-11 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-10 ${
                  filter === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`memoryCenter.filters.${label}`)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4" aria-label={t('common.loading')}>
            {[1, 2, 3].map(item => (
              <div key={item} className="h-64 animate-pulse border border-border/60 bg-muted/30" />
            ))}
          </div>
        ) : visibleMemories.length === 0 ? (
          renderEmpty()
        ) : (
          <div className="space-y-4">
            {visibleMemories.map(memory => {
              const reason = matchReason(memory)
              const isSaving = savingId === memory.id
              const isEditingSummary = editingSummaryId === memory.id
              const isEditingExpiry = editingExpiryId === memory.id
              const effectivelyMatchable = memory.lifecycleStatus === 'ACTIVE' && memory.matchAllowed

              return (
                <Card
                  key={memory.id}
                  className={`overflow-hidden rounded-xl border-border/70 bg-card/70 ${
                    memory.lifecycleStatus !== 'ACTIVE' ? 'opacity-90' : ''
                  }`}
                >
                  <div className="border-b border-border/60 px-4 py-4 sm:px-5 md:px-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={statusStyles[memory.lifecycleStatus]}>
                            {statusLabel(memory.lifecycleStatus)}
                          </Badge>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Database className="h-3.5 w-3.5" />
                            {sourceLabel(memory.sourceType)}
                            {memory.sourceId && <span className="font-mono text-[11px]">#{memory.sourceId}</span>}
                          </span>
                        </div>

                        {isEditingSummary ? (
                          <div className="space-y-3">
                            <textarea
                              autoFocus
                              value={summaryDraft}
                              onChange={event => setSummaryDraft(event.target.value)}
                              maxLength={2000}
                              rows={4}
                              className="flex w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm leading-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              placeholder={t('memoryCenter.summaryPlaceholder')}
                            />
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-muted-foreground">{summaryDraft.length} / 2000</span>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={cancelSummaryEdit} disabled={isSaving}>
                                  <X className="mr-1.5 h-4 w-4" />
                                  {t('memoryCenter.cancelEdit')}
                                </Button>
                                <Button size="sm" onClick={() => void saveSummary(memory)} disabled={isSaving}>
                                  <Check className="mr-1.5 h-4 w-4" />
                                  {t('memoryCenter.saveSummary')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <p className="min-w-0 flex-1 whitespace-pre-wrap text-[15px] leading-7 text-foreground">
                              {memory.summary}
                            </p>
                            <IconButton
                              label={t('memoryCenter.editSummary')}
                              onClick={() => beginSummaryEdit(memory)}
                              disabled={isSaving}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2 md:pl-4">
                        <IconButton
                          label={memory.hidden ? t('memoryCenter.restore') : t('memoryCenter.hide')}
                          onClick={() => void updateMemory(
                            memory.id,
                            { hidden: !memory.hidden },
                            memory.hidden ? t('memoryCenter.restoredSuccess') : t('memoryCenter.hiddenSuccess')
                          )}
                          disabled={isSaving}
                        >
                          {memory.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </IconButton>
                        <IconButton
                          label={t('memoryCenter.delete')}
                          onClick={() => setDeleteTarget(memory)}
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
                        <div className="mb-1 text-xs text-muted-foreground">{t('memoryCenter.confidence')}</div>
                        <div className="font-semibold">{Math.round((memory.confidence ?? 0) * 100)}%</div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-muted-foreground">{t('memoryCenter.importance')}</div>
                        <div className="font-semibold">{Math.round((memory.importance ?? 0) * 100)}%</div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-muted-foreground">{t('memoryCenter.createdAt')}</div>
                        <div className="text-xs leading-5 text-foreground/80">{formatDateTime(memory.createdAt, i18n.language)}</div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-muted-foreground">{t('memoryCenter.updatedAt')}</div>
                        <div className="text-xs leading-5 text-foreground/80">{formatDateTime(memory.updatedAt, i18n.language)}</div>
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
                              <IconButton label={t('memoryCenter.saveExpiry')} onClick={() => void saveExpiry(memory)} disabled={isSaving}>
                                <Check className="h-4 w-4" />
                              </IconButton>
                              <IconButton label={t('memoryCenter.cancelEdit')} onClick={cancelExpiryEdit} disabled={isSaving}>
                                <X className="h-4 w-4" />
                              </IconButton>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${memory.lifecycleStatus === 'EXPIRED' ? 'text-amber-600 dark:text-amber-300' : ''}`}>
                                {memory.validUntil
                                  ? formatDateTime(memory.validUntil, i18n.language)
                                  : t('memoryCenter.neverExpires')}
                              </span>
                              {memory.mergedIntoId && (
                                <span className="text-xs text-muted-foreground">
                                  {t('memoryCenter.mergedInto', { id: memory.mergedIntoId })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {!isEditingExpiry && (
                          <IconButton label={t('memoryCenter.adjustExpiry')} onClick={() => beginExpiryEdit(memory)} disabled={isSaving}>
                            <CalendarClock className="h-4 w-4" />
                          </IconButton>
                        )}
                      </div>

                      <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
                        <Checkbox
                          id={`match-${memory.id}`}
                          checked={memory.matchAllowed}
                          disabled={isSaving}
                          onCheckedChange={checked => void updateMemory(
                            memory.id,
                            { matchAllowed: checked === true },
                            t('memoryCenter.updateSuccess')
                          )}
                          className="mt-0.5"
                        />
                        <label htmlFor={`match-${memory.id}`} className="min-w-0 cursor-pointer">
                          <span className="block text-sm font-medium">{t('memoryCenter.allowMatching')}</span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {effectivelyMatchable
                              ? t('memoryCenter.matchingEnabled')
                              : reason
                                ? t('memoryCenter.matchingUnavailable', { reason })
                                : t('memoryCenter.matchingDisabled')}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
        </>) : section === 'PERSONA' ? (
          <PersonaMemoryPanel />
        ) : section === 'RELATIONSHIP_GRAPH' ? (
          <div className="space-y-8">
            <LifeGraph2D embedded />
            <LifeGraphMemoryPanel />
          </div>
        ) : section === 'TIMELINE' ? (
          <Timeline embedded />
        ) : (
          <SoulReport embedded />
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('memoryCenter.deleteTitle')}
        description={t('memoryCenter.deleteDescription')}
        variant="danger"
        confirmText={t('memoryCenter.deleteConfirm')}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null)
        }}
      />
    </div>
  )
}
