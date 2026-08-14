import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Database,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Badge, Button, Input, Select } from '../../components/ui'
import { adminApi, type Page, type SecurityAuditEvent } from '../../lib/api'

const PAGE_SIZE = 20

const ACTION_KEYS = [
  'ADMIN_PERMISSION_UPDATED',
  'ADMIN_USER_DEREGISTERED',
  'SCENARIO_REVIEWED',
  'SUGGESTION_REPLIED',
  'SUGGESTION_STATUS_UPDATED',
  'ANNOUNCEMENT_PUBLISHED',
  'EMBEDDINGS_FULL_SYNC',
  'PROMPT_CREATED',
  'PROMPT_UPDATED',
  'PROMPT_ACTIVATED',
  'PROMPT_DELETED',
  'MODEL_GOVERNANCE_UPDATED',
  'CONNECTION_REPORTED',
  'CONNECTION_BLOCKED',
  'MEMORY_CREATED',
  'MEMORY_UPDATED',
  'MEMORY_DELETED',
  'LIFE_GRAPH_UPDATED',
  'LIFE_GRAPH_DELETED',
  'PERSONA_UPDATED',
  'PERSONA_DELETED',
  'TASK_FAILED',
  'ACCESS_DENIED',
] as const

const RESOURCE_TYPES = [
  'USER',
  'CONNECTION',
  'SITUATION_SCENARIO',
  'SUGGESTION',
  'ANNOUNCEMENT',
  'EMBEDDING_SYNC',
  'PROMPT_TEMPLATE',
  'MODEL_GOVERNANCE',
  'MID_TERM_MEMORY',
  'LIFE_GRAPH_ENTITY',
  'PERSONA',
  'TASK_EXECUTION',
  'RESOURCE',
] as const

const getOutcomeIcon = (outcome: SecurityAuditEvent['outcome']) => {
  if (outcome === 'SUCCESS') return CheckCircle2
  if (outcome === 'DENIED') return Ban
  return CircleX
}

export const SecurityAudit = () => {
  const { t, i18n } = useTranslation()
  const [events, setEvents] = useState<SecurityAuditEvent[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('ALL')
  const [outcomeFilter, setOutcomeFilter] = useState('ALL')
  const [resourceFilter, setResourceFilter] = useState('ALL')
  const [userInput, setUserInput] = useState('')
  const [userFilter, setUserFilter] = useState('')

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }), [i18n.language])

  const translate = useCallback((key: string, fallback: string) => {
    return t(key, { defaultValue: fallback })
  }, [t])

  const loadAudit = useCallback(async (targetPage = page) => {
    setLoading(true)
    try {
      const response = await adminApi.getAudit({
        page: targetPage,
        size: PAGE_SIZE,
        action: actionFilter === 'ALL' ? undefined : actionFilter,
        outcome: outcomeFilter === 'ALL' ? undefined : outcomeFilter as SecurityAuditEvent['outcome'],
        resourceType: resourceFilter === 'ALL' ? undefined : resourceFilter,
        userId: userFilter || undefined,
      })
      const data = response.data.data as Page<SecurityAuditEvent> | undefined
      setEvents(data?.content ?? [])
      setPage(data?.number ?? targetPage)
      setTotalPages(data?.totalPages ?? 0)
      setTotalElements(data?.totalElements ?? 0)
    } catch (error) {
      console.error('Failed to load security audit events', error)
      toast.error(t('adminAudit.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [actionFilter, outcomeFilter, page, resourceFilter, t, userFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAudit(page), 0)
    return () => window.clearTimeout(timer)
  }, [loadAudit, page])

  const submitUserFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setUserFilter(userInput.trim())
  }

  const clearFilters = () => {
    setActionFilter('ALL')
    setOutcomeFilter('ALL')
    setResourceFilter('ALL')
    setUserInput('')
    setUserFilter('')
    setPage(0)
  }

  const formatDate = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  const getActionLabel = (event: SecurityAuditEvent) =>
    translate(`adminAudit.actions.${event.actionKey}`, event.action || event.actionKey)

  const getResourceLabel = (resourceType: string) =>
    translate(`adminAudit.resources.${resourceType}`, resourceType)

  const getOutcomeLabel = (outcome: SecurityAuditEvent['outcome']) =>
    translate(`adminAudit.outcomes.${outcome}`, outcome)

  const getActorLabel = (actorType: SecurityAuditEvent['actorType']) =>
    translate(`adminAudit.actorTypes.${actorType}`, actorType)

  const actionOptions = [
    { value: 'ALL', label: t('adminAudit.filters.allActions') },
    ...ACTION_KEYS.map((key) => ({ value: key, label: translate(`adminAudit.actions.${key}`, key) })),
  ]
  const resourceOptions = [
    { value: 'ALL', label: t('adminAudit.filters.allResources') },
    ...RESOURCE_TYPES.map((type) => ({ value: type, label: getResourceLabel(type) })),
  ]
  const outcomeOptions = [
    { value: 'ALL', label: t('adminAudit.filters.allOutcomes') },
    { value: 'SUCCESS', label: getOutcomeLabel('SUCCESS') },
    { value: 'DENIED', label: getOutcomeLabel('DENIED') },
    { value: 'FAILURE', label: getOutcomeLabel('FAILURE') },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="flex flex-col gap-2 border-b border-border pb-5 sm:pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t('admin.layout.adminPanel')}</p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t('adminAudit.title')}</h1>
          </div>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">{t('adminAudit.subtitle')}</p>
      </header>

      <section className="space-y-4 border border-border bg-card/30 p-4 sm:p-5" aria-label={t('adminAudit.filters.title')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('adminAudit.filters.title')}
          </div>
          <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={clearFilters}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('adminAudit.filters.reset')}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={actionFilter} onValueChange={(value) => { setActionFilter(value); setPage(0) }} options={actionOptions} aria-label={t('adminAudit.filters.action')} />
          <Select value={outcomeFilter} onValueChange={(value) => { setOutcomeFilter(value); setPage(0) }} options={outcomeOptions} aria-label={t('adminAudit.filters.outcome')} />
          <Select value={resourceFilter} onValueChange={(value) => { setResourceFilter(value); setPage(0) }} options={resourceOptions} aria-label={t('adminAudit.filters.resource')} />
        </div>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submitUserFilter}>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              placeholder={t('adminAudit.filters.userPlaceholder')}
              className="pl-10"
              aria-label={t('adminAudit.filters.user')}
            />
          </div>
          <Button type="submit" variant="secondary" className="gap-2">
            <Search className="h-4 w-4" aria-hidden="true" />
            {t('common.search')}
          </Button>
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{t('adminAudit.total', { count: totalElements })}</span>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void loadAudit(page)} disabled={loading}>
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" />
          {t('adminAudit.refresh')}
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center border border-dashed border-border text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          {t('adminAudit.loading')}
        </div>
      ) : events.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center border border-dashed border-border px-6 text-center text-muted-foreground">
          <ShieldCheck className="mb-3 h-9 w-9 opacity-40" aria-hidden="true" />
          <p className="font-medium">{t('adminAudit.empty')}</p>
          <p className="mt-1 text-sm">{t('adminAudit.emptyDescription')}</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-border bg-card/30">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('adminAudit.table.time')}</th>
                  <th className="px-4 py-3 font-medium">{t('adminAudit.table.action')}</th>
                  <th className="px-4 py-3 font-medium">{t('adminAudit.table.actor')}</th>
                  <th className="px-4 py-3 font-medium">{t('adminAudit.table.subject')}</th>
                  <th className="px-4 py-3 font-medium">{t('adminAudit.table.resource')}</th>
                  <th className="px-4 py-3 font-medium">{t('adminAudit.table.outcome')}</th>
                  <th className="px-4 py-3 font-medium">{t('adminAudit.table.details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {events.map((event) => {
                  const OutcomeIcon = getOutcomeIcon(event.outcome)
                  const outcomeClass = event.outcome === 'SUCCESS'
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : event.outcome === 'DENIED'
                      ? 'text-amber-600 dark:text-amber-300'
                      : 'text-rose-600 dark:text-rose-300'
                  return (
                    <tr key={event.eventId} className="align-top transition-colors hover:bg-muted/25">
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">{formatDate(event.occurredAt)}</td>
                      <td className="max-w-52 px-4 py-4">
                        <div className="font-medium">{getActionLabel(event)}</div>
                        <div className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{event.eventId}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-medium"><UserRound className="h-3.5 w-3.5 text-primary" aria-hidden="true" />{getActorLabel(event.actorType)}</div>
                        <div className="mt-1 break-all font-mono text-xs text-muted-foreground">{event.actorUserId || '-'}</div>
                      </td>
                      <td className="max-w-40 break-all px-4 py-4 font-mono text-xs text-muted-foreground">{event.subjectUserId || '-'}</td>
                      <td className="max-w-44 px-4 py-4">
                        <div className="flex items-center gap-1.5 font-medium"><Database className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />{getResourceLabel(event.resourceType)}</div>
                        <div className="mt-1 break-all font-mono text-xs text-muted-foreground">{event.resourceId || '-'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className={`flex items-center gap-1.5 font-medium ${outcomeClass}`}><OutcomeIcon className="h-4 w-4" aria-hidden="true" />{getOutcomeLabel(event.outcome)}</div>
                        {event.reasonCode && <div className="mt-1 break-all text-[10px] text-muted-foreground">{event.reasonCode}</div>}
                      </td>
                      <td className="max-w-64 px-4 py-4">
                        {Object.keys(event.details ?? {}).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(event.details).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="max-w-full break-all text-[10px] font-normal">
                                <span className="mr-1 text-muted-foreground">{translate(`adminAudit.details.${key}`, key)}:</span>{value}
                              </Badge>
                            ))}
                          </div>
                        ) : <span className="text-xs text-muted-foreground">-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-2">
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page <= 0 || loading}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {t('adminAudit.previous')}
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">{t('adminAudit.page', { current: page + 1, total: totalPages })}</span>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1 || loading}>
            {t('adminAudit.next')}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}
