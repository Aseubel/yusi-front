import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarClock,
  Check,
  Database,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
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
  personaMemoryApi,
  type PersonaMemoryItem,
  type UpdatePersonaMemoryRequest,
} from '../../lib/api'
import { canUseForMatching, formatPercent } from '../../lib/memoryCenter'

const emptyPersona: PersonaMemoryItem = {
  sourceType: 'UNKNOWN',
  confidence: 0.5,
  matchAllowed: false,
  hidden: false,
  lifecycleStatus: 'EMPTY',
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

const statusStyles: Record<PersonaMemoryItem['lifecycleStatus'], string> = {
  ACTIVE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  HIDDEN: 'border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300',
  EXPIRED: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  EMPTY: 'border-border/70 bg-muted/40 text-muted-foreground',
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

const fieldNames = [
  ['preferredName', 'preferredName'],
  ['location', 'location'],
  ['interests', 'interests'],
  ['tone', 'tone'],
  ['customInstructions', 'customInstructions'],
] as const

export function PersonaMemoryPanel() {
  const { t, i18n } = useTranslation()
  const [persona, setPersona] = useState<PersonaMemoryItem>(emptyPersona)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingExpiry, setEditingExpiry] = useState(false)
  const [expiryDraft, setExpiryDraft] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const response = await personaMemoryApi.get()
      const next = response.data.data ?? emptyPersona
      setPersona(next)
      setDraft({
        preferredName: next.preferredName ?? '',
        location: next.location ?? '',
        interests: next.interests ?? '',
        tone: next.tone ?? '',
        customInstructions: next.customInstructions ?? '',
      })
    } catch (error) {
      console.error('Failed to load persona memory', error)
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

  const statusLabel = t(`memoryCenter.persona.status.${persona.lifecycleStatus}`)
  const sourceLabel = t(`memoryCenter.sources.${persona.sourceType}`, {
    defaultValue: t('memoryCenter.sources.UNKNOWN'),
  })
  const effectivelyMatchable = canUseForMatching(persona.lifecycleStatus, persona.matchAllowed)
  const matchReason = useMemo(() => {
    if (persona.lifecycleStatus === 'HIDDEN') return t('memoryCenter.reasonHidden')
    if (persona.lifecycleStatus === 'EXPIRED') return t('memoryCenter.reasonExpired')
    if (persona.lifecycleStatus === 'EMPTY') return t('memoryCenter.persona.emptyStatus')
    return null
  }, [persona.lifecycleStatus, t])

  const updatePersona = async (request: UpdatePersonaMemoryRequest, successMessage?: string) => {
    setSaving(true)
    try {
      const response = await personaMemoryApi.update(request)
      const next = response.data.data
      if (!next) throw new Error('Persona update returned no data')
      setPersona(next)
      setDraft({
        preferredName: next.preferredName ?? '',
        location: next.location ?? '',
        interests: next.interests ?? '',
        tone: next.tone ?? '',
        customInstructions: next.customInstructions ?? '',
      })
      if (successMessage) toast.success(successMessage)
      return next
    } catch (error) {
      console.error('Failed to update persona memory', error)
      toast.error(t('memoryCenter.persona.updateFailed'))
      return null
    } finally {
      setSaving(false)
    }
  }

  const saveFields = async () => {
    const request: UpdatePersonaMemoryRequest = {
      preferredName: draft.preferredName,
      location: draft.location,
      interests: draft.interests,
      tone: draft.tone,
      customInstructions: draft.customInstructions,
    }
    await updatePersona(request, t('memoryCenter.persona.updateSuccess'))
  }

  const saveExpiry = async () => {
    const request: UpdatePersonaMemoryRequest = expiryDraft
      ? { validUntil: `${expiryDraft}T23:59:59` }
      : { clearValidUntil: true }
    const updated = await updatePersona(request, t('memoryCenter.persona.expiryUpdated'))
    if (updated) {
      setEditingExpiry(false)
      setExpiryDraft('')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await personaMemoryApi.remove()
      setPersona(emptyPersona)
      setDraft({})
      setDeleteOpen(false)
      toast.success(t('memoryCenter.persona.deleteSuccess'))
    } catch (error) {
      console.error('Failed to delete persona memory', error)
      toast.error(t('memoryCenter.persona.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="h-80 animate-pulse border border-border/60 bg-muted/30" aria-label={t('common.loading')} />
  }

  if (loadError) {
    return (
      <EmptyState
        icon={Database}
        title={t('memoryCenter.persona.loadFailed')}
        description={t('memoryCenter.persona.loadFailedDescription')}
        action={{ label: t('memoryCenter.reload'), onClick: () => void load() }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-xl border-border/70 bg-card/70">
        <div className="border-b border-border/60 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={statusStyles[persona.lifecycleStatus]}>
                  {statusLabel}
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Database className="h-3.5 w-3.5" />
                  {sourceLabel}
                  {persona.sourceId && <span className="font-mono text-[11px]">#{persona.sourceId}</span>}
                </span>
              </div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <UserRound className="h-5 w-5 text-primary" />
                {t('memoryCenter.persona.title')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t('memoryCenter.persona.description')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <IconButton
                label={persona.hidden ? t('memoryCenter.restore') : t('memoryCenter.hide')}
                onClick={() => void updatePersona(
                  { hidden: !persona.hidden },
                  persona.hidden ? t('memoryCenter.persona.restoredSuccess') : t('memoryCenter.persona.hiddenSuccess')
                )}
                disabled={saving || persona.lifecycleStatus === 'EMPTY'}
              >
                {persona.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </IconButton>
              <IconButton
                label={t('memoryCenter.persona.delete')}
                onClick={() => setDeleteOpen(true)}
                disabled={saving || persona.lifecycleStatus === 'EMPTY'}
                destructive
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-5 py-5 md:grid-cols-[1.2fr_0.8fr] md:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {fieldNames.map(([field, labelKey]) => (
              <label key={field} className={field === 'customInstructions' ? 'sm:col-span-2' : ''}>
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t(`memoryCenter.persona.fields.${labelKey}`)}
                </span>
                {field === 'customInstructions' ? (
                  <textarea
                    value={draft[field] ?? ''}
                    onChange={event => setDraft(current => ({ ...current, [field]: event.target.value }))}
                    rows={3}
                    maxLength={4000}
                    className="flex w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm leading-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder={t('memoryCenter.persona.fields.customInstructionsPlaceholder')}
                  />
                ) : (
                  <Input
                    value={draft[field] ?? ''}
                    onChange={event => setDraft(current => ({ ...current, [field]: event.target.value }))}
                    maxLength={field === 'preferredName' ? 50 : field === 'location' ? 100 : field === 'interests' ? 500 : 200}
                  />
                )}
              </label>
            ))}
              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
              <Button size="sm" onClick={() => void saveFields()} disabled={saving} className="w-full sm:w-auto">
                <Check className="mr-1.5 h-4 w-4" />
                {t('memoryCenter.persona.saveFields')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void load()} disabled={saving} className="w-full sm:w-auto">
                <RefreshCw className="mr-1.5 h-4 w-4" />
                {t('memoryCenter.refresh')}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">{t('memoryCenter.confidence')}</div>
                <div className="font-semibold">{formatPercent(persona.confidence)}</div>
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">{t('memoryCenter.updatedAt')}</div>
                <div className="text-xs leading-5 text-foreground/80">{formatDateTime(persona.updatedAt, i18n.language)}</div>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                {t('memoryCenter.validUntil')}
              </div>
              {editingExpiry ? (
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
                  <IconButton label={t('memoryCenter.persona.saveExpiry')} onClick={() => void saveExpiry()} disabled={saving}>
                    <Check className="h-4 w-4" />
                  </IconButton>
                  <IconButton label={t('memoryCenter.cancelEdit')} onClick={() => setEditingExpiry(false)} disabled={saving}>
                    <X className="h-4 w-4" />
                  </IconButton>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-medium ${persona.lifecycleStatus === 'EXPIRED' ? 'text-amber-600 dark:text-amber-300' : ''}`}>
                    {persona.validUntil ? formatDateTime(persona.validUntil, i18n.language) : t('memoryCenter.neverExpires')}
                  </span>
                  <IconButton
                    label={t('memoryCenter.adjustExpiry')}
                    onClick={() => {
                      setExpiryDraft(formatDateInput(persona.validUntil))
                      setEditingExpiry(true)
                    }}
                    disabled={saving || persona.lifecycleStatus === 'EMPTY'}
                  >
                    <CalendarClock className="h-4 w-4" />
                  </IconButton>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
              <Checkbox
                id="persona-match"
                checked={persona.matchAllowed}
                disabled={saving || persona.lifecycleStatus === 'EMPTY'}
                onCheckedChange={checked => void updatePersona(
                  { matchAllowed: checked === true },
                  t('memoryCenter.persona.updateSuccess')
                )}
                className="mt-0.5"
              />
              <label htmlFor="persona-match" className="min-w-0 cursor-pointer">
                <span className="block text-sm font-medium">{t('memoryCenter.allowMatching')}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {effectivelyMatchable
                    ? t('memoryCenter.matchingEnabled')
                    : t('memoryCenter.matchingUnavailable', { reason: matchReason ?? t('memoryCenter.matchingDisabled') })}
                </span>
              </label>
              <ShieldCheck className="ml-auto h-4 w-4 shrink-0 text-primary" />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <div>
                <div className="mb-1">{t('memoryCenter.createdAt')}</div>
                <div className="text-foreground/80">{formatDateTime(persona.createdAt, i18n.language)}</div>
              </div>
              <div>
                <div className="mb-1">{t('memoryCenter.persona.source')}</div>
                <div className="truncate text-foreground/80">{sourceLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        {t('memoryCenter.persona.safeNote')}
      </p>

      <ConfirmDialog
        isOpen={deleteOpen}
        title={t('memoryCenter.persona.deleteTitle')}
        description={t('memoryCenter.persona.deleteDescription')}
        variant="danger"
        confirmText={t('memoryCenter.persona.deleteConfirm')}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) setDeleteOpen(false)
        }}
      />
    </div>
  )
}
