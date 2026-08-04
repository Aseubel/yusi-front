import { describe, expect, it } from 'vitest'
import { canUseForMatching, isLifecycleActive } from './memoryCenter'

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
})
