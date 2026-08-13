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

export interface DiaryGraphemeRange {
  start: number
  end: number
  text: string
}

const getGraphemeSegments = (text: string): DiaryGraphemeRange[] => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const Segmenter = Intl.Segmenter as typeof Intl.Segmenter
    const segmenter = new Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), ({ index, segment }) => ({
      start: index,
      end: index + segment.length,
      text: segment,
    }))
  }

  const isGraphemeExtender = (segment: string): boolean => {
    const codePoint = segment.codePointAt(0) || 0
    return (codePoint >= 0x0300 && codePoint <= 0x036f)
      || (codePoint >= 0x0483 && codePoint <= 0x0489)
      || (codePoint >= 0x0591 && codePoint <= 0x05bd)
      || (codePoint >= 0x0610 && codePoint <= 0x061a)
      || (codePoint >= 0x064b && codePoint <= 0x065f)
      || (codePoint >= 0x0670 && codePoint <= 0x0670)
      || (codePoint >= 0x06d6 && codePoint <= 0x06ed)
      || (codePoint >= 0x1ab0 && codePoint <= 0x1aff)
      || (codePoint >= 0x1dc0 && codePoint <= 0x1dff)
      || (codePoint >= 0x20d0 && codePoint <= 0x20ff)
      || (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
      || (codePoint >= 0x1f3fb && codePoint <= 0x1f3ff)
      || (codePoint >= 0xe0100 && codePoint <= 0xe01ef)
  }

  let offset = 0
  let regionalIndicatorCount = 0
  const graphemes: DiaryGraphemeRange[] = []
  Array.from(text).forEach((segment) => {
    const start = offset
    offset += segment.length
    const previous = graphemes[graphemes.length - 1]
    const previousCodePoint = previous?.text.codePointAt(previous.text.length - 1)
    const codePoint = segment.codePointAt(0) || 0
    const isRegionalIndicator = codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff
    const joinsPrevious = Boolean(previous)
      && (isGraphemeExtender(segment) || previousCodePoint === 0x200d || segment === '\u200d')
      || (isRegionalIndicator && regionalIndicatorCount % 2 === 1)

    if (joinsPrevious && previous) {
      previous.end = offset
      previous.text += segment
    } else {
      graphemes.push({ start, end: offset, text: segment })
    }

    regionalIndicatorCount = isRegionalIndicator
      ? regionalIndicatorCount + 1
      : 0
  })
  return graphemes
}

export const getLastValidGraphemeRange = (
  text: string,
  start: number,
  end: number,
): DiaryGraphemeRange | null => {
  const selectionStart = Math.max(0, start)
  const selectionEnd = Math.min(text.length, end)
  if (selectionStart >= selectionEnd) return null

  const graphemes = getGraphemeSegments(text)
  for (let index = graphemes.length - 1; index >= 0; index -= 1) {
    const grapheme = graphemes[index]
    if (!grapheme || grapheme.start < selectionStart || grapheme.end > selectionEnd) continue
    if (grapheme.text.trim()) return grapheme
  }
  return null
}

export interface DiaryVisualRect {
  top: number
  bottom: number
}

export const areDiaryRectsOnSameVisualLine = (
  left: DiaryVisualRect,
  right: DiaryVisualRect,
  tolerance = 2,
): boolean => {
  const overlap = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top)
  return overlap >= 0 || -overlap <= Math.max(0, tolerance)
}

export interface DiaryImageVisualLineCandidate {
  paragraphId: string
  objectKey: string
  sortOrder: number
  rect: DiaryVisualRect
}

export interface DiaryImageBindingGroup {
  paragraphId: string
  objectKeys: string[]
}

export const groupImageBindingsByVisualLine = (
  candidates: DiaryImageVisualLineCandidate[],
  tolerance = 2,
): DiaryImageBindingGroup[] => {
  const groups: Array<DiaryImageBindingGroup & { rect: DiaryVisualRect }> = []
  const seenObjectKeys = new Set<string>()

  candidates.slice()
    .filter((candidate) => Boolean(candidate.paragraphId && candidate.objectKey))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((candidate) => {
      const seenKey = `${candidate.paragraphId}\u0000${candidate.objectKey}`
      if (seenObjectKeys.has(seenKey)) return

      const group = groups.find((current) => (
        current.paragraphId === candidate.paragraphId
        && areDiaryRectsOnSameVisualLine(current.rect, candidate.rect, tolerance)
      ))
      if (group) {
        group.objectKeys.push(candidate.objectKey)
        seenObjectKeys.add(seenKey)
        return
      }

      groups.push({
        paragraphId: candidate.paragraphId,
        objectKeys: [candidate.objectKey],
        rect: candidate.rect,
      })
      seenObjectKeys.add(seenKey)
    })

  return groups.map(({ paragraphId, objectKeys }) => ({ paragraphId, objectKeys }))
}

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
