import { AudioLines, Images, Pause, Play, X } from 'lucide-react'
import DOMPurify from 'dompurify'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'
import { DiaryImageGallery } from './DiaryImageGallery'
import { cn } from '../utils'
import { sortDiaryAttachmentBindings, type DiaryAttachmentBinding } from '../lib/diaryAttachments'

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

export const DiaryAttachmentRail = ({ bindings, className }: DiaryAttachmentRailProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [panelPosition, setPanelPosition] = useState<{ left: number; top: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const panelId = `diary-attachment-panel-${useId().replace(/:/g, '')}`
  const visibleBindings = useMemo(
    () => sortDiaryAttachmentBindings(bindings).filter((binding) => (
      (binding.type === 'IMAGE' || binding.type === 'AUDIO') && Boolean(binding.url)
    )),
    [bindings],
  )

  const imageUrls = Array.from(new Set(
    visibleBindings
      .filter((binding) => binding.type === 'IMAGE')
      .map((binding) => binding.url)
      .filter((url): url is string => Boolean(url)),
  ))
  const audioBindings = visibleBindings.filter((binding) => binding.type === 'AUDIO')
  const hasImages = imageUrls.length > 0

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

  if (visibleBindings.length === 0) return null

  const panel = expanded && hasImages && panelPosition && typeof document !== 'undefined'
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
          <DiaryImageGallery urls={imageUrls} showHeader={false} className="border-0 pt-0" />
        </div>
      </div>,
      document.body,
    )
    : null

  return (
    <div className={cn('not-prose relative', hasImages && audioBindings.length === 0 ? 'h-0' : 'mt-3 space-y-3', className)}>
      {audioBindings.map((binding) => (
        <DiaryAudioAttachment key={`${binding.objectKey}-${binding.paragraphId}`} binding={binding} />
      ))}

      {hasImages && (
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-[-0.25rem] h-8 w-8 rounded-full text-primary hover:bg-primary/10 md:right-[-3.25rem]"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={t('diary.attachments.toggle')}
          title={t('diary.attachments.toggle')}
          onClick={toggleImages}
        >
          <Images className={cn('h-4 w-4 transition-transform duration-200', expanded && 'scale-110')} aria-hidden="true" />
        </Button>
      )}
      {panel}
    </div>
  )
}

interface DiaryBodyProps {
  content: string
  bindings: DiaryAttachmentBinding[]
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

    return Array.from(container.childNodes).map((node, index) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        return text.trim() ? <p key={`text-${index}`} className="whitespace-pre-wrap">{text}</p> : null
      }
      if (!(node instanceof HTMLElement)) return null

      const paragraphId = node.getAttribute('data-paragraph-id')
      const paragraphBindings = paragraphId ? bindingByParagraph.get(paragraphId) || [] : []
      return (
        <div key={`${paragraphId || node.tagName}-${index}`}>
          <div dangerouslySetInnerHTML={{ __html: node.outerHTML }} />
          {paragraphBindings.length > 0 && <DiaryAttachmentRail bindings={paragraphBindings} />}
        </div>
      )
    })
  }, [bindingByParagraph, bindings, content])

  if (blocks) {
    return <div className="prose prose-sm w-full max-w-none break-words text-foreground/90 dark:prose-invert [&_blockquote]:border-primary/40 [&_blockquote]:bg-primary/5 [&_img]:my-6 [&_img]:h-auto [&_img]:max-h-[34rem] [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/60 [&_img]:bg-muted/20 [&_img]:object-contain [&_img]:shadow-sm">{blocks}</div>
  }

  return <div className="w-full max-w-none whitespace-pre-wrap break-words font-sans text-sm leading-7 text-foreground/90">{content}</div>
}
