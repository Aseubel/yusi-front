export type MemoryCenterSection = 'MID_TERM' | 'PERSONA' | 'RELATIONSHIP_GRAPH'

export const isLifecycleActive = (status: string) => status === 'ACTIVE'

export const canUseForMatching = (status: string, matchAllowed: boolean) =>
  isLifecycleActive(status) && matchAllowed

export const formatPercent = (value: number | null | undefined) =>
  `${Math.round((value ?? 0) * 100)}%`
