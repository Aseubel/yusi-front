import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, StopCircle, Loader2, Book, AtSign, Image as ImageIcon, XCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { cn, API_BASE } from '../utils'
import { useAuthStore } from '../store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { getDiaryList, type Diary as DiaryType, imageApi } from '../lib'
import { useChatStore, type DiaryReference } from '../stores'
import { useTranslation } from 'react-i18next'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  pending?: boolean
}


export const ChatWidget = () => {
  const { t } = useTranslation()
  const { user, token } = useAuthStore()
  const { isOpen, setIsOpen, initialMessage, setInitialMessage, initialDiaries, setInitialDiaries } = useChatStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [showDiaryPicker, setShowDiaryPicker] = useState(false)
  const [diaries, setDiaries] = useState<DiaryType[]>([])
  const [diaryReferences, setDiaryReferences] = useState<DiaryReference[]>([])
  const [loadingDiaries, setLoadingDiaries] = useState(false)
  const [atPosition, setAtPosition] = useState<number | null>(null)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  // 拖动状态
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 离线草稿加载
  useEffect(() => {
    if (user?.userId) {
      try {
        const saved = localStorage.getItem(`chat_draft_${user.userId}`)
        if (saved) {
          const draft = JSON.parse(saved)
          if (draft.input) setInput(draft.input)
          if (Array.isArray(draft.diaryReferences)) setDiaryReferences(draft.diaryReferences)
        }
      } catch (e) {
        console.error('Failed to load chat draft:', e)
      }
    }
  }, [user?.userId])

  // 离线草稿保存
  useEffect(() => {
    if (user?.userId) {
      if (input || diaryReferences.length > 0) {
        localStorage.setItem(`chat_draft_${user.userId}`, JSON.stringify({ input, diaryReferences }))
      } else {
        localStorage.removeItem(`chat_draft_${user.userId}`)
      }
    }
  }, [input, diaryReferences, user?.userId])

  // 加载日记列表
  const loadDiaries = useCallback(async () => {
    if (!user?.userId) return
    setLoadingDiaries(true)
    try {
      const response = await getDiaryList(user.userId, 1, 20)
      setDiaries(response.content)
    } catch (error) {
      console.error('Failed to load diaries:', error)
    } finally {
      setLoadingDiaries(false)
    }
  }, [user?.userId])

  // 加载聊天历史
  const loadChatHistory = useCallback(async () => {
    if (!token || historyLoaded) return

    setIsLoadingHistory(true)
    try {
      const response = await fetch(`${API_BASE}/ai/chat/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data && Array.isArray(data.data)) {
          const historyMessages: Message[] = data.data.map((msg: { role: string; content: string }, index: number) => {
            let displayContent = msg.content

            // 针对后端的原始带有日记模板前伸的内容进行界面美化
            if (msg.role === 'user' && displayContent.includes('【日记】')) {
              const parts = displayContent.split('\n\n')
              const inputParts: string[] = []
              const titles: string[] = []

              for (const part of parts) {
                if (part.startsWith('【日记】')) {
                  const titleMatch = part.match(/【日记】(.*?)\n/)
                  if (titleMatch && titleMatch[1]) {
                    titles.push(`📄 ${titleMatch[1]}`)
                  }
                } else {
                  inputParts.push(part)
                }
              }

              if (titles.length > 0) {
                displayContent = `${titles.join(' ')}\n${inputParts.join('\n\n')}`
              }
            }

            return {
              id: `history-${index}`,
              role: msg.role as 'user' | 'assistant',
              content: displayContent,
            }
          })
          setMessages(historyMessages)
        }
      }
      setHistoryLoaded(true)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [token, historyLoaded])

  // 当打开聊天窗口时加载历史记录和日记列表
  useEffect(() => {
    if (isOpen && user?.userId) {
      loadChatHistory()
      loadDiaries()
    }
  }, [isOpen, user?.userId, loadDiaries, loadChatHistory])

  useEffect(() => {
    if (isOpen && initialMessage) {
      setInput(initialMessage)
      setInitialMessage('')
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen, initialMessage, setInitialMessage])

  useEffect(() => {
    if (isOpen && initialDiaries && initialDiaries.length > 0) {
      setDiaryReferences((prev) => {
        const newRefs = [...prev]
        initialDiaries.forEach((diary) => {
          if (!newRefs.find((d) => d.diaryId === diary.diaryId)) {
            newRefs.push(diary)
          }
        })
        return newRefs
      })
      setInitialDiaries([])
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen, initialDiaries, setInitialDiaries])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  // 处理输入变化，检测@符号
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setInput(value)

    const lastAtIndex = value.lastIndexOf('@', cursorPos - 1)
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1, cursorPos)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setAtPosition(lastAtIndex)
        setShowDiaryPicker(true)
        return
      }
    }
    setShowDiaryPicker(false)
    setAtPosition(null)
  }

  // 选择日记
  const handleSelectDiary = (diary: DiaryType) => {
    if (atPosition === null) return

    const diaryRef: DiaryReference = {
      diaryId: diary.diaryId,
      title: diary.title,
      entryDate: diary.entryDate,
      content: diary.content
    }

    if (!diaryReferences.find(d => d.diaryId === diary.diaryId)) {
      setDiaryReferences(prev => [...prev, diaryRef])
    }

    const beforeAt = input.slice(0, atPosition)
    const afterMatch = input.slice(textareaRef.current?.selectionStart || atPosition + 1)
    setInput(`${beforeAt}${afterMatch}`)

    setShowDiaryPicker(false)
    setAtPosition(null)

    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleRemoveDiaryRef = (diaryId: string) => {
    setDiaryReferences(prev => prev.filter(d => d.diaryId !== diaryId))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user?.userId) return

    setUploadingImage(true)
    try {
      for (const file of Array.from(files)) {
        const response = await imageApi.upload(file, user.userId)
        if (response.data) {
          setPendingImages(prev => [...prev, response.data.objectKey])
        }
      }
    } catch (error) {
      toast.error('图片上传失败')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = (objectKey: string) => {
    setPendingImages(prev => prev.filter(k => k !== objectKey))
  }

  const buildMessageContent = (): string => {
    let content = input

    if (diaryReferences.length > 0) {
      const diaryContext = diaryReferences.map(d =>
        `【日记】${d.title}\n日期：${d.entryDate}\n内容：${d.content}`
      ).join('\n\n')
      content = `${diaryContext}\n\n${input}`
    }

    return content
  }

  const handleSend = async () => {
    const messageContent = buildMessageContent()
    if ((!messageContent.trim() && pendingImages.length === 0) || !user || isStreaming) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: diaryReferences.length > 0
        ? `${diaryReferences.map(d => `📄 ${d.title}`).join(' ')}\n${input}`
        : input,
      images: pendingImages.length > 0 ? pendingImages : undefined,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setDiaryReferences([])
    const currentImages = [...pendingImages]
    setPendingImages([])
    if (user) {
      localStorage.removeItem(`chat_draft_${user.userId}`)
    }
    setIsStreaming(true)

    const aiMsgId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '', pending: true },
    ])

    try {
      abortControllerRef.current = new AbortController()
      const response = await fetch(
        `${API_BASE}/ai/chat/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: messageContent,
            images: currentImages.length > 0 ? currentImages : undefined,
          }),
          signal: abortControllerRef.current.signal,
        }
      )

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          const errorCode = errorData.code

          if (errorCode === 42901) {
            toast.error(t('chat.queueError'))
            setMessages((prev) => prev.filter((msg) => msg.id !== aiMsgId))
            return
          }

          throw new Error(errorData.info || t('chat.error'))
        }
        throw new Error(t('chat.error'))
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader available')

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          if (buffer.length > 0) {
            if (buffer.startsWith('data:')) {
              const data = buffer.slice(5)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId
                    ? { ...msg, content: msg.content + data, pending: false }
                    : msg
                )
              )
            }
          }
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5)
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? { ...msg, content: msg.content + data, pending: false }
                  : msg
              )
            )
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        toast.info(t('chat.responseStopped'))
      } else {
        const message = error instanceof Error ? error.message : ''
        console.error('Chat error:', error)
        toast.error(message || t('chat.error'))
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { ...msg, content: msg.content + '\n[Error: Connection failed]', pending: false }
              : msg
          )
        )
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!showDiaryPicker) {
        handleSend()
      }
    }
    if (e.key === 'Escape' && showDiaryPicker) {
      setShowDiaryPicker(false)
    }
  }

  const filteredDiaries = diaries.filter(diary => {
    if (atPosition === null) return true
    const searchText = input.slice(atPosition + 1, textareaRef.current?.selectionStart || 0).toLowerCase()
    return diary.title.toLowerCase().includes(searchText)
  })

  // 拖动处理
  const handlePointerDown = (e: React.PointerEvent) => {
    // 只在标题栏或气泡上触发拖动
    const target = e.target as HTMLElement
    const isDragHandle = target.closest('[data-drag-handle]')
    if (!isDragHandle) return

    // 注意：这里不要调用 preventDefault，否则会阻止 PC 端的 click 事件
    isDraggingRef.current = false
    setIsDragging(false)

    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
    // 移除 setPointerCapture，改为在 move 时捕获
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return

    // 如果还没有开始拖拽，检查移动距离是否超过阈值
    if (!isDraggingRef.current) {
      // 检查鼠标是否按下（buttons === 1 表示左键按下）
      // 注意：PointerEvent 在移动端可能 buttons 为 0，所以仅对鼠标强制约束
      if (e.pointerType === 'mouse' && e.buttons === 0) return

      const currentX = e.clientX - dragStartPos.current.x
      const currentY = e.clientY - dragStartPos.current.y

      // 注意：position 是状态中的偏移量，不是绝对位置
      const moveX = Math.abs(currentX - position.x)
      const moveY = Math.abs(currentY - position.y)

      if (moveX > 5 || moveY > 5) {
        isDraggingRef.current = true
        setIsDragging(true)
          // 确认拖拽后再捕获指针
          ; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } else {
        return
      }
    }

    e.preventDefault()
    let newX = e.clientX - dragStartPos.current.x
    let newY = e.clientY - dragStartPos.current.y

    // 获取组件尺寸和屏幕尺寸
    const { width, height } = containerRef.current.getBoundingClientRect()
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    // 初始位置 CSS: bottom-24 (96px), right-4 (16px)
    const initialRight = 16
    const initialBottom = 96

    // 计算边界限制
    // X轴: 向右最多移动 initialRight (贴右边), 向左最多移动到屏幕左边缘
    const maxX = initialRight
    const minX = width + initialRight - screenWidth

    // Y轴: 向下最多移动 initialBottom (贴底边), 向上最多移动到屏幕上边缘
    const maxY = initialBottom
    const minY = height + initialBottom - screenHeight

    // 应用限制
    newX = Math.min(Math.max(newX, minX), maxX)
    newY = Math.min(Math.max(newY, minY), maxY)

    setPosition({ x: newX, y: newY })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      setIsDragging(false)
        ; (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    }
  }

  // 点击气泡切换状态
  const handleBubbleClick = (e: React.MouseEvent) => {
    // 如果刚刚发生了拖拽，则阻止点击事件
    if (isDraggingRef.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    setIsOpen(!isOpen)
  }

  if (!user) return null

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 right-4 z-110 select-none"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none', // 确保在移动端触摸整个组件不会随页面乱滚
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[calc(100vw-32px)] sm:w-[420px] h-[60vh] sm:h-[560px] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-background/95 backdrop-blur border border-border/50 mb-4"
          >
            {/* Header - 拖动手柄 */}
            <div
              data-drag-handle
              className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/30 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold text-sm">{t('chat.title')}</span>
                <span className="text-xs text-muted-foreground ml-2">{t('chat.placeholder')}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ touchAction: 'auto' }} onPointerDown={(e) => e.stopPropagation()}>
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-2">
                  <Loader2 className="h-8 w-8 opacity-50 animate-spin" />
                  <p>{t('chat.historyLoading')}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-4">
                  <MessageCircle className="h-8 w-8 opacity-50" />
                  <p>{t('chat.startConversation')}</p>
                  <div className="text-xs text-muted-foreground/70 space-y-1 text-center">
                    <p>💡 {t('chat.tips.at')}</p>
                    <p>{t('chat.tips.enter')}</p>
                  </div>
                </div>
              ) : null}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex w-full',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted/50 border border-border/50 rounded-bl-none'
                    )}
                  >
                    <div className="whitespace-pre-wrap wrap-break-word leading-relaxed">{msg.content}</div>
                    {msg.pending && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-current animate-bounce" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 日记引用标签 */}
            {diaryReferences.length > 0 && (
              <div className="px-4 py-2 border-t border-border/20 bg-muted/10 flex flex-wrap gap-2">
                {diaryReferences.map((ref) => (
                  <motion.div
                    key={ref.diaryId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20"
                  >
                    <Book className="w-3 h-3" />
                    <span className="max-w-[100px] truncate">{ref.title}</span>
                    <button
                      onClick={() => handleRemoveDiaryRef(ref.diaryId)}
                      className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 日记选择器 */}
            <AnimatePresence>
              {showDiaryPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="border-t border-border/40 bg-background/95 max-h-[180px] overflow-y-auto"
                >
                  <div className="p-2 text-xs text-muted-foreground flex items-center gap-1 border-b border-border/20">
                    <AtSign className="w-3 h-3" />
                    {t('chat.diaryPicker.title')}
                  </div>
                  {loadingDiaries ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      {t('chat.diaryPicker.loading')}
                    </div>
                  ) : filteredDiaries.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {t('chat.diaryPicker.noMatch')}
                    </div>
                  ) : (
                    <div className="py-1">
                      {filteredDiaries.slice(0, 5).map((diary) => (
                        <button
                          key={diary.diaryId}
                          onClick={() => handleSelectDiary(diary)}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2"
                        >
                          <Book className="w-4 h-4 text-primary/70 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{diary.title}</div>
                            <div className="text-xs text-muted-foreground">{diary.entryDate}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-4 border-t border-border/40 bg-background/50">
              {/* 待发送的图片预览 */}
              {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pendingImages.map((objectKey) => (
                    <div key={objectKey} className="relative group">
                      <img
                        src={`${API_BASE}/image/url?objectKey=${encodeURIComponent(objectKey)}`}
                        alt="pending"
                        className="w-16 h-16 object-cover rounded-lg border border-border/50"
                      />
                      <button
                        onClick={() => handleRemoveImage(objectKey)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative flex items-end gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isStreaming || uploadingImage}
                  />
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    uploadingImage ? "bg-muted animate-pulse" : "bg-muted/50 hover:bg-muted"
                  )}>
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </label>
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chat.inputPlaceholder')}
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-muted/30 border-border/40 focus-visible:ring-1 pr-12 py-2.5"
                  disabled={isStreaming}
                  rows={1}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {isStreaming ? (
                    <Button
                      size="icon"
                      variant="danger"
                      className="h-8 w-8 rounded-full"
                      onClick={handleStop}
                    >
                      <StopCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="primary"
                      className="h-8 w-8 rounded-full"
                      onClick={handleSend}
                      disabled={!input.trim() && diaryReferences.length === 0}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 气泡按钮 - 始终在右下角 */}
      <motion.button
        data-drag-handle
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBubbleClick}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors ml-auto"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  )
}
