import { AudioLines, ChevronDown, ChevronUp, Paperclip } from 'lucide-react'
import DOMPurify from 'dompurify'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'
import { DiaryImageGallery } from './DiaryImageGallery'
import { cn } from '../utils'
import { sortDiaryAttachmentBindings, type DiaryAttachmentBinding, type DiaryAttachmentDisplayMode } from '../lib/diaryAttachments'

interface DiaryAttachmentRailProps {
  bindings: DiaryAttachmentBinding[]
  displayMode: DiaryAttachmentDisplayMode
  className?: string
}

export const DiaryAttachmentRail = ({ bindings, displayMode, className }: DiaryAttachmentRailProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const visibleBindings = useMemo(
    () => sortDiaryAttachmentBindings(bindings).filter((binding) => (
      (binding.type === 'IMAGE' || binding.type === 'AUDIO') && Boolean(binding.url)
    )),
    [bindings],
  )

  if (visibleBindings.length === 0) return null

  const imageUrls = Array.from(new Set(
    visibleBindings
      .filter((binding) => binding.type === 'IMAGE')
      .map((binding) => binding.url)
      .filter((url): url is string => Boolean(url)),
  ))
  const audioBindings = visibleBindings.filter((binding) => binding.type === 'AUDIO')

  const content = (
    <div className={cn('space-y-3', displayMode === 'INLINE' ? 'pt-1' : 'border-t border-border/50 pt-3')}>
      {imageUrls.length > 0 && (
        <DiaryImageGallery
          urls={imageUrls}
          title={t('diary.attachments.images')}
          className="border-0 pt-0"
        />
      )}
      {audioBindings.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
            <AudioLines className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('diary.attachments.audio')}
          </div>
          {audioBindings.map((binding) => (
            <audio key={`${binding.objectKey}-${binding.paragraphId}`} controls preload="metadata" src={binding.url} className="h-9 w-full" />
          ))}
        </div>
      )}
    </div>
  )

  if (displayMode === 'TRIGGER') {
    return (
      <div className={cn('min-w-0', className)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
          aria-expanded={expanded}
          title={t('diary.attachments.toggle')}
          onClick={() => setExpanded((current) => !current)}
        >
          <Paperclip className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>{visibleBindings.length}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
        </Button>
        {expanded && content}
      </div>
    )
  }

  return <div className={cn('min-w-0', className)}>{content}</div>
}

interface DiaryBodyProps {
  content: string
  bindings: DiaryAttachmentBinding[]
  displayMode: DiaryAttachmentDisplayMode
}

const isRichText = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value)

export const DiaryBody = ({ content, bindings, displayMode }: DiaryBodyProps) => {
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
        <div key={`${paragraphId || node.tagName}-${index}`} className={cn(
          paragraphBindings.length > 0 && 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)] lg:items-start',
        )}>
          <div dangerouslySetInnerHTML={{ __html: node.outerHTML }} />
          {paragraphBindings.length > 0 && (
            <DiaryAttachmentRail bindings={paragraphBindings} displayMode={displayMode} className="lg:pt-1" />
          )}
        </div>
      )
    })
  }, [bindingByParagraph, bindings, content, displayMode])

  if (blocks) {
    return <div className="prose prose-sm max-w-none break-words text-foreground/90 dark:prose-invert [&_blockquote]:border-primary/40 [&_blockquote]:bg-primary/5 [&_img]:my-6 [&_img]:h-auto [&_img]:max-h-[34rem] [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/60 [&_img]:bg-muted/20 [&_img]:object-contain [&_img]:shadow-sm">{blocks}</div>
  }

  return <div className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-foreground/90">{content}</div>
}
