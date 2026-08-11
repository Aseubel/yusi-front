import { AudioLines, Images, Pause, Play, X } from 'lucide-react'
import DOMPurify from 'dompurify'
import { createPortal } from 'react-dom'
import { createElement, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'
import { DiaryImageGallery } from './DiaryImageGallery'
import { cn } from '../utils'
import {
  getDiaryAttachmentAnchorText,
  locateDiaryAttachmentAnchor,
  sortDiaryAttachmentBindings,
  type DiaryAttachmentAnchor,
  type DiaryAttachmentBinding,
} from '../lib/diaryAttachments'

interface DiaryAttachmentRailProps {
  bindings: DiaryAttachmentBinding[]
  className?: string
}

const WAVEFORM_HEIGHTS = [8, 14, 20, 12, 24, 16, 10, 18, 26, 14, 22, 11, 19, 27, 15, 9, 17, 23, 13, 21, 10, 16, 25, 14, 19, 11, 22, 15]

const formatAudioTime = (seconds: number, emptyValue = '0:00') => {
  if (!Number.isFinite(seconds) || seconds < 0) return emptyValue
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const DiaryAudioAttachment = ({ binding }: { binding: DiaryAttachmentBinding }) => {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const handleDurationChange = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handlePlay = () => setPlaying(true)
    const handlePause = () => setPlaying(false)
    const handleEnded = () => {
      setPlaying(false)
      setCurrentTime(audio.duration || 0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) handleLoadedMetadata()

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [binding.url])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      if (audio.ended) audio.currentTime = 0
      try {
        await audio.play()
      } catch {
        setPlaying(false)
      }
      return
    }
    audio.pause()
  }

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0

  return (
    <div className="not-prose flex min-w-0 items-center gap-3 rounded-2xl border border-primary/15 bg-primary/[0.035] px-3 py-2.5 shadow-sm shadow-primary/5">
      <audio ref={audioRef} src={binding.url} preload="metadata" className="sr-only" aria-hidden="true" />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-full text-primary hover:bg-primary/15"
        aria-label={t(playing ? 'diary.attachments.pauseAudio' : 'diary.attachments.playAudio')}
        title={t(playing ? 'diary.attachments.pauseAudio' : 'diary.attachments.playAudio')}
        onClick={() => void togglePlayback()}
      >
        {playing ? <Pause className="h-4 w-4 fill-current" aria-hidden="true" /> : <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />}
      </Button>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex h-7 items-center gap-1" aria-hidden="true">
          {WAVEFORM_HEIGHTS.map((height, index) => (
            <span
              key={`${binding.objectKey}-${index}`}
              className={cn('w-1 shrink-0 rounded-full transition-colors duration-150', index / WAVEFORM_HEIGHTS.length <= progress ? 'bg-primary' : 'bg-primary/25')}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-[11px] tabular-nums text-muted-foreground">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration, '--:--')}</span>
        </div>
      </div>
      <AudioLines className="h-4 w-4 shrink-0 text-primary/60" aria-hidden="true" />
    </div>
  )
}

interface DiaryImagePopoverProps {
  urls: string[]
}

const DiaryImagePopover = ({ urls }: DiaryImagePopoverProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [panelPosition, setPanelPosition] = useState<{ left: number; top: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const panelId = `diary-attachment-panel-${useId().replace(/:/g, '')}`

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const triggerRect = trigger.getBoundingClientRect()
    const panelWidth = panelRef.current?.offsetWidth || 288
    const panelHeight = panelRef.current?.offsetHeight || 360
    const viewportPadding = 12
    const gap = 12
    const isNarrowViewport = window.innerWidth < 768

    if (isNarrowViewport) {
      setPanelPosition({
        left: Math.max(viewportPadding, (window.innerWidth - panelWidth) / 2),
        top: Math.max(
          viewportPadding,
          Math.min(triggerRect.bottom + gap, window.innerHeight - panelHeight - viewportPadding),
        ),
      })
      return
    }

    const opensRight = triggerRect.right + gap + panelWidth <= window.innerWidth - viewportPadding
    setPanelPosition({
      left: opensRight
        ? triggerRect.right + gap
        : Math.max(viewportPadding, triggerRect.left - panelWidth - gap),
      top: Math.min(
        Math.max(viewportPadding, triggerRect.top - 8),
        Math.max(viewportPadding, window.innerHeight - panelHeight - viewportPadding),
      ),
    })
  }, [])

  useEffect(() => {
    if (!expanded) return

    updatePanelPosition()
    const handleResize = () => updatePanelPosition()
    const handleScroll = () => updatePanelPosition()
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setExpanded(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [expanded, updatePanelPosition])

  const toggleImages = () => {
    if (expanded) {
      setExpanded(false)
      return
    }

    const triggerRect = triggerRef.current?.getBoundingClientRect()
    if (triggerRect) {
      setPanelPosition({ left: triggerRect.right + 12, top: triggerRect.top - 8 })
    }
    setExpanded(true)
  }

  if (urls.length === 0) return null

  const panel = expanded && panelPosition && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-label={t('diary.images.galleryTitle')}
        className="fixed z-[70] max-h-[min(30rem,calc(100vh-1.5rem))] w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-primary/20 bg-background/95 p-2 shadow-2xl shadow-primary/15 backdrop-blur-xl"
        style={{ left: panelPosition.left, top: panelPosition.top }}
      >
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            aria-label={t('common.close')}
            title={t('common.close')}
            onClick={() => setExpanded(false)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="max-h-[calc(min(30rem,100vh-1.5rem)-3rem)] overflow-y-auto px-1 pb-1">
          <DiaryImageGallery urls={urls} showHeader={false} className="border-0 pt-0" />
        </div>
      </div>,
      document.body,
    )
    : null

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        className="inline-flex h-[1.15em] w-[1.15em] translate-y-[0.08em] rounded-full align-middle text-primary/90 hover:bg-primary/10"
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={t('diary.attachments.toggle')}
        title={t('diary.attachments.toggle')}
        onClick={toggleImages}
      >
        <Images className={cn('h-[0.8em] w-[0.8em] transition-transform duration-200', expanded && 'scale-110')} aria-hidden="true" />
      </Button>
      {panel}
    </>
  )
}

export const DiaryAttachmentRail = ({ bindings, className }: DiaryAttachmentRailProps) => {
  const visibleBindings = useMemo(
    () => sortDiaryAttachmentBindings(bindings).filter((binding) => binding.type === 'AUDIO' && Boolean(binding.url)),
    [bindings],
  )

  if (visibleBindings.length === 0) return null

  return (
    <div className={cn('not-prose relative mt-3 space-y-3', className)}>
      {visibleBindings.map((binding) => (
        <DiaryAudioAttachment key={`${binding.objectKey}-${binding.paragraphId}`} binding={binding} />
      ))}
    </div>
  )
}

interface DiaryBodyProps {
  content: string
  bindings: DiaryAttachmentBinding[]
}

interface DiaryInlineAttachmentGroup {
  start: number
  end: number
  anchor: DiaryAttachmentAnchor
  paragraphId: string
  urls: string[]
}

interface DiaryInlineRenderContext {
  offset: number
  groups: DiaryInlineAttachmentGroup[]
}

interface DiaryParagraphRenderData {
  groups: DiaryInlineAttachmentGroup[]
}

interface DiaryDomBoundary {
  node: Node
  offset: number
}

const getChildIndex = (node: Node): number => {
  if (!node.parentNode) return 0
  return Array.prototype.indexOf.call(node.parentNode.childNodes, node)
}

const findTextBoundary = (root: HTMLElement, targetOffset: number): DiaryDomBoundary => {
  let consumed = 0
  let lastBoundary: DiaryDomBoundary = { node: root, offset: root.childNodes.length }

  const visit = (node: Node): DiaryDomBoundary | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text
      const length = textNode.data.length
      if (targetOffset <= consumed + length) {
        return { node: textNode, offset: Math.max(0, targetOffset - consumed) }
      }
      consumed += length
      lastBoundary = { node: textNode, offset: length }
      return null
    }

    if (node instanceof HTMLElement && (node.tagName === 'BR' || node.tagName === 'IMG')) {
      const parent = node.parentNode
      const childIndex = getChildIndex(node)
      if (targetOffset === consumed && parent) return { node: parent, offset: childIndex }
      consumed += 1
      lastBoundary = parent
        ? { node: parent, offset: childIndex + 1 }
        : { node: root, offset: root.childNodes.length }
      return targetOffset === consumed ? lastBoundary : null
    }

    for (const child of Array.from(node.childNodes)) {
      const boundary = visit(child)
      if (boundary) return boundary
    }
    return null
  }

  const boundary = visit(root)
  if (boundary) return boundary
  return lastBoundary
}

const createTextRange = (root: HTMLElement, start: number, end: number): Range | null => {
  const startBoundary = findTextBoundary(root, start)
  const endBoundary = findTextBoundary(root, end)
  if (!startBoundary || !endBoundary) return null

  const range = document.createRange()
  range.setStart(startBoundary.node, startBoundary.offset)
  range.setEnd(endBoundary.node, endBoundary.offset)
  return range
}

const getLineRight = (root: HTMLElement, lineTop: number, fallback: number): number => {
  const range = document.createRange()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let lineRight = fallback
  let current = walker.nextNode()

  while (current) {
    const textNode = current as Text
    if (!textNode.parentElement?.closest('[data-diary-attachment-marker]')) {
      range.selectNodeContents(textNode)
      Array.from(range.getClientRects())
        .filter((rect) => Math.abs(rect.top - lineTop) < 2)
        .forEach((rect) => {
          lineRight = Math.max(lineRight, rect.right)
        })
    }
    current = walker.nextNode()
  }

  root.querySelectorAll('img').forEach((image) => {
    if (image.closest('[data-diary-attachment-marker]')) return
    const rect = image.getBoundingClientRect()
    if (Math.abs(rect.top - lineTop) < 2) lineRight = Math.max(lineRight, rect.right)
  })

  return lineRight
}

interface DiaryLineAttachmentMarkerProps {
  anchor: DiaryAttachmentAnchor
  paragraphId: string
  urls: string[]
  slot: number
}

const DiaryLineAttachmentMarker = ({ anchor, paragraphId, urls, slot }: DiaryLineAttachmentMarkerProps) => {
  const markerRef = useRef<HTMLSpanElement | null>(null)
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' })

  const updatePosition = useCallback(() => {
    const marker = markerRef.current
    const block = marker?.closest<HTMLElement>('[data-diary-content-block]')
    const paragraph = block?.querySelector<HTMLElement>('[data-paragraph-id]')
    if (!marker || !paragraph || !block) return
    if (paragraph.getAttribute('data-paragraph-id') !== paragraphId) return

    const range = createTextRange(paragraph, anchor.start, anchor.end)
    if (!range) return

    const targetRect = Array.from(range.getClientRects()).pop()
    if (!targetRect) return

    const lineRight = getLineRight(paragraph, targetRect.top, targetRect.right)
    const blockRect = block.getBoundingClientRect()
    const markerWidth = marker.offsetWidth || 18
    const markerHeight = marker.offsetHeight || 18
    const gap = 8
    const viewportPadding = 12
    const rightPosition = lineRight - blockRect.left + gap + slot * (markerWidth + 4)
    const rightEdge = blockRect.left + rightPosition + markerWidth
    const leftPosition = targetRect.left - blockRect.left - markerWidth - gap - slot * (markerWidth + 4)
    const leftEdge = blockRect.left + leftPosition
    const left = rightEdge <= window.innerWidth - viewportPadding
      ? rightPosition
      : Math.max(viewportPadding, leftEdge - blockRect.left)

    setPosition({
      left,
      top: targetRect.top - blockRect.top + Math.max(0, (targetRect.height - markerHeight) / 2),
      visibility: 'visible',
    })
  }, [anchor.end, anchor.start, paragraphId, slot])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    updatePosition()
    const handleResize = () => updatePosition()
    const handleScroll = () => updatePosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)
    const block = markerRef.current?.closest<HTMLElement>('[data-diary-content-block]')
    const resizeObserver = typeof ResizeObserver !== 'undefined' && block
      ? new ResizeObserver(updatePosition)
      : null
    if (resizeObserver && block) resizeObserver.observe(block)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
      resizeObserver?.disconnect()
    }
  }, [updatePosition])

  return (
    <span ref={markerRef} className="absolute z-10" data-diary-attachment-marker style={position}>
      <DiaryImagePopover urls={urls} />
    </span>
  )
}

const toReactAttributeName = (name: string): string => {
  if (name === 'class') return 'className'
  if (name === 'for') return 'htmlFor'
  return name
}

const parseInlineStyle = (value: string): Record<string, string> => (
  Object.fromEntries(
    value.split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(':')
        if (separator < 0) return ['', '']
        const property = declaration.slice(0, separator).trim().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
        return [property, declaration.slice(separator + 1).trim()]
      })
      .filter(([property]) => Boolean(property)),
  )
)

const renderSanitizedNode = (
  node: Node,
  key: string,
  paragraphDataById: Map<string, DiaryParagraphRenderData>,
  context?: DiaryInlineRenderContext,
): ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || ''
    if (!context || !text) return text

    const startOffset = context.offset
    const endOffset = startOffset + text.length
    const markers = context.groups.filter((group) => group.end >= startOffset && group.end <= endOffset)
    context.offset = endOffset
    if (markers.length === 0) return text

    const parts: ReactNode[] = []
    let cursor = 0
    markers.forEach((group) => {
      const localEnd = group.end - startOffset
      if (localEnd < cursor) return
      parts.push(text.slice(cursor, localEnd))
      parts.push(
        <DiaryLineAttachmentMarker
          key={`${key}-attachment-${group.start}-${group.end}`}
          anchor={group.anchor}
          paragraphId={group.paragraphId}
          slot={context.groups.indexOf(group)}
          urls={group.urls}
        />,
      )
      cursor = localEnd
    })
    parts.push(text.slice(cursor))
    return parts
  }

  if (!(node instanceof HTMLElement)) return null

  const tagName = node.tagName.toLowerCase()
  const paragraphId = node.getAttribute('data-paragraph-id')
  const paragraphData = paragraphId ? paragraphDataById.get(paragraphId) : undefined
  const childContext = paragraphData
    ? { offset: 0, groups: paragraphData.groups }
    : context
  const attributes: Record<string, string | Record<string, string>> = {}
  Array.from(node.attributes).forEach((attribute) => {
    if (attribute.name.toLowerCase().startsWith('on')) return
    const attributeName = toReactAttributeName(attribute.name)
    attributes[attributeName] = attributeName === 'style'
      ? parseInlineStyle(attribute.value)
      : attribute.value
  })

  if (tagName === 'br') {
    if (childContext) childContext.offset += 1
    return createElement(tagName, { ...attributes, key })
  }
  if (tagName === 'img') {
    if (childContext) childContext.offset += 1
    return createElement(tagName, { ...attributes, key })
  }

  const children = Array.from(node.childNodes).map((child, index) => (
    renderSanitizedNode(child, `${key}-${index}`, paragraphDataById, childContext)
  ))
  const renderedNode = createElement(tagName, { ...attributes, key }, children)
  if (!paragraphData) return renderedNode

  return (
    <div key={`${key}-content-block`} className="relative" data-diary-content-block>
      {renderedNode}
    </div>
  )
}

const getInlineAttachmentGroups = (
  paragraph: HTMLElement,
  bindings: DiaryAttachmentBinding[],
): DiaryInlineAttachmentGroup[] => {
  const paragraphText = getDiaryAttachmentAnchorText(paragraph)
  const groups = new Map<string, DiaryInlineAttachmentGroup>()

  bindings.forEach((binding) => {
    if (binding.type !== 'IMAGE' || !binding.url || binding.anchor.kind !== 'TEXT_RANGE') return
    const anchor = locateDiaryAttachmentAnchor(paragraphText, binding.anchor)
    if (!anchor) return

    const groupKey = `${anchor.start}:${anchor.end}`
    const group = groups.get(groupKey) || {
      start: anchor.start,
      end: anchor.end,
      anchor,
      paragraphId: paragraph.getAttribute('data-paragraph-id') || '',
      urls: [],
    }
    if (!group.urls.includes(binding.url)) group.urls.push(binding.url)
    groups.set(groupKey, group)
  })

  return Array.from(groups.values()).sort((left, right) => left.end - right.end)
}

const isRichText = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value)

export const DiaryBody = ({ content, bindings }: DiaryBodyProps) => {
  const bindingByParagraph = useMemo(() => {
    const map = new Map<string, DiaryAttachmentBinding[]>()
    bindings.forEach((binding) => {
      const current = map.get(binding.paragraphId) || []
      current.push(binding)
      map.set(binding.paragraphId, current)
    })
    return map
  }, [bindings])

  const blocks = useMemo(() => {
    if (!isRichText(content) || typeof document === 'undefined') return null

    const safeHtml = DOMPurify.sanitize(content, { ADD_ATTR: ['data-object-key', 'data-paragraph-id'] })
    const container = document.createElement('div')
    container.innerHTML = safeHtml

    const boundImageKeys = new Set(
      bindings
        .filter((binding) => binding.type === 'IMAGE')
        .map((binding) => binding.objectKey),
    )
    container.querySelectorAll('img[data-object-key]').forEach((image) => {
      if (boundImageKeys.has(image.getAttribute('data-object-key') || '')) image.remove()
    })

    container.querySelectorAll('p').forEach((paragraph) => {
      if (paragraph.textContent || paragraph.querySelector('img, br')) return
      paragraph.classList.add('my-0', 'min-h-6')
    })

    const paragraphDataById = new Map<string, DiaryParagraphRenderData>()
    container.querySelectorAll<HTMLElement>('[data-paragraph-id]').forEach((paragraph) => {
      const paragraphId = paragraph.getAttribute('data-paragraph-id')
      if (!paragraphId) return
      const paragraphBindings = bindingByParagraph.get(paragraphId) || []
      const groups = getInlineAttachmentGroups(paragraph, paragraphBindings)
      if (groups.length > 0) {
        paragraphDataById.set(paragraphId, { groups })
      }
    })

    return Array.from(container.childNodes).map((node, index) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        return text.trim() ? <p key={`text-${index}`} className="whitespace-pre-wrap">{text}</p> : null
      }
      if (!(node instanceof HTMLElement)) return null

      return renderSanitizedNode(node, `content-${index}`, paragraphDataById)
    })
  }, [bindingByParagraph, bindings, content])

  if (blocks) {
    return <div className="prose prose-sm w-full max-w-none break-words text-foreground/90 dark:prose-invert [&_blockquote]:border-primary/40 [&_blockquote]:bg-primary/5 [&_img]:my-6 [&_img]:h-auto [&_img]:max-h-[34rem] [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/60 [&_img]:bg-muted/20 [&_img]:object-contain [&_img]:shadow-sm">{blocks}</div>
  }

  return <div className="w-full max-w-none whitespace-pre-wrap break-words font-sans text-sm leading-7 text-foreground/90">{content}</div>
}
