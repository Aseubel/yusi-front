import { describe, expect, it } from 'vitest'
import type { ModelCapability, ModelGovernanceSnapshot } from './api'
import {
  createRouteDraft,
  createGovernanceDraft,
  getModelDeletionBlockers,
  removeModelFromDraft,
  type GovernanceDraftInput,
  indexRoutes,
  toUpdateRequest,
  validateRouteDraft,
} from './modelRouting'

describe('model governance draft helpers', () => {
  it('indexes routes by scene for the matrix', () => {
    const snapshot = {
      routes: [{
        id: 'chat',
        scene: 'chat',
        primaryTier: 'balanced',
        fallbackTiers: ['fast'],
        riskLevel: 'LOW',
        enabled: true,
        priority: 100,
      }],
    } as ModelGovernanceSnapshot

    const index = indexRoutes(snapshot.routes)

    expect(index.get('chat')?.primaryTier).toBe('balanced')
  })

  it('preserves fallback order and rejects duplicate tiers', () => {
    const draft = createRouteDraft({ primaryTier: 'balanced', fallbackTiers: ['fast', 'fast'] })

    expect(validateRouteDraft(draft)).toContain('duplicateFallbackTier')
  })

  it('does not place a secret placeholder into a new model request', () => {
    const draft: GovernanceDraftInput = {
      ...createRouteDraft({ primaryTier: 'balanced' }),
      models: [{
        id: 'qwen',
        displayName: 'Qwen 主模型',
        provider: 'openai-compatible',
        protocol: 'CHAT_COMPLETIONS' as const,
        baseUrl: 'https://api.example.com/v1',
        realModelId: 'qwen-plus',
        apiKeyConfigured: true,
        apiKeyDraft: '******',
        capabilities: ['CHAT'] as ModelCapability[],
        weight: 100,
        priority: 100,
        scenes: [],
        enabled: true,
      }],
    }

    const request = toUpdateRequest(draft)

    expect(request.models[0]).not.toHaveProperty('apikey')
    expect(request.models[0].apiKey).toBeUndefined()
    expect(request.models[0]).toMatchObject({ displayName: 'Qwen 主模型', protocol: 'CHAT_COMPLETIONS' })
  })

  it('removes a physical model from the registry and every tier membership', () => {
    const draft = createGovernanceDraft({
      version: 4,
      schemaVersion: 2,
      defaultScene: 'chat',
      defaultTier: 'balanced',
      models: [],
      tiers: [
        { id: 'balanced', members: ['qwen', 'deepseek'], enabled: true, capabilities: [], healthyMemberCount: 2, degradedMemberCount: 0, downMemberCount: 0 },
        { id: 'fast', members: ['qwen'], enabled: true, capabilities: [], healthyMemberCount: 1, degradedMemberCount: 0, downMemberCount: 0 },
      ],
      routes: [],
      runtimeStates: [],
      summary: {
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
      },
    } as ModelGovernanceSnapshot)
    draft.models = [{ id: 'qwen' }, { id: 'deepseek' }] as typeof draft.models

    const next = removeModelFromDraft(draft, 'qwen')

    expect(next.models.map((model) => model.id)).toEqual(['deepseek'])
    expect(next.tiers.map((tier) => tier.members)).toEqual([['deepseek'], []])
  })

  it('blocks deletion when the model is the only member of a tier', () => {
    const draft = {
      tiers: [
        { id: 'balanced', members: ['qwen'] },
        { id: 'fallback', members: ['qwen', 'deepseek'] },
      ],
    } as Parameters<typeof getModelDeletionBlockers>[0]

    expect(getModelDeletionBlockers(draft, 'qwen').map((tier) => tier.id)).toEqual(['balanced'])
  })
})
