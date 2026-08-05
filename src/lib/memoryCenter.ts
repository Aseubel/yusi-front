export type MemoryCenterSection =
  | 'MID_TERM'
  | 'PERSONA'
  | 'RELATIONSHIP_GRAPH'
  | 'TIMELINE'
  | 'SOUL_REPORT'

const memoryCenterSectionValues: readonly MemoryCenterSection[] = [
  'MID_TERM',
  'PERSONA',
  'RELATIONSHIP_GRAPH',
  'TIMELINE',
  'SOUL_REPORT',
]

export const getMemoryCenterSection = (value: string | null | undefined): MemoryCenterSection =>
  memoryCenterSectionValues.includes(value as MemoryCenterSection)
    ? value as MemoryCenterSection
    : 'MID_TERM'

export const isLifecycleActive = (status: string) => status === 'ACTIVE'

export const canUseForMatching = (status: string, matchAllowed: boolean) =>
  isLifecycleActive(status) && matchAllowed

export const formatPercent = (value: number | null | undefined) =>
  `${Math.round((value ?? 0) * 100)}%`
