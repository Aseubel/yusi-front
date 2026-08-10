import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Check, CircleAlert, Eye, Trash2 } from 'lucide-react'
import { Badge, Button, Checkbox, Input, Select } from '../../../components/ui'
import { modelSupportsScene, moveFallback, validateRouteDraft, type ModelDraft, type RouteDraft, type TierDraft } from '../../../lib/modelRouting'

interface RoutePolicyEditorProps {
  route: RouteDraft
  tiers: TierDraft[]
  models: ModelDraft[]
  onChange: (route: RouteDraft) => void
  onTierStrategyChange: (tierId: string, strategy: TierDraft['strategy']) => void
  onPreview: (route: RouteDraft) => void
}

const riskLevels = ['LOW', 'MEDIUM', 'HIGH']

export const RoutePolicyEditor = ({ route, tiers, models, onChange, onTierStrategyChange, onPreview }: RoutePolicyEditorProps) => {
  const { t } = useTranslation()
  const [fallbackSelect, setFallbackSelect] = useState('NONE')
  const errors = useMemo(() => validateRouteDraft(route), [route])
  const primaryTier = tiers.find((tier) => tier.id === route.primaryTier)
  const primaryMembers = new Set(primaryTier?.members ?? [])
  const usableTier = (tier: TierDraft): boolean => tier.enabled && tier.members.some((memberId) => {
    const model = models.find((item) => item.id === memberId)
    return Boolean(model?.enabled && modelSupportsScene(model, route.scene))
  })
  const availableFallbacks = tiers.filter((tier) => tier.id !== route.primaryTier && !route.fallbackTiers.includes(tier.id))
  const update = <K extends keyof RouteDraft>(key: K, value: RouteDraft[K]) => onChange({ ...route, [key]: value })
  const error = (key: string) => errors.includes(key) ? <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-300"><CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />{t(`modelManagement.routes.validation.${key}`)}</p> : null

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card/30 p-4 shadow-sm md:p-6" aria-labelledby="route-policy-editor-heading">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">{route.id}</p><h3 id="route-policy-editor-heading" className="mt-1 text-lg font-semibold">{t('modelManagement.routes.editorTitle')}</h3><p className="mt-1 text-sm text-muted-foreground">{t('modelManagement.routes.editorDescription')}</p></div>
        <div className="flex items-center gap-2"><label className="flex min-h-10 items-center gap-2 border border-border px-3 text-sm"><Checkbox checked={route.enabled} onCheckedChange={(checked) => update('enabled', checked === true)} />{t('modelManagement.routes.enabled')}</label><Button variant="outline" size="sm" onClick={() => onPreview(route)} disabled={errors.length > 0} className="gap-2"><Eye className="h-4 w-4" aria-hidden="true" />{t('modelManagement.preview.action')}</Button></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm"><span className="font-medium">{t('modelManagement.routes.scene')}</span><Input value={route.scene} onChange={(event) => update('scene', event.target.value)} placeholder={t('modelManagement.routes.scenePlaceholder')} />{error('sceneRequired')}</label>
      </div>

      <fieldset className="space-y-2"><legend className="text-sm font-semibold">{t('modelManagement.routes.risk')}</legend><div className="grid grid-cols-3 gap-2">{riskLevels.map((level) => <Button key={level} type="button" variant="ghost" aria-pressed={route.riskLevel === level} onClick={() => update('riskLevel', level)} className={`h-auto min-h-11 rounded-xl border px-3 text-sm font-medium active:scale-100 ${route.riskLevel === level ? level === 'HIGH' ? 'border-rose-400 bg-rose-50 text-rose-700 hover:bg-rose-50 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/30' : level === 'MEDIUM' ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/30' : 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/30' : 'border-border text-muted-foreground hover:bg-muted/40'}`}>{level}</Button>)}</div></fieldset>

      <fieldset className="space-y-3"><legend className="text-sm font-semibold">{t('modelManagement.routes.primaryTier')}</legend><div className="grid gap-2 sm:grid-cols-2">{tiers.map((tier) => { const selectable = usableTier(tier); return <Button key={tier.id} type="button" variant="ghost" disabled={!selectable} aria-pressed={route.primaryTier === tier.id} onClick={() => update('primaryTier', tier.id)} className={`h-auto min-h-[88px] justify-start rounded-xl border p-3 text-left active:scale-100 disabled:cursor-not-allowed ${route.primaryTier === tier.id ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'border-border hover:bg-muted/30'}`}><span className="block w-full"><span className="flex items-start justify-between gap-2"><span className="font-mono text-sm font-semibold">{tier.id}</span>{route.primaryTier === tier.id && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}</span><span className="mt-2 block text-xs text-muted-foreground">{tier.members.length} {t('modelManagement.registry.members')} · {tier.healthyMemberCount} {t('modelManagement.registry.healthy')}</span>{!selectable && <span className="mt-1 block text-xs text-rose-600 dark:text-rose-300">{t('modelManagement.routes.unavailableTier')}</span>}</span></Button> })}</div>{error('primaryTierRequired')}</fieldset>

      <fieldset className="space-y-3"><div className="flex items-center justify-between gap-3"><legend className="text-sm font-semibold">{t('modelManagement.routes.fallbackTiers')}</legend><span className="text-xs text-muted-foreground">{t('modelManagement.routes.orderMatters')}</span></div><div className="space-y-2">{route.fallbackTiers.map((tierId, index) => <div key={`${tierId}-${index}`} className="flex min-h-12 items-center gap-2 border border-border px-3"><span className="w-5 font-mono text-xs text-muted-foreground">{index + 1}</span><span className="min-w-0 flex-1 font-mono text-sm">{tierId}</span><Button variant="ghost" size="icon" onClick={() => onChange(moveFallback(route, index, -1))} disabled={index === 0} aria-label={t('modelManagement.routes.moveUp')} title={t('modelManagement.routes.moveUp')}><ArrowUp className="h-4 w-4" aria-hidden="true" /></Button><Button variant="ghost" size="icon" onClick={() => onChange(moveFallback(route, index, 1))} disabled={index === route.fallbackTiers.length - 1} aria-label={t('modelManagement.routes.moveDown')} title={t('modelManagement.routes.moveDown')}><ArrowDown className="h-4 w-4" aria-hidden="true" /></Button><Button variant="ghost" size="icon" onClick={() => update('fallbackTiers', route.fallbackTiers.filter((_, itemIndex) => itemIndex !== index))} aria-label={t('modelManagement.routes.removeFallback')} title={t('modelManagement.routes.removeFallback')}><Trash2 className="h-4 w-4 text-rose-500" aria-hidden="true" /></Button></div>)}</div><Select value={fallbackSelect} onValueChange={(value) => { setFallbackSelect('NONE'); if (value !== 'NONE') update('fallbackTiers', [...route.fallbackTiers, value]) }} options={[{ value: 'NONE', label: t('modelManagement.routes.addFallback') }, ...availableFallbacks.map((tier) => ({ value: tier.id, label: `${tier.id} · ${tier.members.length} ${t('modelManagement.registry.members')}` }))]} />{error('duplicateFallbackTier')}{error('primaryInFallback')}</fieldset>

      <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm sm:col-span-2"><span className="font-medium">{t('modelManagement.routes.strategy')}</span><Select value={primaryTier?.strategy ?? 'ROUND_ROBIN'} onValueChange={(value) => {
        const strategy = value as TierDraft['strategy']
        // Strategy is a tier-level setting; the editor keeps route changes local and the page applies it to the selected tier.
        if (primaryTier) onTierStrategyChange(primaryTier.id, strategy)
      }} options={[
        { value: 'ROUND_ROBIN', label: t('modelManagement.strategy.roundRobin') + ' · ' + t('modelManagement.routes.strategyDescriptions.roundRobin') },
        { value: 'LEAST_LATENCY', label: t('modelManagement.strategy.leastLatency') + ' · ' + t('modelManagement.routes.strategyDescriptions.leastLatency') },
        { value: 'WEIGHTED_RANDOM', label: t('modelManagement.strategy.weightedRandom') + ' · ' + t('modelManagement.routes.strategyDescriptions.weightedRandom') },
        { value: 'FAIL_OVER', label: t('modelManagement.strategy.failOver') + ' · ' + t('modelManagement.routes.strategyDescriptions.failOver') },
      ]} /></label><NumericField label={t('modelManagement.routes.maxInputTokens')} value={route.maxInputTokens} onChange={(value) => update('maxInputTokens', value)} error={error('negativeInputTokens')} /><NumericField label={t('modelManagement.routes.maxOutputTokens')} value={route.maxOutputTokens} onChange={(value) => update('maxOutputTokens', value)} error={error('negativeOutputTokens')} /><NumericField label={t('modelManagement.routes.temperature')} value={route.temperature} step="0.1" onChange={(value) => update('temperature', value)} error={error('temperatureRange')} /><NumericField label={t('modelManagement.routes.topP')} value={route.topP} step="0.05" onChange={(value) => update('topP', value)} error={error('topPRange')} /><NumericField label={t('modelManagement.routes.priority')} value={route.priority} onChange={(value) => update('priority', value ?? 100)} /></div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div className="flex flex-wrap gap-1.5">{models.filter((model) => primaryMembers.has(model.id)).slice(0, 5).map((model) => <Badge key={model.id} variant="secondary" className="font-mono text-[10px]">{model.id}</Badge>)}{primaryMembers.size > 5 && <Badge variant="outline">+{primaryMembers.size - 5}</Badge>}</div><Button onClick={() => onPreview(route)} disabled={errors.length > 0} className="gap-2"><Eye className="h-4 w-4" aria-hidden="true" />{t('modelManagement.preview.action')}</Button></div>
    </section>
  )
}

const NumericField = ({ label, value, onChange, step = '1', error }: { label: string; value: number | null | undefined; step?: string; onChange: (value: number | null) => void; error?: React.ReactNode }) => <label className="space-y-1.5 text-sm"><span className="font-medium">{label}</span><Input type="number" min="0" step={step} value={value == null ? '' : String(value)} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} />{error}</label>
