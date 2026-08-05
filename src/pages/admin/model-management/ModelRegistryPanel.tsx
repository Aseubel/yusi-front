import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CircleAlert, CircleX, Edit3, KeyRound, Plus, Search, Server, SlidersHorizontal } from 'lucide-react'
import { Badge, Button, Checkbox, Input, Select, Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../../../components/ui'
import type { ModelCapability, ModelRuntimeState } from '../../../lib/api'
import type { GovernanceDraft, ModelDraft } from '../../../lib/modelRouting'
import { MASKED_SECRET } from '../../../lib/modelRouting'

interface ModelRegistryPanelProps {
  draft: GovernanceDraft
  runtimeStates: ModelRuntimeState[]
  onChange: (draft: GovernanceDraft) => void
}

const capabilities: ModelCapability[] = ['CHAT', 'STREAMING_CHAT', 'EMBEDDING', 'SPEECH_TO_TEXT']

const blankModel = (): ModelDraft => ({
  id: '',
  displayName: '',
  provider: 'openai-compatible',
  baseUrl: '',
  endpointHost: '',
  realModelId: '',
  apiKeyConfigured: false,
  apiKeyDraft: '',
  capabilities: ['CHAT', 'STREAMING_CHAT'],
  timeoutSeconds: 60,
  contextWindowTokens: null,
  inputPricePerMillion: null,
  outputPricePerMillion: null,
  priceVersion: '',
  weight: 100,
  priority: 100,
  languages: [],
  scenes: [],
  enabled: true,
})

const numberValue = (value: string, fallback: number | null = null): number | null => {
  if (!value.trim()) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const ModelRegistryPanel = ({ draft, runtimeStates, onChange }: ModelRegistryPanelProps) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [capability, setCapability] = useState('ALL')
  const [editingModel, setEditingModel] = useState<ModelDraft | null>(null)

  const stateById = useMemo(() => new Map(runtimeStates.map((state) => [state.instanceId, state])), [runtimeStates])
  const visibleModels = useMemo(() => draft.models.filter((model) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [model.id, model.displayName, model.provider, model.realModelId]
      .some((value) => value?.toLowerCase().includes(query))
    const runtime = stateById.get(model.id)
    const matchesStatus = status === 'ALL'
      || (status === 'HEALTHY' && (!runtime || (runtime.available && runtime.phase !== 'HALF_OPEN')))
      || (status === 'DEGRADED' && runtime?.available && runtime.phase === 'HALF_OPEN')
      || (status === 'DOWN' && runtime && !runtime.available)
    const matchesCapability = capability === 'ALL' || model.capabilities.includes(capability as ModelCapability)
    return matchesSearch && matchesStatus && matchesCapability
  }), [capability, draft.models, search, stateById, status])

  const saveModel = () => {
    if (!editingModel?.id.trim()) return
    const normalized = {
      ...editingModel,
      id: editingModel.id.trim(),
      realModelId: editingModel.realModelId?.trim() ?? '',
      baseUrl: editingModel.baseUrl?.trim() ?? '',
      apiKeyConfigured: editingModel.apiKeyConfigured || Boolean(editingModel.apiKeyDraft && editingModel.apiKeyDraft !== MASKED_SECRET),
    }
    const exists = draft.models.some((model) => model.id === normalized.id)
    onChange({
      ...draft,
      models: exists ? draft.models.map((model) => model.id === normalized.id ? normalized : model) : [...draft.models, normalized],
    })
    setEditingModel(null)
  }

  const toggleCapability = (value: ModelCapability, checked: boolean) => {
    if (!editingModel) return
    const next = new Set(editingModel.capabilities)
    if (checked) next.add(value)
    else next.delete(value)
    setEditingModel({ ...editingModel, capabilities: [...next] })
  }

  const updateEditing = <K extends keyof ModelDraft>(key: K, value: ModelDraft[K]) => {
    setEditingModel((model) => model ? { ...model, [key]: value } : model)
  }

  return (
    <section className="space-y-5" aria-labelledby="model-registry-heading">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="model-registry-heading" className="text-xl font-semibold tracking-tight">{t('modelManagement.registry.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('modelManagement.registry.subtitle')}</p>
        </div>
        <Button onClick={() => setEditingModel(blankModel())} className="gap-2 self-start">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('modelManagement.registry.addModel')}
        </Button>
      </div>

      <div className="grid gap-3 border-y border-border py-3 md:grid-cols-[minmax(220px,1fr)_170px_190px]">
        <label className="relative block">
          <span className="sr-only">{t('modelManagement.registry.search')}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('modelManagement.registry.search')} className="pl-9" />
        </label>
        <Select value={status} onValueChange={setStatus} options={[
          { value: 'ALL', label: t('modelManagement.registry.allStatus') },
          { value: 'HEALTHY', label: t('modelManagement.registry.healthy') },
          { value: 'DEGRADED', label: t('modelManagement.registry.degraded') },
          { value: 'DOWN', label: t('modelManagement.registry.down') },
        ]} />
        <Select value={capability} onValueChange={setCapability} options={[
          { value: 'ALL', label: t('modelManagement.registry.allCapabilities') },
          ...capabilities.map((value) => ({ value, label: value.replaceAll('_', ' ') })),
        ]} />
      </div>

      <div className="overflow-hidden border border-border bg-background">
        <div className="hidden grid-cols-[minmax(220px,1.3fr)_150px_minmax(170px,1fr)_120px_100px_88px] gap-4 border-b border-border bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid">
          <span>{t('modelManagement.registry.model')}</span>
          <span>{t('modelManagement.registry.provider')}</span>
          <span>{t('modelManagement.registry.capabilities')}</span>
          <span>{t('modelManagement.registry.health')}</span>
          <span>{t('modelManagement.registry.price')}</span>
          <span className="text-right">{t('modelManagement.registry.action')}</span>
        </div>
        {visibleModels.map((model) => {
          const state = stateById.get(model.id)
          const down = state && !state.available
          const degraded = state?.available && state.phase === 'HALF_OPEN'
          return (
            <div key={model.id} className="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(220px,1.3fr)_150px_minmax(170px,1fr)_120px_100px_88px] lg:items-center lg:gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${down ? 'bg-rose-500' : degraded ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="truncate font-semibold">{model.displayName || model.id}</span>
                  {!model.enabled && <Badge variant="outline">{t('modelManagement.registry.disabled')}</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-mono">{model.id}</span>
                  <span className="text-border">/</span>
                  <span className="truncate">{model.realModelId || t('modelManagement.registry.missingModelId')}</span>
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">{model.endpointHost || model.baseUrl || t('modelManagement.registry.noEndpoint')}</div>
              </div>
              <div className="text-sm text-muted-foreground">{model.provider || t('modelManagement.registry.unsupportedProvider')}</div>
              <div className="flex flex-wrap gap-1.5">
                {model.capabilities.map((item) => <Badge key={item} variant="secondary" className="font-mono text-[10px]">{item}</Badge>)}
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                {down ? <CircleX className="h-4 w-4 text-rose-500" aria-hidden="true" /> : degraded ? <CircleAlert className="h-4 w-4 text-amber-500" aria-hidden="true" /> : <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
                <span>{down ? t('modelManagement.registry.down') : degraded ? t('modelManagement.registry.degraded') : t('modelManagement.registry.healthy')}</span>
              </div>
              <div className="text-sm tabular-nums text-muted-foreground">
                {model.inputPricePerMillion == null || model.outputPricePerMillion == null ? t('modelManagement.registry.unknownPrice') : t('modelManagement.registry.priceKnown')}
              </div>
              <div className="flex justify-start lg:justify-end">
                <Button variant="ghost" size="icon" onClick={() => setEditingModel({ ...model, capabilities: [...model.capabilities], languages: [...model.languages], scenes: [...model.scenes] })} aria-label={t('modelManagement.registry.editModel')} title={t('modelManagement.registry.editModel')}>
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )
        })}
        {!visibleModels.length && (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
            <Server className="h-8 w-8 opacity-40" aria-hidden="true" />
            {t('modelManagement.registry.empty')}
          </div>
        )}
      </div>

      <Sheet open={editingModel !== null} onOpenChange={(open) => !open && setEditingModel(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {editingModel && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-primary" aria-hidden="true" />{editingModel.id ? t('modelManagement.registry.editTitle') : t('modelManagement.registry.addTitle')}</SheetTitle>
                <SheetDescription>{t('modelManagement.registry.editDescription')}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6 pb-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('modelManagement.registry.fields.id')} value={editingModel.id} onChange={(value) => updateEditing('id', value)} />
                  <Field label={t('modelManagement.registry.fields.displayName')} value={editingModel.displayName ?? ''} onChange={(value) => updateEditing('displayName', value)} />
                  <label className="space-y-1.5 text-sm"><span className="font-medium">{t('modelManagement.registry.fields.provider')}</span><Select value={editingModel.provider ?? 'openai-compatible'} onValueChange={(value) => updateEditing('provider', value)} options={[
                    { value: 'openai-compatible', label: 'OpenAI-compatible' },
                    { value: 'openai', label: 'OpenAI' },
                    { value: 'deepseek', label: 'DeepSeek' },
                    { value: 'dashscope', label: 'DashScope' },
                  ]} /></label>
                  <Field label={t('modelManagement.registry.fields.realModelId')} value={editingModel.realModelId ?? ''} onChange={(value) => updateEditing('realModelId', value)} />
                  <div className="sm:col-span-2"><Field label={t('modelManagement.registry.fields.endpoint')} value={editingModel.baseUrl ?? ''} onChange={(value) => updateEditing('baseUrl', value)} placeholder="https://api.example.com/v1" /></div>
                  <label className="space-y-1.5 text-sm sm:col-span-2"><span className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{t('modelManagement.registry.fields.apiKey')}</span><Input type="password" value={editingModel.apiKeyDraft === MASKED_SECRET ? MASKED_SECRET : (editingModel.apiKeyDraft ?? '')} placeholder={editingModel.apiKeyConfigured ? t('modelManagement.registry.maskedSecret') : t('modelManagement.registry.unconfiguredSecret')} onFocus={() => updateEditing('apiKeyDraft', editingModel.apiKeyDraft === MASKED_SECRET ? '' : editingModel.apiKeyDraft ?? '')} onChange={(event) => updateEditing('apiKeyDraft', event.target.value)} /><span className="text-xs text-muted-foreground">{editingModel.apiKeyConfigured ? t('modelManagement.registry.keyConfigured') : t('modelManagement.registry.keyNotConfigured')}</span></label>
                </div>

                <fieldset className="space-y-3 border-t border-border pt-4"><legend className="text-sm font-semibold">{t('modelManagement.registry.fields.capabilities')}</legend><div className="grid gap-2 sm:grid-cols-2">{capabilities.map((value) => <label key={value} className="flex min-h-11 items-center gap-3 border border-border px-3 text-sm"><Checkbox checked={editingModel.capabilities.includes(value)} onCheckedChange={(checked) => toggleCapability(value, checked === true)} /><span>{value.replaceAll('_', ' ')}</span></label>)}</div></fieldset>

                <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                  <Field label={t('modelManagement.registry.fields.timeout')} type="number" value={String(editingModel.timeoutSeconds ?? 60)} onChange={(value) => updateEditing('timeoutSeconds', numberValue(value, 60) ?? 60)} />
                  <Field label={t('modelManagement.registry.fields.contextWindow')} type="number" value={editingModel.contextWindowTokens == null ? '' : String(editingModel.contextWindowTokens)} onChange={(value) => updateEditing('contextWindowTokens', numberValue(value))} />
                  <Field label={t('modelManagement.registry.fields.weight')} type="number" value={String(editingModel.weight)} onChange={(value) => updateEditing('weight', numberValue(value, 100) ?? 100)} />
                  <Field label={t('modelManagement.registry.fields.priority')} type="number" value={String(editingModel.priority)} onChange={(value) => updateEditing('priority', numberValue(value, 100) ?? 100)} />
                  <Field label={t('modelManagement.registry.fields.inputPrice')} type="number" value={editingModel.inputPricePerMillion == null ? '' : String(editingModel.inputPricePerMillion)} onChange={(value) => updateEditing('inputPricePerMillion', numberValue(value))} />
                  <Field label={t('modelManagement.registry.fields.outputPrice')} type="number" value={editingModel.outputPricePerMillion == null ? '' : String(editingModel.outputPricePerMillion)} onChange={(value) => updateEditing('outputPricePerMillion', numberValue(value))} />
                  <Field label={t('modelManagement.registry.fields.priceVersion')} value={editingModel.priceVersion ?? ''} onChange={(value) => updateEditing('priceVersion', value)} />
                </div>

                <label className="flex min-h-11 items-center justify-between border border-border px-3 text-sm"><span className="font-medium">{t('modelManagement.registry.fields.enabled')}</span><Checkbox checked={editingModel.enabled} onCheckedChange={(checked) => updateEditing('enabled', checked === true)} /></label>

                <fieldset className="space-y-3 border-t border-border pt-4"><legend className="text-sm font-semibold">{t('modelManagement.registry.tierMembership')}</legend><p className="text-xs text-muted-foreground">{t('modelManagement.registry.tierMembershipHint')}</p><div className="space-y-2">{draft.tiers.map((tier) => <label key={tier.id} className="flex min-h-12 items-center justify-between border border-border px-3"><span className="min-w-0"><span className="block truncate text-sm font-medium">{tier.displayName || tier.id}</span><span className="font-mono text-xs text-muted-foreground">{tier.id} · {tier.members.length} {t('modelManagement.registry.members')}</span></span><Checkbox checked={tier.members.includes(editingModel.id)} onCheckedChange={(checked) => {
                  const members = new Set(tier.members)
                  if (checked === true) members.add(editingModel.id)
                  else members.delete(editingModel.id)
                  onChange({ ...draft, tiers: draft.tiers.map((item) => item.id === tier.id ? { ...item, members: [...members] } : item) })
                }} /></label>)}</div></fieldset>
              </div>
              <SheetFooter className="sticky bottom-0 -mx-6 border-t border-border bg-background/95 px-6 py-4 backdrop-blur"><Button variant="outline" onClick={() => setEditingModel(null)}>{t('common.cancel')}</Button><Button onClick={saveModel} disabled={!editingModel.id.trim()}>{t('common.save')}</Button></SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}

const Field = ({ label, value, onChange, type = 'text', placeholder }: FieldProps) => (
  <label className="space-y-1.5 text-sm"><span className="font-medium">{label}</span><Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>
)
