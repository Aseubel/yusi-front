import type {
  ModelCapability,
  ModelGovernanceModel,
  ModelGovernanceSnapshot,
  ModelGovernanceTier,
  ModelGovernanceUpdateRequest,
  ModelRoutePolicy,
  ModelProtocol,
  ModelSelectionStrategy,
} from './api'

export const MASKED_SECRET = '******'

export interface ModelDraft extends ModelGovernanceModel {
  apiKeyDraft?: string
}

export interface TierDraft extends ModelGovernanceTier {
  strategy: ModelSelectionStrategy
}

export interface RouteDraft extends ModelRoutePolicy {
  fallbackTiers: string[]
}

export interface GovernanceDraft {
  version: number
  schemaVersion: number
  defaultScene: string
  defaultTier: string
  models: ModelDraft[]
  tiers: TierDraft[]
  routes: RouteDraft[]
  defaultRoute: RouteDraft | null
}

export type GovernanceDraftInput = Pick<GovernanceDraft, 'models'> & Partial<Omit<GovernanceDraft, 'models'>>

export const routeKey = (scene: string): string => scene.trim().toLowerCase()

export const requiredCapabilityForScene = (scene: string): ModelCapability | null =>
  routeKey(scene) === 'image-understanding' ? 'VLM' : null

export const modelSupportsScene = (model: Pick<ModelDraft, 'capabilities'>, scene: string): boolean => {
  const capabilities = model.capabilities ?? []
  if (requiredCapabilityForScene(scene) === 'VLM') return capabilities.includes('VLM')
  return capabilities.length === 0 || capabilities.includes('CHAT') || capabilities.includes('STREAMING_CHAT')
}

export const indexRoutes = (routes: ModelRoutePolicy[]): Map<string, ModelRoutePolicy> =>
  new Map(routes.map((route) => [routeKey(route.scene), route]))

export const createRouteDraft = (seed: Partial<RouteDraft> = {}): RouteDraft => ({
  id: seed.id ?? `route-${Date.now()}`,
  scene: seed.scene ?? 'chat',
  riskLevel: seed.riskLevel ?? 'LOW',
  primaryTier: seed.primaryTier ?? '',
  fallbackTiers: [...(seed.fallbackTiers ?? [])],
  maxInputTokens: seed.maxInputTokens ?? null,
  maxOutputTokens: seed.maxOutputTokens ?? null,
  temperature: seed.temperature ?? null,
  topP: seed.topP ?? null,
  maxCompletionTokens: seed.maxCompletionTokens ?? null,
  customParameters: { ...(seed.customParameters ?? {}) },
  enabled: seed.enabled ?? true,
  priority: seed.priority ?? 100,
})

export const createGovernanceDraft = (snapshot: ModelGovernanceSnapshot): GovernanceDraft => ({
  version: snapshot.version,
  schemaVersion: snapshot.schemaVersion,
  defaultScene: snapshot.defaultScene ?? 'chat',
  defaultTier: snapshot.defaultTier ?? snapshot.tiers[0]?.id ?? '',
  models: snapshot.models.map((model) => ({
    ...model,
    protocol: model.protocol ?? 'CHAT_COMPLETIONS',
    apiKeyDraft: model.apiKeyConfigured ? MASKED_SECRET : '',
  })),
  tiers: snapshot.tiers.map((tier) => ({
    ...tier,
    members: [...tier.members],
    capabilities: [...tier.capabilities],
    strategy: tier.strategy ?? 'ROUND_ROBIN',
  })),
  routes: snapshot.routes.map((route) => createRouteDraft(route)),
  defaultRoute: snapshot.defaultRoute ? createRouteDraft(snapshot.defaultRoute) : null,
})

export const validateRouteDraft = (draft: RouteDraft): string[] => {
  const errors: string[] = []
  if (!draft.scene.trim()) errors.push('sceneRequired')
  if (!draft.primaryTier.trim()) errors.push('primaryTierRequired')
  const seen = new Set<string>()
  for (const tier of draft.fallbackTiers) {
    if (seen.has(tier)) errors.push('duplicateFallbackTier')
    seen.add(tier)
  }
  if (seen.has(draft.primaryTier)) errors.push('primaryInFallback')
  if (draft.maxInputTokens != null && draft.maxInputTokens < 0) errors.push('negativeInputTokens')
  if (draft.maxOutputTokens != null && draft.maxOutputTokens < 0) errors.push('negativeOutputTokens')
  if (draft.temperature != null && (draft.temperature < 0 || draft.temperature > 2)) errors.push('temperatureRange')
  if (draft.topP != null && (draft.topP < 0 || draft.topP > 1)) errors.push('topPRange')
  return [...new Set(errors)]
}

export const validateGovernanceDraft = (draft: GovernanceDraft): string[] => {
  const errors = draft.routes.flatMap(validateRouteDraft)
  const routeIds = new Set<string>()
  draft.routes.forEach((route) => {
    if (routeIds.has(route.id)) errors.push('duplicateRouteId')
    routeIds.add(route.id)
  })
  return [...new Set(errors)]
}

export const toUpdateRequest = (draft: GovernanceDraftInput): ModelGovernanceUpdateRequest => ({
  expectedVersion: draft.version ?? 0,
  schemaVersion: draft.schemaVersion ?? 2,
  defaultScene: draft.defaultScene,
  defaultTier: draft.defaultTier,
  models: draft.models.map((model) => ({
    id: model.id,
    displayName: model.displayName ?? undefined,
    provider: model.provider ?? undefined,
    protocol: (model.protocol ?? 'CHAT_COMPLETIONS') as ModelProtocol,
    baseUrl: model.baseUrl ?? undefined,
    model: model.realModelId ?? undefined,
    capabilities: model.capabilities,
    weight: model.weight,
    priority: model.priority,
    scenes: model.scenes,
    enabled: model.enabled,
    timeoutSeconds: model.timeoutSeconds ?? undefined,
    contextWindowTokens: model.contextWindowTokens,
    pricing: {
      inputPerMillion: model.inputPricePerMillion,
      outputPerMillion: model.outputPricePerMillion,
      priceVersion: model.priceVersion,
    },
    ...(model.apiKeyDraft && model.apiKeyDraft !== MASKED_SECRET
      ? { apiKey: model.apiKeyDraft }
      : {}),
  })),
  tiers: Object.fromEntries((draft.tiers ?? []).map((tier) => [tier.id, {
    displayName: tier.displayName ?? undefined,
    description: tier.description ?? undefined,
    members: [...tier.members],
    strategy: tier.strategy,
    enabled: tier.enabled,
    capabilities: tier.capabilities,
  }])),
  routes: (draft.routes ?? []).map((route) => ({
    ...route,
    fallbackTiers: [...route.fallbackTiers],
  })),
  defaultRoute: draft.defaultRoute ? { ...draft.defaultRoute, fallbackTiers: [...draft.defaultRoute.fallbackTiers] } : null,
})

export const isDraftDirty = (draft: GovernanceDraft, snapshot: ModelGovernanceSnapshot): boolean =>
  JSON.stringify(toUpdateRequest(draft)) !== JSON.stringify(toUpdateRequest(createGovernanceDraft(snapshot)))

export const moveFallback = (draft: RouteDraft, index: number, direction: -1 | 1): RouteDraft => {
  const nextIndex = index + direction
  if (index < 0 || index >= draft.fallbackTiers.length || nextIndex < 0 || nextIndex >= draft.fallbackTiers.length) {
    return draft
  }
  const fallbackTiers = [...draft.fallbackTiers]
  ;[fallbackTiers[index], fallbackTiers[nextIndex]] = [fallbackTiers[nextIndex], fallbackTiers[index]]
  return { ...draft, fallbackTiers }
}

export const updateTierMembers = (draft: GovernanceDraft, tierId: string, modelId: string, included: boolean): GovernanceDraft => ({
  ...draft,
  tiers: draft.tiers.map((tier) => {
    if (tier.id !== tierId) return tier
    const members = new Set(tier.members)
    if (included) members.add(modelId)
    else members.delete(modelId)
    return { ...tier, members: [...members] }
  }),
})

export const getModelDeletionBlockers = (draft: GovernanceDraft, modelId: string): TierDraft[] =>
  draft.tiers.filter((tier) => tier.members.includes(modelId) && tier.members.length <= 1)

export const removeModelFromDraft = (draft: GovernanceDraft, modelId: string): GovernanceDraft => ({
  ...draft,
  models: draft.models.filter((model) => model.id !== modelId),
  tiers: draft.tiers.map((tier) => ({
    ...tier,
    members: tier.members.filter((member) => member !== modelId),
  })),
})

export const capabilitiesLabel = (capabilities: ModelCapability[]): string => capabilities.join(', ')
