import { describe, expect, it } from 'vitest'
import type { LifeGraphMemoryItem } from './api'
import {
  canUseForMatching,
  getMemoryCenterSection,
  isDisplayablePersonRelation,
  isLifecycleActive,
} from './memoryCenter'

const personMemory: LifeGraphMemoryItem = {
  id: 1,
  type: 'Person',
  displayName: 'fixture-person',
  summary: null,
  mentionCount: 1,
  relationCount: 1,
  confidence: 0.9,
  importance: 0.8,
  relationToUser: 'FAMILY_OF',
  relationOrigin: 'MANUAL',
  createdAt: null,
  updatedAt: null,
  validUntil: null,
  matchAllowed: true,
  hidden: false,
  lifecycleStatus: 'ACTIVE',
  sources: [],
}

describe('memory center lifecycle helpers', () => {
  it('only treats active records as lifecycle active', () => {
    expect(isLifecycleActive('ACTIVE')).toBe(true)
    expect(isLifecycleActive('HIDDEN')).toBe(false)
    expect(isLifecycleActive('EXPIRED')).toBe(false)
    expect(isLifecycleActive('MERGED')).toBe(false)
  })

  it('requires both active lifecycle and explicit matching authorization', () => {
    expect(canUseForMatching('ACTIVE', true)).toBe(true)
    expect(canUseForMatching('ACTIVE', false)).toBe(false)
    expect(canUseForMatching('HIDDEN', true)).toBe(false)
    expect(canUseForMatching('EXPIRED', true)).toBe(false)
    expect(canUseForMatching('MERGED', true)).toBe(false)
  })

  it('accepts supported URL sections and falls back to mid-term memory', () => {
    expect(getMemoryCenterSection('TIMELINE')).toBe('TIMELINE')
    expect(getMemoryCenterSection('SOUL_REPORT')).toBe('SOUL_REPORT')
    expect(getMemoryCenterSection('unknown')).toBe('MID_TERM')
    expect(getMemoryCenterSection(null)).toBe('MID_TERM')
  })

  it('accepts the read-only lifegraph relation contract', () => {
    expect(personMemory.relationOrigin).toBe('MANUAL')
    expect(personMemory.importance).toBe(0.8)
  })

  it('only displays known person relations with complete provenance', () => {
    expect(isDisplayablePersonRelation(personMemory)).toBe(true)
    expect(isDisplayablePersonRelation({
      type: 'Topic',
      relationToUser: 'FAMILY_OF',
      relationOrigin: 'MANUAL',
    })).toBe(false)
    expect(isDisplayablePersonRelation({
      type: 'Person',
      relationToUser: null,
      relationOrigin: null,
    })).toBe(false)
    expect(isDisplayablePersonRelation({
      type: 'Person',
      relationToUser: 'FUTURE_RELATION',
      relationOrigin: 'MANUAL',
    })).toBe(false)
  })
})
