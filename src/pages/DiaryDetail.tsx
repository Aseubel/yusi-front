import { ArrowLeft, CalendarDays, Edit2, Lock, MapPin, MessageCircle, Share2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Skeleton, SkeletonText } from '../components/ui'
import { DiaryBody } from '../components/DiaryAttachmentRail'
import { DiaryImageGallery } from '../components/DiaryImageGallery'
import { getDiary, type Diary } from '../lib'
import { parseDiaryAttachmentBindings } from '../lib/diaryAttachments'
import { getDiaryLocation } from '../lib/diaryLocation'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useEncryptionStore } from '../stores/encryptionStore'

const parseImageUrls = (images?: string): string[] => {
  if (!images) return []
  try {
    const parsed: unknown = JSON.parse(images)
    return Array.isArray(parsed)
      ? parsed.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
      : []
  } catch {
    return []
  }
}

const extractImageKeys = (content: string): Set<string> => {
  if (typeof document === 'undefined') return new Set()
  const container = document.createElement('div')
  container.innerHTML = content
  return new Set(
    Array.from(container.querySelectorAll('img[data-object-key]'))
      .map((image) => image.getAttribute('data-object-key'))
      .filter((key): key is string => Boolean(key)),
  )
}

const refreshManagedImageUrls = (content: string, imageObjectKeys?: string[], imageUrls: string[] = []): string => {
  if (!content.includes('<img') || !imageObjectKeys?.length || !imageUrls.length || typeof document === 'undefined') {
    return content
  }
  const urlByObjectKey = new Map(
    imageObjectKeys
      .map((objectKey, index) => [objectKey, imageUrls[index]] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1])),
  )
  if (urlByObjectKey.size === 0) return content

  const container = document.createElement('div')
  container.innerHTML = content
  container.querySelectorAll('img[data-object-key]').forEach((image) => {
    const objectKey = image.getAttribute('data-object-key')
    const freshUrl = objectKey ? urlByObjectKey.get(objectKey) : undefined
    if (freshUrl) image.setAttribute('src', freshUrl)
  })
  return container.innerHTML
}

const getUnboundImageUrls = (diary: Diary, content: string): string[] => {
  const imageUrls = parseImageUrls(diary.images)
  const imageKeys = diary.imageObjectKeys || []
  const embeddedKeys = extractImageKeys(content)
  const boundKeys = new Set(
    parseDiaryAttachmentBindings(diary.attachmentBindings)
      .filter((binding) => binding.type === 'IMAGE')
      .map((binding) => binding.objectKey),
  )

  return imageUrls.filter((_, index) => {
    const objectKey = imageKeys[index]
    return !objectKey || (!embeddedKeys.has(objectKey) && !boundKeys.has(objectKey))
  })
}

const formatDateTime = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const DiaryDetailContent = ({ diaryId }: { diaryId: string }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { openChatWithDiary } = useChatStore()
  const { initialize: initEncryption, decrypt, cryptoKey, isInitialized: encryptionInitialized } = useEncryptionStore()
  const [diary, setDiary] = useState<Diary | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    void initEncryption()
  }, [initEncryption])

  const decryptContent = useCallback(async (nextDiary: Diary) => {
    if (!nextDiary.clientEncrypted) return nextDiary.content
    if (!cryptoKey) return ''
    try {
      return await decrypt(nextDiary.content)
    } catch {
      return ''
    }
  }, [cryptoKey, decrypt])

  useEffect(() => {
    if (!encryptionInitialized || !user?.userId) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(false)
      void getDiary(diaryId)
        .then(async (nextDiary) => {
          if (cancelled) return
          setDiary(nextDiary)
          const decryptedContent = await decryptContent(nextDiary)
          setContent(refreshManagedImageUrls(decryptedContent, nextDiary.imageObjectKeys, parseImageUrls(nextDiary.images)))
        })
        .catch((loadError) => {
          if (!cancelled) {
            console.error('Failed to load diary detail', loadError)
            setError(true)
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [decryptContent, diaryId, encryptionInitialized, user?.userId])

  const bindings = useMemo(() => parseDiaryAttachmentBindings(diary?.attachmentBindings), [diary?.attachmentBindings])
  const unboundImageUrls = diary ? getUnboundImageUrls(diary, content) : []
  const location = diary ? getDiaryLocation(diary) : null

  if (loading) {
    return (
      <div className="container-page max-w-4xl space-y-6 py-10">
        <Skeleton className="h-10 w-32" variant="rounded" />
        <Card>
          <CardHeader className="space-y-4">
            <Skeleton className="h-8 w-2/3" variant="rounded" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent><SkeletonText lines={7} /></CardContent>
        </Card>
      </div>
    )
  }

  if (error || !diary) {
    return (
      <div className="container-page flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-5 text-center">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <Lock className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{t('diary.detail.loadFailed')}</h1>
          <p className="text-sm text-muted-foreground">{t('diary.detail.loadFailedDescription')}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate('/diary')}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('diary.detail.backToDiary')}
        </Button>
      </div>
    )
  }

  const isLocked = diary.clientEncrypted && !content

  return (
    <div className="container-page max-w-5xl space-y-6 py-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/diary')}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('diary.detail.backToDiary')}
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/diary?edit=${diary.diaryId}`)}>
            <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('diary.actions.edit')}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/15">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <CardTitle className="break-words text-2xl leading-tight md:text-3xl">{diary.title}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{diary.entryDate}</span>
                {location?.placeName && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{location.placeName}</span>}
                {diary.clientEncrypted && <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" aria-hidden="true" />{t('diary.encrypted')}</span>}
              </CardDescription>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>{t('diary.detail.updatedAt')}</div>
              <div className="mt-1 font-medium text-foreground/75">{formatDateTime(diary.updateTime || diary.createTime)}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-7 md:pt-8">
          {isLocked ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
              <Lock className="h-8 w-8 text-primary/70" aria-hidden="true" />
              <p className="font-medium">{t('diary.encryptedContent')}</p>
              <p className="text-sm text-muted-foreground">{t('diary.detail.unlockToView')}</p>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl">
              <DiaryBody content={content} bindings={bindings} />
              <DiaryImageGallery urls={unboundImageUrls} />
            </div>
          )}
          {location?.address && <p className="border-t border-border/50 pt-4 text-xs text-muted-foreground">{location.address}</p>}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 border-t border-border/50 bg-muted/10 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              openChatWithDiary({ diaryId: diary.diaryId, title: diary.title, entryDate: diary.entryDate, content: content.slice(0, 500) })
              toast.success(t('diary.startChat'))
            }}
          >
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('diary.startChat')}
          </Button>
          <Link to={`/diary?share=${diary.diaryId}`}>
            <Button type="button" variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('diary.publishToPlaza')}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export const DiaryDetail = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { diaryId } = useParams<{ diaryId: string }>()

  if (!user) {
    return (
      <div className="container-page flex min-h-[65vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="rounded-2xl bg-primary/10 p-5 text-primary"><Lock className="h-10 w-10" aria-hidden="true" /></div>
        <div className="space-y-2"><h1 className="text-2xl font-bold">{t('diary.pageTitle')}</h1><p className="max-w-sm text-sm text-muted-foreground">{t('diary.pageSubtitle')}</p></div>
        <Link to="/login" state={{ from: `/diary/${diaryId || ''}` }}><Button type="button">{t('diary.loginPrompt')}</Button></Link>
      </div>
    )
  }

  if (!diaryId) return null
  return <DiaryDetailContent diaryId={diaryId} />
}
