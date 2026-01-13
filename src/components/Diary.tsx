import { Button, Textarea, Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter, Input } from './ui'
import { toast } from 'sonner'
import { useState, useEffect, useCallback } from 'react'
import { writeDiary, editDiary, getDiaryList, generateAiResponse, type Diary as DiaryType } from '../lib'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Sparkles, Lock, MessageCircle, Edit2, X, Settings, Unlock } from 'lucide-react'
import { cn } from '../utils'
import { useChatStore } from '../stores'
import { useEncryptionStore } from '../stores/encryptionStore'

export const Diary = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [genLoading, setGenLoading] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [diaries, setDiaries] = useState<DiaryType[]>([])
  const [decryptedContents, setDecryptedContents] = useState<Record<string, string>>({})
  const userId = localStorage.getItem('yusi-user-id') || ''

  const { setIsOpen, setInitialMessage } = useChatStore()
  const {
    initialize: initEncryption,
    hasActiveKey,
    encrypt,
    decrypt,
    keyMode,
    isInitialized: encryptionInitialized,
    cryptoKey
  } = useEncryptionStore()

  // Initialize encryption on mount
  useEffect(() => {
    initEncryption()
  }, [initEncryption])

  // Decrypt a single diary content
  const decryptDiary = useCallback(async (diary: DiaryType): Promise<string> => {
    if (!diary.clientEncrypted || !cryptoKey) {
      return diary.content
    }
    try {
      return await decrypt(diary.content)
    } catch {
      console.warn('Failed to decrypt diary:', diary.diaryId)
      return '[无法解密，请检查密钥]'
    }
  }, [cryptoKey, decrypt])

  // Load and decrypt diaries
  const loadDiaries = useCallback(async () => {
    if (!userId) return
    try {
      const list = await getDiaryList(userId)
      setDiaries(list)

      // Decrypt contents if we have an active key
      if (hasActiveKey()) {
        const decrypted: Record<string, string> = {}
        for (const diary of list) {
          decrypted[diary.diaryId] = await decryptDiary(diary)
        }
        setDecryptedContents(decrypted)
      }
    } catch (e) {
      console.error('Failed to load diaries', e)
    }
  }, [userId, hasActiveKey, decryptDiary])

  useEffect(() => {
    if (encryptionInitialized) {
      loadDiaries()
    }
  }, [encryptionInitialized, loadDiaries])

  // Re-decrypt when key becomes available
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
      toast.error('标题与内容不能为空')
      return
    }

    if (!hasActiveKey()) {
      toast.error('请先解锁或配置密钥')
      navigate('/settings')
      return
    }

    setLoading(true)
    try {
      // Encrypt content before sending
      const encryptedContent = await encrypt(content)

      if (editingId) {
        await editDiary({ userId, diaryId: editingId, title, content: encryptedContent, entryDate: date })
        toast.success('日记已更新')
        setEditingId(null)
      } else {
        await writeDiary({ userId, title, content: encryptedContent, entryDate: date })
        toast.success('日记已保存')
      }
      setTitle('')
      setContent('')
      setDate(new Date().toISOString().split('T')[0])
      loadDiaries()
    } catch (e) {
      toast.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (diary: DiaryType) => {
    setEditingId(diary.diaryId)
    setTitle(diary.title)
    // Use decrypted content
    const decrypted = decryptedContents[diary.diaryId] || diary.content
    setContent(decrypted)
    setDate(diary.entryDate)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setDate(new Date().toISOString().split('T')[0])
  }

  const handleGenerate = async (diaryId: string) => {
    setGenLoading(diaryId)
    try {
      await generateAiResponse(diaryId)
      toast.success('AI回应生成中，请稍候刷新')
      setTimeout(loadDiaries, 3000)
    } catch (e) {
      // error handled
    } finally {
      setGenLoading(null)
    }
  }

  const handleChat = (diary: DiaryType) => {
    const decryptedContent = decryptedContents[diary.diaryId] || diary.content
    const context = `我刚写了一篇日记：\n标题：${diary.title}\n内容：${decryptedContent}\n\nAI的回应是：${diary.aiResponse}\n\n`
    setInitialMessage(context)
    setIsOpen(true)
  }

  // Get display content (decrypted if available)
  const getDisplayContent = (diary: DiaryType): string => {
    if (!diary.clientEncrypted) {
      return diary.content
    }
    return decryptedContents[diary.diaryId] || '[🔒 内容已加密，请解锁查看]'
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回首页
        </Link>
        <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
          <Settings className="w-4 h-4 mr-1" />
          密钥设置
        </Button>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500 dark:from-indigo-400 dark:to-cyan-400">
          AI知己 · 私密日记
        </h2>
        <p className="text-muted-foreground text-lg">端到端加密，仅你可见。</p>

        {/* Encryption status indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-secondary/50">
          {keyMode === 'CUSTOM' ? (
            cryptoKey ? (
              <>
                <Unlock className="w-4 h-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">自定义密钥 · 已解锁</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">自定义密钥 · 已锁定</span>
                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => navigate('/settings')}>
                  解锁
                </Button>
              </>
            )
          ) : (
            <>
              <Lock className="w-4 h-4 text-blue-500" />
              <span className="text-blue-600 dark:text-blue-400">默认密钥 · 自动保护</span>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? '编辑日记' : '写日记'}</CardTitle>
          <CardDescription>记录你的经历、想法与感受。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">日期</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">标题</label>
            <Input
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="给今天起个名字"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">内容</label>
            <Textarea
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              rows={10}
              placeholder="开始书写..."
              className="resize-none"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-xs text-muted-foreground">所有内容端到端加密，仅用于AI分析。</div>
          <div className="flex gap-2 w-full sm:w-auto">
            {editingId && (
              <Button variant="outline" onClick={handleCancelEdit} className="flex-1 sm:flex-none">
                <X className="w-4 h-4 mr-1" /> 取消
              </Button>
            )}
            <Button isLoading={loading} onClick={handleSave} className="flex-1 sm:flex-none">
              {editingId ? '更新日记' : '保存日记'}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <h3 className="text-2xl font-semibold tracking-tight">往期日记</h3>
        {diaries.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            暂无日记，写下第一篇吧。
          </div>
        )}
        {diaries.map((diary) => (
          <Card key={diary.diaryId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{diary.title}</CardTitle>
                  <CardDescription>
                    {new Date(diary.createTime).toLocaleString()} <Lock className="inline w-3 h-3 ml-1" />
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(diary)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {diary.aiResponse ? (
                    <>
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        <Sparkles className="w-3 h-3 mr-1" /> 已回应
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleChat(diary)}>
                        <MessageCircle className="w-4 h-4 mr-1" /> 聊聊
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={genLoading === diary.diaryId}
                      onClick={() => handleGenerate(diary.diaryId)}
                    >
                      <Sparkles className="w-3 h-3 mr-1" /> 生成AI回应
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground/90">
                {getDisplayContent(diary)}
              </div>

              {diary.aiResponse && (
                <div className="mt-4 rounded-lg bg-secondary/50 p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                    <Sparkles className="w-4 h-4" />
                    Yusi 的回应
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {diary.aiResponse}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Badge({ children, className }: any) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
      {children}
    </span>
  )
}