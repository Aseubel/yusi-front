import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, ImageOff, Images, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../utils'
import { Button } from './ui/Button'

interface DiaryImageGalleryProps {
  urls: string[]
  className?: string
  title?: string
  showHeader?: boolean
}

export const DiaryImageGallery = ({ urls, className, title, showHeader = true }: DiaryImageGalleryProps) => {
  const { t } = useTranslation()
  const uniqueUrls = useMemo(() => Array.from(new Set(urls.filter(Boolean))), [urls])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set())

  if (uniqueUrls.length === 0) return null

  const safeActiveIndex = activeIndex !== null && activeIndex < uniqueUrls.length ? activeIndex : null
  const activeUrl = safeActiveIndex === null ? null : uniqueUrls[safeActiveIndex]
  const markFailed = (url: string) => {
    setFailedUrls((previous) => {
      if (previous.has(url)) return previous
      return new Set(previous).add(url)
    })
  }

  const move = (direction: -1 | 1) => {
    if (safeActiveIndex === null || uniqueUrls.length < 2) return
    setActiveIndex((safeActiveIndex + direction + uniqueUrls.length) % uniqueUrls.length)
  }

  return (
    <div className={cn('border-t border-border/60 pt-5', className)}>
      {showHeader && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground/85">
            <Images className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{title || t('diary.images.galleryTitle')}</span>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {uniqueUrls.length}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {uniqueUrls.map((url, index) => (
          failedUrls.has(url) ? (
            <div
              key={url}
              className="flex aspect-[4/3] min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-2 text-center text-xs text-muted-foreground"
            >
              <ImageOff className="h-5 w-5 opacity-60" aria-hidden="true" />
              <span>{t('diary.images.loadFailed')}</span>
            </div>
          ) : (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative aspect-[4/3] min-w-0 overflow-hidden rounded-xl border border-border/60 bg-muted/30 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${t('diary.images.preview')} ${index + 1}`}
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => markFailed(url)}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-2 pb-2 pt-6 text-right text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                {index + 1} / {uniqueUrls.length}
              </span>
            </button>
          )
        ))}
      </div>

      <DialogPrimitive.Root
        open={safeActiveIndex !== null}
        onOpenChange={(open) => !open && setActiveIndex(null)}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none sm:p-8"
          >
            <DialogPrimitive.Title className="sr-only">
              {t('diary.images.preview')}
            </DialogPrimitive.Title>

            <div className="relative flex max-h-full max-w-6xl items-center justify-center">
              {activeUrl && !failedUrls.has(activeUrl) ? (
                <img
                  src={activeUrl}
                  alt=""
                  onError={() => markFailed(activeUrl)}
                  className="max-h-[calc(100vh-5rem)] max-w-[calc(100vw-2rem)] rounded-2xl object-contain shadow-2xl sm:max-w-[calc(100vw-8rem)]"
                />
              ) : (
                <div className="flex min-h-48 min-w-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-6 text-sm text-white/75">
                  <ImageOff className="h-7 w-7" aria-hidden="true" />
                  <span>{t('diary.images.loadFailed')}</span>
                </div>
              )}

              <DialogPrimitive.Close asChild>
                <Button
                  variant="glass"
                  size="icon"
                  aria-label={t('common.close')}
                  className="absolute -right-2 -top-2 border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white sm:-right-4 sm:-top-4"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DialogPrimitive.Close>

              {uniqueUrls.length > 1 && (
                <>
                  <Button
                    variant="glass"
                    size="icon"
                    aria-label={t('diary.images.previous')}
                    title={t('diary.images.previous')}
                    onClick={() => move(-1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white sm:-left-16"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="glass"
                    size="icon"
                    aria-label={t('diary.images.next')}
                    title={t('diary.images.next')}
                    onClick={() => move(1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white sm:-right-16"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </>
              )}

              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs tabular-nums text-white/85">
                {(safeActiveIndex ?? 0) + 1} / {uniqueUrls.length}
              </span>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
