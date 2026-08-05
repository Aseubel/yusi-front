import { describe, expect, it } from 'vitest'
import type { ModelCapability, ModelGovernanceSnapshot } from './api'
import {
  createRouteDraft,
  indexRoutes,
  toUpdateRequest,
  validateRouteDraft,
} from './modelRouting'

describe('model governance draft helpers', () => {
  it('indexes routes by language and scene for the matrix', () => {
    const snapshot = {
      routes: [{
        id: 'zh-chat',
        language: 'zh',
        scene: 'chat',
        primaryTier: 'balanced',
        fallbackTiers: ['fast'],
        riskLevel: 'LOW',
        enabled: true,
        priority: 100,
      }],
    } as ModelGovernanceSnapshot

    const index = indexRoutes(snapshot.routes)

    expect(index.get('zh::chat')?.primaryTier).toBe('balanced')
  })

  it('preserves fallback order and rejects duplicate tiers', () => {
    const draft = createRouteDraft({ primaryTier: 'balanced', fallbackTiers: ['fast', 'fast'] })

    expect(validateRouteDraft(draft)).toContain('duplicateFallbackTier')
  })

  it('does not place a secret placeholder into a new model request', () => {
    const draft = {
      ...createRouteDraft({ primaryTier: 'balanced' }),
      models: [{
        id: 'qwen',
        displayName: 'Qwen 主模型',
        provider: 'openai-compatible',
        baseUrl: 'https://api.example.com/v1',
        realModelId: 'qwen-plus',
        apiKeyConfigured: true,
        apiKeyDraft: '******',
        capabilities: ['CHAT'] as ModelCapability[],
        weight: 100,
        priority: 100,
        languages: [],
        scenes: [],
        enabled: true,
      }],
    }

    const request = toUpdateRequest(draft)

    expect(request.models[0]).not.toHaveProperty('apikey')
    expect(request.models[0].apiKey).toBeUndefined()
    expect(request.models[0]).toMatchObject({ displayName: 'Qwen 主模型' })
  })
})
