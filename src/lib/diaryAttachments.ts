export type DiaryAttachmentType = 'IMAGE' | 'AUDIO' | (string & {})

export interface DiaryAttachmentAnchor {
  kind: 'TEXT_RANGE'
  start: number
  end: number
  quote: string
  prefix?: string
  suffix?: string
}

export interface DiaryAttachmentBinding {
  type: DiaryAttachmentType
  objectKey: string
  paragraphId: string
  sortOrder: number
  anchor: DiaryAttachmentAnchor
  url?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
)

const parseAnchor = (value: unknown): DiaryAttachmentAnchor | undefined => {
  if (!isRecord(value) || value.kind !== 'TEXT_RANGE' || typeof value.start !== 'number'
    || typeof value.end !== 'number' || typeof value.quote !== 'string') {
    return undefined
  }
  if (!Number.isInteger(value.start) || !Number.isInteger(value.end)
    || value.start < 0 || value.end <= value.start || !value.quote) return undefined

  return {
    kind: value.kind,
    start: value.start,
    end: value.end,
    quote: value.quote,
    ...(typeof value.prefix === 'string' ? { prefix: value.prefix } : {}),
    ...(typeof value.suffix === 'string' ? { suffix: value.suffix } : {}),
  }
}

export const parseDiaryAttachmentBindings = (value: unknown): DiaryAttachmentBinding[] => {
  if (!Array.isArray(value)) return []

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return []
    const type = typeof item.type === 'string' ? item.type : ''
    const objectKey = typeof item.objectKey === 'string' ? item.objectKey : ''
    const paragraphId = typeof item.paragraphId === 'string' ? item.paragraphId : ''
    if (!type || !objectKey || !paragraphId) return []

    const anchor = parseAnchor(item.anchor)
    if (!anchor) return []
    return [{
      type,
      objectKey,
      paragraphId,
      sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
      anchor,
      url: typeof item.url === 'string' ? item.url : undefined,
    }]
  })
}

export const serializeDiaryAttachmentBindings = (bindings: DiaryAttachmentBinding[]): DiaryAttachmentBinding[] => (
  bindings.map(({ type, objectKey, paragraphId, sortOrder, anchor }) => {
    return { type, objectKey, paragraphId, sortOrder, anchor: { ...anchor } }
  })
)

export const sortDiaryAttachmentBindings = (bindings: DiaryAttachmentBinding[]): DiaryAttachmentBinding[] => (
  [...bindings].sort((left, right) => left.sortOrder - right.sortOrder)
)

const getNodeText = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (!(node instanceof HTMLElement)) return ''
  if (node.tagName === 'BR') return '\n'
  if (node.tagName === 'IMG') return '\uFFFC'
  return Array.from(node.childNodes).map(getNodeText).join('')
}

const findAllOccurrences = (text: string, quote: string): number[] => {
  if (!quote) return []
  const matches: number[] = []
  let start = 0
  while (start <= text.length - quote.length) {
    const index = text.indexOf(quote, start)
    if (index < 0) break
    matches.push(index)
    start = index + 1
  }
  return matches
}

const matchesContext = (text: string, anchor: DiaryAttachmentAnchor, start: number): boolean => {
  const prefixMatches = !anchor.prefix || text.slice(Math.max(0, start - anchor.prefix.length), start) === anchor.prefix
  const suffixStart = start + anchor.quote.length
  const suffixMatches = !anchor.suffix || text.slice(suffixStart, suffixStart + anchor.suffix.length) === anchor.suffix
  return prefixMatches && suffixMatches
}

export const locateDiaryAttachmentAnchor = (
  paragraphText: string,
  anchor: DiaryAttachmentAnchor,
): DiaryAttachmentAnchor | null => {
  const storedQuote = paragraphText.slice(anchor.start, anchor.end)
  if (storedQuote === anchor.quote && matchesContext(paragraphText, anchor, anchor.start)) {
    return anchor
  }

  const candidates = findAllOccurrences(paragraphText, anchor.quote)
  const contextualCandidates = candidates.filter((start) => matchesContext(paragraphText, anchor, start))
  const nextStart = contextualCandidates.length === 1
    ? contextualCandidates[0]
    : candidates.length === 1
      ? candidates[0]
      : null
  if (nextStart === null || nextStart === undefined) return null

  return {
    ...anchor,
    start: nextStart,
    end: nextStart + anchor.quote.length,
    prefix: paragraphText.slice(Math.max(0, nextStart - 32), nextStart),
    suffix: paragraphText.slice(nextStart + anchor.quote.length, nextStart + anchor.quote.length + 32),
  }
}

export interface DiaryAttachmentReconciliation {
  bindings: DiaryAttachmentBinding[]
  staleObjectKeys: string[]
}

export const reconcileDiaryAttachmentBindings = (
  content: string,
  bindings: DiaryAttachmentBinding[],
): DiaryAttachmentReconciliation => {
  if (!bindings.length || typeof document === 'undefined') {
    return { bindings, staleObjectKeys: [] }
  }

  const container = document.createElement('div')
  container.innerHTML = content
  const paragraphTextById = new Map<string, string>()
  container.querySelectorAll('[data-paragraph-id]').forEach((paragraph) => {
    const paragraphId = paragraph.getAttribute('data-paragraph-id')
    if (paragraphId) paragraphTextById.set(paragraphId, getNodeText(paragraph))
  })

  const staleObjectKeys = new Set<string>()
  const nextBindings = bindings.map((binding) => {
    const paragraphText = paragraphTextById.get(binding.paragraphId)
    if (paragraphText === undefined) {
      staleObjectKeys.add(binding.objectKey)
      return binding
    }
    if (!binding.anchor || binding.anchor.kind !== 'TEXT_RANGE') {
      staleObjectKeys.add(binding.objectKey)
      return binding
    }
    const nextAnchor = locateDiaryAttachmentAnchor(paragraphText, binding.anchor)
    if (!nextAnchor) {
      staleObjectKeys.add(binding.objectKey)
      return binding
    }
    if (nextAnchor.start === binding.anchor.start
      && nextAnchor.end === binding.anchor.end
      && nextAnchor.prefix === binding.anchor.prefix
      && nextAnchor.suffix === binding.anchor.suffix) {
      return binding
    }
    return { ...binding, anchor: nextAnchor }
  })

  return { bindings: nextBindings, staleObjectKeys: Array.from(staleObjectKeys) }
}

export const getDiaryAttachmentAnchorText = (element: HTMLElement): string => getNodeText(element)
