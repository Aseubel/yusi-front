import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, RichTextEditor, ConfirmDialog, Tabs, TabsList, TabsTrigger, type RichTextEditorHandle } from './ui'
import { toast } from 'sonner'
import DOMPurify from 'dompurify'
import { useState, useEffect, useCallback, useRef } from 'react'
import { writeDiary, editDiary, getDiaryList, submitToPlaza, VoiceInputStream, type VoiceStreamEvent } from '../lib'
import type { Diary as DiaryType, DiaryAttachmentBinding, DiaryAttachmentDisplayMode } from '../lib'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Lock, MessageCircle, Edit2, X, Book, MapPin, Share2, AlertCircle, TrendingUp, Mic, Square, ImageIcon, Eye, Link2, Unlink, Paperclip, AudioLines, LoaderCircle } from 'lucide-react'
import { useChatStore } from '../stores'
import { useEncryptionStore } from '../stores/encryptionStore'
import { useAuthStore } from '../stores/authStore'
import { imageApi } from '../lib/api'
import { DiaryImageGallery } from './DiaryImageGallery'
import { serializeDiaryAttachmentBindings } from '../lib/diaryAttachments'

function stripImagesAndHtml(content: string): string {
  let stripped = content
  stripped = stripped.replace(/<img[^>]*>/gi, '')
  stripped = stripped.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
  stripped = stripped.replace(/<div[^>]*class="[^"]*image[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  stripped = stripped.replace(/!\[.*?\]\(.*?\)/g, '')
  return stripped
}
import { motion } from 'framer-motion'
import { LocationPicker } from './LocationPicker'
import { type GeoLocation } from '../lib/location'
import { getDiaryLocation } from '../lib/diaryLocation'
import { useTranslation } from 'react-i18next'

// 广场分享字数限制
const PLAZA_MAX_LENGTH = 500

// 简单的 HTML 检测
const isRichText = (text: string) => /<\/?[a-z][\s\S]*>/i.test(text)

// 检测内容是否包含图片
const hasImages = (content: string): boolean => {
  const imgRegex = /<img[^>]*>/i
  const markdownImgRegex = /!\[.*?\]\(.*?\)/g
  const figureRegex = /<figure[^>]*>[\s\S]*?<\/figure>/i
  return imgRegex.test(content) || markdownImgRegex.test(content) || figureRegex.test(content)
}

const parseDiaryImageUrls = (images?: string): string[] => {
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

const extractManagedImageKeys = (content: string): Set<string> => {
  if (!content.includes('data-object-key') || typeof document === 'undefined') {
    return new Set()
  }

  const container = document.createElement('div')
  container.innerHTML = content
  return new Set(
    Array.from(container.querySelectorAll('img[data-object-key]'))
      .map((image) => image.getAttribute('data-object-key'))
      .filter((key): key is string => Boolean(key))
  )
}

const refreshManagedImageUrls = (content: string, imageObjectKeys: string[] | undefined, imageUrls: string[]): string => {
  if (!content.includes('<img') || !imageObjectKeys?.length || !imageUrls.length || typeof document === 'undefined') {
    return content
  }

  const urlByObjectKey = new Map(
    imageObjectKeys
      .map((objectKey, index) => [objectKey, imageUrls[index]] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1]))
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

const getStandaloneImageUrls = (diary: DiaryType, content: string): string[] => {
  const imageUrls = parseDiaryImageUrls(diary.images)
  const imageObjectKeys = diary.imageObjectKeys || []
  const embeddedKeys = extractManagedImageKeys(content)

  return imageUrls.filter((_, index) => {
    const objectKey = imageObjectKeys[index]
    return !objectKey || !embeddedKeys.has(objectKey)
  })
}

// 计算字符长度（中文算2个字符，英文算1个）
const getCharLength = (text: string): number => {
  let length = 0
  for (const char of text) {
    length += (char.charCodeAt(0) > 127) ? 2 : 1
  }
  return length
}

function DiaryContent({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const editDiaryId = searchParams.get('edit')
  const shareDiaryId = searchParams.get('share')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [diaries, setDiaries] = useState<DiaryType[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingList, setLoadingList] = useState(false)
  const [decryptedContents, setDecryptedContents] = useState<Record<string, string>>({})
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [imageObjectKeys, setImageObjectKeys] = useState<string[]>([])
  const [standaloneImageObjectKeys, setStandaloneImageObjectKeys] = useState<string[]>([])
  const [embeddedImageObjectKeys, setEmbeddedImageObjectKeys] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [voiceState, setVoiceState] = useState<'idle' | 'connecting' | 'recording' | 'finishing'>('idle')
  const [voiceConfirmedText, setVoiceConfirmedText] = useState('')
  const [voiceInterimText, setVoiceInterimText] = useState('')
  const [attachmentBindings, setAttachmentBindings] = useState<DiaryAttachmentBinding[]>([])
  const [attachmentDisplayMode, setAttachmentDisplayMode] = useState<DiaryAttachmentDisplayMode>('INLINE')
  const voiceStreamRef = useRef<VoiceInputStream | null>(null)
  const voiceErrorRef = useRef(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const editorRef = useRef<RichTextEditorHandle>(null)
  const activeImageObjectKeys = imageObjectKeys.filter((objectKey) =>
    standaloneImageObjectKeys.includes(objectKey) || embeddedImageObjectKeys.includes(objectKey)
  )
  const recording = voiceState === 'recording'
  const transcribingVoice = voiceState === 'connecting' || voiceState === 'finishing'

  // 分享到广场的确认对话框状态
  const [shareDialog, setShareDialog] = useState<{
    isOpen: boolean
    diary: DiaryType | null
    isLoading: boolean
    previewContent: string
    warnings: string[]
    willBeTruncated: boolean
    truncatedLength: number
  }>({
    isOpen: false,
    diary: null,
    isLoading: false,
    previewContent: '',
    warnings: [],
    willBeTruncated: false,
    truncatedLength: 0
  })

  useEffect(() => () => {
    voiceStreamRef.current?.cancel()
    voiceStreamRef.current = null
  }, [])

  // 离线草稿：加载
  useEffect(() => {
    if (!editingId && userId) {
      let draft: { title?: string; content?: string; date?: string; location?: GeoLocation | null; attachmentBindings?: DiaryAttachmentBinding[]; attachmentDisplayMode?: DiaryAttachmentDisplayMode } | null = null
      try {
        const saved = localStorage.getItem(`diary_draft_${userId}`)
        if (saved) {
          draft = JSON.parse(saved)
        }
      } catch (e) {
        console.error('Failed to load diary draft', e)
      }

      if (draft) {
        const timer = setTimeout(() => {
          if (draft?.title) setTitle(draft.title)
          if (draft?.content) setContent(draft.content)
          if (draft?.date) setDate(draft.date)
          if (draft?.location) setLocation(draft.location)
          if (draft?.attachmentBindings) setAttachmentBindings(draft.attachmentBindings)
          if (draft?.attachmentDisplayMode) setAttachmentDisplayMode(draft.attachmentDisplayMode)
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [userId, editingId])

  // 离线草稿：保存
  useEffect(() => {
    if (!editingId && userId) {
      // 只有在内容有实质更新时才保存，防止空内容覆盖有效草稿
      if (title || content || location || attachmentBindings.length > 0) {
        const draft = { title, content, date, location, attachmentBindings: serializeDiaryAttachmentBindings(attachmentBindings), attachmentDisplayMode }
        localStorage.setItem(`diary_draft_${userId}`, JSON.stringify(draft))
      } else {
        localStorage.removeItem(`diary_draft_${userId}`)
      }
    }
  }, [title, content, date, location, attachmentBindings, attachmentDisplayMode, userId, editingId])

  const { openChatWithDiary } = useChatStore()
  const {
    initialize: initEncryption,
    hasActiveKey,
    encrypt,
    decrypt,
    keyMode,
    isInitialized: encryptionInitialized,
    cryptoKey
  } = useEncryptionStore()

  useEffect(() => {
    initEncryption()
  }, [initEncryption])

  const decryptDiary = useCallback(async (diary: DiaryType): Promise<string> => {
    if (!diary.clientEncrypted || !cryptoKey) {
      return diary.content
    }
    try {
      return await decrypt(diary.content)
    } catch {
      console.warn('Failed to decrypt diary:', diary.diaryId)
      return `[${t('diary.decryptError')}]`
    }
  }, [cryptoKey, decrypt, t])

  const loadDiaries = useCallback(async (targetPage = 1) => {
    if (!userId) return
    setLoadingList(true)

    try {
      const response = await getDiaryList(userId, targetPage, 5)

      setDiaries(response.content)
      setTotalPages(response.totalPages)
      setPage(targetPage)

      if (hasActiveKey()) {
        const decrypted: Record<string, string> = {}
        for (const diary of response.content) {
          decrypted[diary.diaryId] = await decryptDiary(diary)
        }
        setDecryptedContents(prev => ({ ...prev, ...decrypted }))
      }
    } catch (e) {
      console.error('Failed to load diaries', e)
    } finally {
      setLoadingList(false)
    }
  }, [userId, hasActiveKey, decryptDiary])

  useEffect(() => {
    if (encryptionInitialized) {
      const timer = setTimeout(() => {
        void loadDiaries(1)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [encryptionInitialized, loadDiaries])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      loadDiaries(newPage)
      const historySection = document.getElementById('history-section')
      if (historySection) {
        historySection.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  useEffect(() => {
    if (cryptoKey && diaries.length > 0) {
      const decryptAll = async () => {
        const decrypted: Record<string, string> = {}
        for (const diary of diaries) {
          decrypted[diary.diaryId] = await decryptDiary(diary)
        }
        setDecryptedContents(decrypted)
      }
      decryptAll()
    }
  }, [cryptoKey, diaries, decryptDiary])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error(t('diary.title'))
      return
    }

    if (!hasActiveKey()) {
      toast.error(t('diary.unlockRequired'))
      navigate('/settings')
      return
    }

    setLoading(true)
    try {
      const isClientEncrypted = keyMode === 'CUSTOM'
      const payloadContent = isClientEncrypted ? await encrypt(content) : content

      const { hasCloudBackup } = useEncryptionStore.getState()

      const plainContent = keyMode === 'CUSTOM' && hasCloudBackup ? content : undefined
      const imagesToPersist = activeImageObjectKeys
      const bindingsToPersist = serializeDiaryAttachmentBindings(attachmentBindings)

      if (editingId) {
        await editDiary({
          userId,
          diaryId: editingId,
          title,
          content: payloadContent,
          entryDate: date,
          clientEncrypted: isClientEncrypted,
          plainContent,
          latitude: location?.latitude,
          longitude: location?.longitude,
          address: location?.address,
          placeName: location?.placeName,
          placeId: location?.placeId,
          images: JSON.stringify(imagesToPersist),
          attachmentBindings: bindingsToPersist,
          attachmentDisplayMode,
        })
        toast.success(t('diary.toast.updateSuccess'))
        setEditingId(null)
      } else {
        await writeDiary({
          userId,
          title,
          content: payloadContent,
          entryDate: date,
          clientEncrypted: isClientEncrypted,
          plainContent,
          latitude: location?.latitude,
          longitude: location?.longitude,
          address: location?.address,
          placeName: location?.placeName,
          placeId: location?.placeId,
          images: JSON.stringify(imagesToPersist),
          attachmentBindings: bindingsToPersist,
          attachmentDisplayMode,
        })
        toast.success(t('diary.toast.saveSuccess'))
        localStorage.removeItem(`diary_draft_${userId}`)
      }
      setTitle('')
      setContent('')
      setDate(new Date().toISOString().split('T')[0])
      setLocation(null)
      setImageObjectKeys([])
      setStandaloneImageObjectKeys([])
      setEmbeddedImageObjectKeys([])
      setImageUrls([])
      setAttachmentBindings([])
      setAttachmentDisplayMode('INLINE')
      loadDiaries(1)
    } catch {
      toast.error(t('diary.toast.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceEvent = (event: VoiceStreamEvent) => {
    if (event.type === 'partial') {
      setVoiceInterimText(event.text)
      return
    }
    if (event.type === 'final') {
      setVoiceConfirmedText((previous) => `${previous}${event.text}`)
      setVoiceInterimText('')
    }
  }

  const handleVoiceRecord = async () => {
    if (voiceState === 'connecting' || voiceState === 'finishing') return
    if (recording) {
      const stream = voiceStreamRef.current
      if (!stream) return
      setVoiceState('finishing')
      try {
        const transcript = await stream.stop()
        const text = transcript.trim() || voiceConfirmedText.trim()
        if (text) {
          if (editorRef.current) {
            editorRef.current.insertTextAtSelection(text)
          } else {
            setContent((previous) => previous ? `${previous}\n${text}` : text)
          }
          toast.success(t('diary.voice.transcribed'))
        }
      } catch {
        if (!voiceErrorRef.current) {
          toast.error(t('diary.voice.transcribeFailed'))
        }
      } finally {
        voiceStreamRef.current = null
        setVoiceConfirmedText('')
        setVoiceInterimText('')
        setVoiceState('idle')
      }
      return
    }

    const token = useAuthStore.getState().token
    if (!token) {
      toast.error(t('diary.unlockRequired'))
      return
    }
    setVoiceState('connecting')
    setVoiceConfirmedText('')
    setVoiceInterimText('')
    voiceErrorRef.current = false
    const stream = new VoiceInputStream({
      token,
      onEvent: handleVoiceEvent,
      onError: () => {
        voiceErrorRef.current = true
        voiceStreamRef.current = null
        setVoiceConfirmedText('')
        setVoiceInterimText('')
        setVoiceState('idle')
        toast.error(t('diary.voice.transcribeFailed'))
      },
    })
    voiceStreamRef.current = stream
    try {
      await stream.start()
      setVoiceState('recording')
    } catch (error) {
      stream.cancel()
      voiceStreamRef.current = null
      setVoiceState('idle')
      const isMicrophoneError = error instanceof DOMException
        && ['NotAllowedError', 'NotFoundError', 'NotReadableError'].includes(error.name)
      toast.error(t(isMicrophoneError ? 'diary.voice.microphoneFailed' : 'diary.voice.connectFailed'))
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    if (activeImageObjectKeys.length + files.length > 9) {
      toast.error(t('diary.images.maxCount'))
      return
    }
    try {
      const uploaded = await Promise.all(files.map(file => imageApi.upload(file, userId)))
      const uploadedImages = uploaded.map(item => item.data)
      setImageObjectKeys(prev => [...prev, ...uploadedImages.map(item => item.objectKey)])
      setStandaloneImageObjectKeys(prev => [...prev, ...uploadedImages.map(item => item.objectKey)])
      setImageUrls(prev => [...prev, ...uploadedImages.map(item => item.url)])
      toast.success(t('diary.images.uploadSuccess'))
    } catch {
      toast.error(t('diary.images.uploadFailed'))
    } finally {
      event.target.value = ''
    }
  }

  const handleEdit = useCallback(async (diary: DiaryType) => {
    setEditingId(diary.diaryId)
    setTitle(diary.title)
    const decrypted = decryptedContents[diary.diaryId] || diary.content
    const refreshedContent = refreshManagedImageUrls(decrypted, diary.imageObjectKeys, parseDiaryImageUrls(diary.images))
    const embeddedKeys = Array.from(extractManagedImageKeys(refreshedContent))
    setContent(refreshedContent)
    setImageObjectKeys(diary.imageObjectKeys || [])
    setEmbeddedImageObjectKeys(embeddedKeys)
    setStandaloneImageObjectKeys((diary.imageObjectKeys || []).filter((objectKey) => !embeddedKeys.includes(objectKey)))
    setImageUrls(parseDiaryImageUrls(diary.images))
    setAttachmentBindings(diary.attachmentBindings || [])
    setAttachmentDisplayMode(diary.attachmentDisplayMode || 'INLINE')
    setDate(diary.entryDate)
    setLocation(getDiaryLocation(diary))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [decryptedContents])

  useEffect(() => {
    if (!editDiaryId || editingId || diaries.length === 0) return
    const target = diaries.find((diary) => diary.diaryId === editDiaryId)
    if (!target) return
    const timer = window.setTimeout(() => {
      void handleEdit(target)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('edit')
      setSearchParams(nextParams, { replace: true })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [diaries, editDiaryId, editingId, handleEdit, searchParams, setSearchParams])

  const handleCancelEdit = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setDate(new Date().toISOString().split('T')[0])
    setLocation(null)
    setImageObjectKeys([])
    setStandaloneImageObjectKeys([])
    setEmbeddedImageObjectKeys([])
    setImageUrls([])
    setAttachmentBindings([])
    setAttachmentDisplayMode('INLINE')
  }

  const handleBindImage = (objectKey: string) => {
    const paragraphId = editorRef.current?.getOrCreateActiveParagraphId()
    if (!paragraphId) {
      toast.error(t('diary.attachments.selectParagraph'))
      return
    }
    setAttachmentBindings((previous) => {
      const nextSortOrder = previous.reduce((max, binding) => Math.max(max, binding.sortOrder), -1) + 1
      return [
        ...previous.filter((binding) => !(binding.type === 'IMAGE' && binding.objectKey === objectKey)),
        { type: 'IMAGE', objectKey, paragraphId, sortOrder: nextSortOrder },
      ]
    })
    toast.success(t('diary.attachments.bound'))
  }

  const handleUnbindImage = (objectKey: string) => {
    setAttachmentBindings((previous) => previous.filter((binding) => !(binding.type === 'IMAGE' && binding.objectKey === objectKey)))
  }

  // 打开分享确认对话框
  const openShareDialog = useCallback(async (diary: DiaryType) => {
    const decryptedContent = decryptedContents[diary.diaryId] || diary.content
    if (decryptedContent.startsWith('[🔒') || decryptedContent.startsWith('[无法解密')) {
      toast.error(t('diary.toast.cannotShareEncrypted'))
      return
    }

    const strippedContent = stripImagesAndHtml(decryptedContent)
    if (strippedContent.trim().length < 5) {
      toast.error(t('diary.shareConfirm.empty'))
      return
    }

    const warnings: string[] = []
    const contentHasImages = hasImages(decryptedContent)
    const charLength = getCharLength(strippedContent)
    const willBeTruncated = charLength > PLAZA_MAX_LENGTH

    // 检查是否有图片
    if (contentHasImages) {
      warnings.push(`• ${t('diary.shareConfirm.imageHidden')}`)
    }

    // 检查字数是否超限
    let truncatedLength = 0
    if (willBeTruncated) {
      // 计算截断后的长度
      let truncatedText = ''
      let currentLength = 0
      for (const char of strippedContent) {
        const charSize = (char.charCodeAt(0) > 127) ? 2 : 1
        if (currentLength + charSize > PLAZA_MAX_LENGTH) {
          break
        }
        truncatedText += char
        currentLength += charSize
      }
      truncatedLength = truncatedText.length
      warnings.push(t('diary.shareConfirm.tooLong', { charLength, maxLength: PLAZA_MAX_LENGTH, truncatedLength }))
      warnings.push(`• ${t('diary.shareConfirm.copyAndRepublish')}`)
    }

    setShareDialog({
      isOpen: true,
      diary,
      isLoading: false,
      previewContent: strippedContent.slice(0, 200) + (strippedContent.length > 200 ? '...' : ''),
      warnings,
      willBeTruncated,
      truncatedLength
    })
  }, [decryptedContents, setShareDialog, t])

  useEffect(() => {
    if (!shareDiaryId || diaries.length === 0) return
    const target = diaries.find((diary) => diary.diaryId === shareDiaryId)
    if (!target) return
    const timer = window.setTimeout(() => {
      void openShareDialog(target)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('share')
      setSearchParams(nextParams, { replace: true })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [diaries, openShareDialog, searchParams, setSearchParams, shareDiaryId])

  // 确认分享
  const confirmShare = async () => {
    if (!shareDialog.diary) return

    setShareDialog(prev => ({ ...prev, isLoading: true }))

    try {
      const decryptedContent = decryptedContents[shareDialog.diary.diaryId] || shareDialog.diary.content
      let strippedContent = stripImagesAndHtml(decryptedContent)

      // 如果超长，进行截断
      if (shareDialog.willBeTruncated) {
        let truncatedText = ''
        let currentLength = 0
        for (const char of strippedContent) {
          const charSize = (char.charCodeAt(0) > 127) ? 2 : 1
          if (currentLength + charSize > PLAZA_MAX_LENGTH) {
            break
          }
          truncatedText += char
          currentLength += charSize
        }
        strippedContent = truncatedText
      }

      await submitToPlaza(strippedContent, shareDialog.diary.diaryId, 'DIARY')
      toast.success(t('diary.toast.publishSuccess'))
      setShareDialog({
        isOpen: false,
        diary: null,
        isLoading: false,
        previewContent: '',
        warnings: [],
        willBeTruncated: false,
        truncatedLength: 0
      })
    } catch {
      toast.error(t('diary.toast.publishFailed'))
      setShareDialog(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleChat = (diary: DiaryType) => {
    const decryptedContent = decryptedContents[diary.diaryId] || diary.content
    openChatWithDiary({
      diaryId: diary.diaryId,
      title: diary.title,
      entryDate: diary.entryDate,
      content: decryptedContent
    })
  }

  const getDisplayContent = (diary: DiaryType): string => {
    const content = diary.clientEncrypted
      ? decryptedContents[diary.diaryId] || `[🔒 ${t('diary.encryptedContent')}]`
      : diary.content
    return refreshManagedImageUrls(content, diary.imageObjectKeys, parseDiaryImageUrls(diary.images))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 md:py-10">
      <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="flex items-center justify-center gap-3 text-3xl font-bold md:justify-start">
            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary shadow-sm shadow-primary/10">
              <Book className="h-6 w-6" />
            </div>
            <span className="text-gradient">{t('diary.pageTitle')}</span>
          </h2>
          <p className="text-muted-foreground">{t('diary.pageSubtitle')}</p>
        </div>

        <div className="flex w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/agent-growth')}
            className="w-full justify-start rounded-xl shadow-sm transition-all hover:border-primary/50 hover:text-primary md:w-auto"
          >
            <TrendingUp className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{t('diary.agentGrowth')}</span>
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20"
      >
        <Card className="glass-card border-white/20 shadow-xl dark:border-white/10">
          <CardHeader className="border-b border-border/50 pb-5">
            <CardTitle className="text-xl">{editingId ? t('diary.editDiary') : t('diary.writeDiary')}</CardTitle>
            <CardDescription>{t('diary.diaryDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(9rem,0.75fr)_minmax(0,2.25fr)]">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('diary.labelDate')}</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('diary.labelTitle')}</label>
                <Input
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder={t('diary.titlePlaceholder')}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('diary.labelContent')}</label>
              <RichTextEditor
                ref={editorRef}
                value={content}
                onChange={(nextContent) => {
                  setContent(nextContent)
                  setEmbeddedImageObjectKeys(Array.from(extractManagedImageKeys(nextContent)))
                }}
                placeholder={t('diary.contentPlaceholder')}
                className="min-h-[300px]"
                userId={userId}
                onImagesChange={({ objectKey, url }) => {
                  setImageObjectKeys((previous) => previous.includes(objectKey) ? previous : [...previous, objectKey])
                  setEmbeddedImageObjectKeys((previous) => previous.includes(objectKey) ? previous : [...previous, objectKey])
                  setImageUrls((previous) => previous.includes(url) ? previous : [...previous, url])
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant={recording ? 'primary' : 'outline'} size="sm" onClick={handleVoiceRecord} disabled={loading || transcribingVoice} isLoading={transcribingVoice}>
                  {recording ? <Square className="mr-1 h-4 w-4" /> : <Mic className="mr-1 h-4 w-4" />}
                  {recording ? t('diary.voice.stop') : voiceState === 'connecting' ? t('diary.voice.connecting') : voiceState === 'finishing' ? t('diary.voice.processing') : t('diary.voice.start')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={loading}
                >
                  <ImageIcon className="mr-1 h-4 w-4" />
                  {t('diary.images.add')}
                </Button>
                {activeImageObjectKeys.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {t('diary.images.addedCount', { count: activeImageObjectKeys.length })}
                  </span>
                )}
              </div>
              {voiceState !== 'idle' && (
                <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] px-3.5 py-3" aria-live="polite">
                  <div className={`mt-0.5 rounded-lg p-2 ${recording ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {recording ? <AudioLines className="h-4 w-4 animate-pulse" aria-hidden="true" /> : <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <span>{voiceState === 'connecting' ? t('diary.voice.connecting') : voiceState === 'finishing' ? t('diary.voice.processing') : t('diary.voice.live')}</span>
                      {recording && <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]" aria-hidden="true" />}
                    </div>
                    <p className="max-h-24 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-foreground/85">
                      {voiceConfirmedText || voiceInterimText
                        ? <><span>{voiceConfirmedText}</span><span className="text-muted-foreground/75">{voiceInterimText}</span></>
                        : t('diary.voice.waiting')}
                    </p>
                  </div>
                </div>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageUpload} disabled={loading} />
              <DiaryImageGallery
                urls={imageUrls.filter((_, index) => {
                  const objectKey = imageObjectKeys[index]
                  return !objectKey || activeImageObjectKeys.includes(objectKey)
                })}
              />
              {activeImageObjectKeys.length > 0 && (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Paperclip className="h-4 w-4 text-primary" aria-hidden="true" />
                        {t('diary.attachments.title')}
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">{t('diary.attachments.description')}</p>
                    </div>
                    <Tabs value={attachmentDisplayMode} onValueChange={(value) => setAttachmentDisplayMode(value as DiaryAttachmentDisplayMode)}>
                      <TabsList className="h-9">
                        <TabsTrigger value="INLINE" className="h-7 px-2.5 text-xs">{t('diary.attachments.inline')}</TabsTrigger>
                        <TabsTrigger value="TRIGGER" className="h-7 px-2.5 text-xs">{t('diary.attachments.trigger')}</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeImageObjectKeys.map((objectKey) => {
                      const imageIndex = imageObjectKeys.indexOf(objectKey)
                      const url = imageIndex >= 0 ? imageUrls[imageIndex] : undefined
                      const binding = attachmentBindings.find((item) => item.type === 'IMAGE' && item.objectKey === objectKey)
                      if (!url) return null
                      return (
                        <div key={objectKey} className="flex min-w-0 gap-3 rounded-xl border border-border/60 bg-background/70 p-2.5">
                          <img src={url} alt="" className="h-16 w-20 shrink-0 rounded-lg border border-border/60 object-cover" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="truncate text-xs text-muted-foreground">{binding ? t('diary.attachments.boundToParagraph') : t('diary.attachments.notBound')}</p>
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                type="button"
                                variant={binding ? 'secondary' : 'outline'}
                                size="sm"
                                className="h-8 rounded-lg px-2 text-xs"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleBindImage(objectKey)}
                              >
                                <Link2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                                {binding ? t('diary.attachments.rebind') : t('diary.attachments.bind')}
                              </Button>
                              {binding && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title={t('diary.attachments.unbind')}
                                  aria-label={t('diary.attachments.unbind')}
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => handleUnbindImage(objectKey)}
                                >
                                  <Unlink className="h-3.5 w-3.5" aria-hidden="true" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('diary.labelLocation')}</label>
              <LocationPicker value={location} onChange={setLocation} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              {t('diary.encryptedNote')}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {editingId && (
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1 sm:flex-none">
                  <X className="w-4 h-4 mr-1" /> {t('diary.cancel')}
                </Button>
              )}
              <Button isLoading={loading} onClick={handleSave} className="flex-1 px-8 shadow-lg shadow-primary/20 sm:flex-none">
                {editingId ? t('diary.updateDiary') : t('diary.saveDiary')}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <div className="space-y-6" id="history-section">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-primary/60" aria-hidden="true" />
          <h3 className="text-xl font-semibold">{t('diary.historyTitle')}</h3>
        </div>

        {diaries.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
            <Book className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{t('diary.noDiaries')}</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {diaries.map((diary, index) => (
              <motion.div
                key={diary.diaryId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border-l-4 border-l-primary/40 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="break-words text-lg font-bold text-primary">
                          <Link to={`/diary/${diary.diaryId}`} className="rounded-sm transition-colors hover:text-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            {diary.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2">
                          <span>{diary.entryDate}</span>
                          {diary.clientEncrypted && (
                            <span className="inline-flex items-center text-[10px] bg-background/50 px-1.5 py-0.5 rounded text-muted-foreground border">
                              <Lock className="w-3 h-3 mr-1" /> {t('diary.encrypted')}
                            </span>
                          )}
                          {diary.placeName && (
                            <span className="inline-flex items-center text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary/70 border border-primary/20">
                              <MapPin className="w-3 h-3 mr-1" /> {diary.placeName}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/diary/${diary.diaryId}`)} title={t('diary.viewDetail')} aria-label={t('diary.viewDetail')}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(diary)} title={t('diary.editTooltip')}>
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    {isRichText(getDisplayContent(diary)) ? (
                      <div
                        className="prose prose-sm max-w-none break-words text-foreground/90 dark:prose-invert [&_blockquote]:border-primary/40 [&_blockquote]:bg-primary/5 [&_img]:my-6 [&_img]:h-auto [&_img]:max-h-[34rem] [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/60 [&_img]:bg-muted/20 [&_img]:object-contain [&_img]:shadow-sm"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(getDisplayContent(diary), { ADD_ATTR: ['data-object-key'] }),
                        }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-foreground/90">
                        {getDisplayContent(diary)}
                      </div>
                    )}
                    <DiaryImageGallery urls={getStandaloneImageUrls(diary, getDisplayContent(diary))} />
                  </CardContent>
                  <CardFooter className="flex flex-wrap justify-start gap-2 bg-muted/10 px-6 py-3 sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChat(diary)}
                      className="text-xs group hover:border-primary/50 hover:text-primary"
                    >
                      <MessageCircle className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" />
                      {t('diary.startChat')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openShareDialog(diary)}
                      className="text-xs group hover:border-primary/50 hover:text-primary"
                    >
                      <Share2 className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" />
                      {t('diary.publishToPlaza')}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4 pb-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loadingList}
                  className="w-9 h-9 p-0"
                >
                  &lt;
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (page > 3 && page < totalPages - 2) {
                      pageNum = page - 2 + i;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    }
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loadingList}
                      className={`w-9 h-9 p-0 ${page === pageNum ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-accent'}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || loadingList}
                  className="w-9 h-9 p-0"
                >
                  &gt;
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 分享到广场确认对话框 */}
      <ConfirmDialog
        isOpen={shareDialog.isOpen}
        title={t('diary.shareConfirm.title')}
        description={undefined}
        variant="primary"
        cancelText={t('common.cancel')}
        confirmText={shareDialog.isLoading ? t('common.publishing') : t('common.confirmPublish')}
        isLoading={shareDialog.isLoading}
        onConfirm={confirmShare}
        onCancel={() => setShareDialog({
          isOpen: false,
          diary: null,
          isLoading: false,
          previewContent: '',
          warnings: [],
          willBeTruncated: false,
          truncatedLength: 0
        })}
      >
        <div className="space-y-4">
          {/* 预览内容 */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1.5">{t('diary.shareConfirm.preview')}:</p>
            <p className="text-sm text-foreground line-clamp-4">{shareDialog.previewContent}</p>
          </div>

          {/* 警告提示 */}
          {shareDialog.warnings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{t('diary.shareConfirm.notice')}</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 space-y-1.5">
                {shareDialog.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 字数统计 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <span>{t('diary.shareConfirm.charCount')}</span>
            <span className={shareDialog.willBeTruncated ? 'text-amber-600 font-medium' : ''}>
              {getCharLength(shareDialog.previewContent.replace('...', ''))} / {PLAZA_MAX_LENGTH}
            </span>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  )
}

export const Diary = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse-slow">
          <Book className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{t('diary.pageTitle')}</h2>
          <p className="text-muted-foreground max-w-sm">{t('diary.pageSubtitle')}</p>
        </div>
        <Link to="/login" state={{ from: '/diary' }}>
          <Button size="lg" className="px-8 shadow-lg shadow-primary/20">{t('diary.loginPrompt')}</Button>
        </Link>
      </div>
    )
  }

  return <DiaryContent userId={user.userId} />
}
