import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, RichTextEditor, ConfirmDialog } from './ui'
import { toast } from 'sonner'
import DOMPurify from 'dompurify'
import { useState, useEffect, useCallback } from 'react'
import { writeDiary, editDiary, getDiaryList, submitToPlaza, type Diary as DiaryType } from '../lib'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, MessageCircle, Edit2, X, Book, MapPin, Share2, Clock, Users, AlertCircle } from 'lucide-react'
import { useChatStore } from '../stores'
import { useEncryptionStore } from '../stores/encryptionStore'
import { useAuthStore } from '../store/authStore'

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

  // 离线草稿：加载
  useEffect(() => {
    if (!editingId && userId) {
      try {
        const saved = localStorage.getItem(`diary_draft_${userId}`)
        if (saved) {
          const draft = JSON.parse(saved)
          if (draft.title) setTitle(draft.title)
          if (draft.content) setContent(draft.content)
          if (draft.date) setDate(draft.date)
          if (draft.location) setLocation(draft.location)
        }
      } catch (e) {
        console.error('Failed to load diary draft', e)
      }
    }
  }, [userId, editingId])

  // 离线草稿：保存
  useEffect(() => {
    if (!editingId && userId) {
      // 只有在内容有实质更新时才保存，防止空内容覆盖有效草稿
      if (title || content || location) {
        const draft = { title, content, date, location }
        localStorage.setItem(`diary_draft_${userId}`, JSON.stringify(draft))
      } else {
        localStorage.removeItem(`diary_draft_${userId}`)
      }
    }
  }, [title, content, date, location, userId, editingId])

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
  }, [cryptoKey, decrypt])

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
      loadDiaries(1)
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
          placeId: location?.placeId
        })
        toast.success(t('diary.toast.updateSuccess', '日记已更新'))
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
          placeId: location?.placeId
        })
        toast.success(t('diary.toast.saveSuccess'))
        localStorage.removeItem(`diary_draft_${userId}`)
      }
      setTitle('')
      setContent('')
      setDate(new Date().toISOString().split('T')[0])
      setLocation(null)
      loadDiaries(1)
    } catch {
      toast.error(t('diary.toast.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (diary: DiaryType) => {
    setEditingId(diary.diaryId)
    setTitle(diary.title)
    const decrypted = decryptedContents[diary.diaryId] || diary.content
    setContent(decrypted)
    setDate(diary.entryDate)
    if (Number.isFinite(Number(diary.latitude)) && Number.isFinite(Number(diary.longitude))) {
      setLocation({
        latitude: Number(diary.latitude),
        longitude: Number(diary.longitude),
        address: diary.address,
        placeName: diary.placeName,
        placeId: diary.placeId
      })
    } else {
      setLocation(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setDate(new Date().toISOString().split('T')[0])
    setLocation(null)
  }

  // 打开分享确认对话框
  const openShareDialog = async (diary: DiaryType) => {
    const decryptedContent = decryptedContents[diary.diaryId] || diary.content
    if (decryptedContent.startsWith('[🔒') || decryptedContent.startsWith('[无法解密')) {
      toast.error(t('diary.toast.cannotShareEncrypted'))
      return
    }

    const strippedContent = stripImagesAndHtml(decryptedContent)
    if (strippedContent.trim().length < 5) {
      toast.error('分享内容不能为空')
      return
    }

    const warnings: string[] = []
    const contentHasImages = hasImages(decryptedContent)
    const charLength = getCharLength(strippedContent)
    const willBeTruncated = charLength > PLAZA_MAX_LENGTH

    // 检查是否有图片
    if (contentHasImages) {
      warnings.push('• 检测到图片内容，分享到广场后图片将被隐藏')
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
      warnings.push(`• 内容字数 (${charLength} 字符) 超过限制 (${PLAZA_MAX_LENGTH} 字符)，将被截断为 ${truncatedLength} 字符`)
      warnings.push('• 建议手动复制希望分享的内容，重新发布到广场')
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
  }

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
    if (!diary.clientEncrypted) {
      return diary.content
    }
    return decryptedContents[diary.diaryId] || `[🔒 ${t('diary.encryptedContent')}]`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl font-bold flex items-center gap-3 justify-center md:justify-start">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Book className="w-6 h-6" />
            </div>
            <span className="text-gradient">{t('diary.pageTitle')}</span>
          </h2>
          <p className="text-muted-foreground">{t('diary.pageSubtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/timeline')}
            className="rounded-full shadow-sm hover:border-primary/50 hover:text-primary transition-all"
          >
            <Clock className="w-4 h-4 mr-2" />
            {t('diary.timeline')}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/community')}
            className="rounded-full shadow-sm hover:border-primary/50 hover:text-primary transition-all"
          >
            <Users className="w-4 h-4 mr-2" />
            {t('diary.relationship')}
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20"
      >
        <Card className="glass-card border-white/20 dark:border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">{editingId ? t('diary.editDiary') : t('diary.writeDiary')}</CardTitle>
            <CardDescription>{t('diary.diaryDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('diary.labelDate')}</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
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
                value={content}
                onChange={setContent}
                placeholder={t('diary.contentPlaceholder')}
                className="min-h-[300px]"
                userId={userId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('diary.labelLocation')}</label>
              <LocationPicker value={location} onChange={setLocation} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border/50 pt-6">
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
              <Button isLoading={loading} onClick={handleSave} className="flex-1 sm:flex-none px-8 shadow-lg shadow-primary/20">
                {editingId ? t('diary.updateDiary') : t('diary.saveDiary')}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <div className="space-y-6" id="history-section">
        <h3 className="text-xl font-semibold px-2 border-l-4 border-primary/50 pl-4">{t('diary.historyTitle')}</h3>

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
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/40">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold text-primary">{diary.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
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
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(diary)} title={t('diary.editTooltip')}>
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {isRichText(getDisplayContent(diary)) ? (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 break-words"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getDisplayContent(diary)) }}
                      />
                    ) : (
                      <div className="text-sm leading-7 whitespace-pre-wrap font-sans text-foreground/90 break-words">
                        {getDisplayContent(diary)}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/10 flex justify-end gap-3 py-3 px-6">
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
        title={t('diary.shareConfirm.title', '确认分享到广场')}
        description={undefined}
        variant="primary"
        cancelText={t('common.cancel', '取消')}
        confirmText={shareDialog.isLoading ? t('common.publishing', '发布中...') : t('common.confirmPublish', '确认发布')}
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
            <p className="text-xs text-muted-foreground mb-1.5">{t('diary.shareConfirm.preview', '内容预览')}:</p>
            <p className="text-sm text-foreground line-clamp-4">{shareDialog.previewContent}</p>
          </div>

          {/* 警告提示 */}
          {shareDialog.warnings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{t('diary.shareConfirm.notice', '注意事项')}</span>
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
            <span>{t('diary.shareConfirm.charCount', '字符统计')}</span>
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
