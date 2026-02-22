import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, StopCircle, Loader2, Book, AtSign } from 'lucide-react'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { cn, API_BASE } from '../utils'
import { useAuthStore } from '../store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { getDiaryList, type Diary as DiaryType } from '../lib'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

interface DiaryReference {
  diaryId: string
  title: string
  entryDate: string
  content: string
}

import { useChatStore } from '../stores'

export const ChatWidget = () => {
  const { user, token } = useAuthStore()
  const { isOpen, setIsOpen, initialMessage, setInitialMessage } = useChatStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // @日记选择相关状态
  const [showDiaryPicker, setShowDiaryPicker] = useState(false)
  const [diaries, setDiaries] = useState<DiaryType[]>([])
  const [diaryReferences, setDiaryReferences] = useState<DiaryReference[]>([])
  const [loadingDiaries, setLoadingDiaries] = useState(false)
  const [atPosition, setAtPosition] = useState<number | null>(null)

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
  const loadChatHistory = async () => {
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
          const historyMessages: Message[] = data.data.map((msg: { role: string; content: string }, index: number) => ({
            id: `history-${index}`,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }))
          setMessages(historyMessages)
        }
      }
      setHistoryLoaded(true)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // 当打开聊天窗口时加载历史记录和日记列表
  useEffect(() => {
    if (isOpen && user) {
      loadChatHistory()
      loadDiaries()
    }
  }, [isOpen, user, token, loadDiaries])

  useEffect(() => {
    if (isOpen && initialMessage) {
      setInput(initialMessage)
      setInitialMessage('')
      // 自动聚焦到输入框
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen, initialMessage, setInitialMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 自动调整输入框高度
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

    // 检测@符号
    const lastAtIndex = value.lastIndexOf('@', cursorPos - 1)
    if (lastAtIndex !== -1) {
      // 检查@后面是否有空格或换行（如果有则不显示选择器）
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
    
    // 添加日记引用
    const diaryRef: DiaryReference = {
      diaryId: diary.diaryId,
      title: diary.title,
      entryDate: diary.entryDate,
      content: diary.content
    }
    
    // 检查是否已经引用过这个日记
    if (!diaryReferences.find(d => d.diaryId === diary.diaryId)) {
      setDiaryReferences(prev => [...prev, diaryRef])
    }

    // 替换@及其后面的文字为日记标题
    const beforeAt = input.slice(0, atPosition)
    const afterCursor = input.slice(textareaRef.current?.selectionStart || atPosition + 1)
    setInput(`${beforeAt}@${diary.title} ${afterCursor}`)
    
    setShowDiaryPicker(false)
    setAtPosition(null)
    
    // 聚焦回输入框
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  // 移除日记引用
  const handleRemoveDiaryRef = (diaryId: string) => {
    setDiaryReferences(prev => prev.filter(d => d.diaryId !== diaryId))
  }

  // 构建最终发送的消息内容
  const buildMessageContent = (): string => {
    let content = input
    
    // 如果有日记引用，添加到消息前面
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
    if (!messageContent.trim() || !user || isStreaming) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: diaryReferences.length > 0 
        ? `${diaryReferences.map(d => `📄 ${d.title}`).join(' ')}\n${input}`
        : input,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setDiaryReferences([])
    setIsStreaming(true)

    const aiMsgId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '', pending: true },
    ])

    try {
      abortControllerRef.current = new AbortController()
      const response = await fetch(
        `${API_BASE}/ai/chat/stream?message=${encodeURIComponent(messageContent)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortControllerRef.current.signal,
        }
      )

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          const errorCode = errorData.code

          if (errorCode === 42901) {
            toast.error('您有一个AI请求正在处理中，请等待完成后再试')
            setMessages((prev) => prev.filter((msg) => msg.id !== aiMsgId))
            return
          }

          throw new Error(errorData.info || 'AI服务连接失败')
        }
        throw new Error('AI服务连接失败')
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
        toast.info('响应已停止')
      } else {
        const message = error instanceof Error ? error.message : ''
        console.error('Chat error:', error)
        toast.error(message || '获取响应失败')
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { ...msg, content: msg.content + '\n[错误: 连接失败]', pending: false }
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

  // 处理键盘事件
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

  // 过滤日记列表
  const filteredDiaries = diaries.filter(diary => {
    if (atPosition === null) return true
    const searchText = input.slice(atPosition + 1, textareaRef.current?.selectionStart || 0).toLowerCase()
    return diary.title.toLowerCase().includes(searchText)
  })

  if (!user) return null

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 right-4 z-50 w-[420px] h-[560px] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-background/95 backdrop-blur border border-border/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold text-sm">小予AI</span>
                <span className="text-xs text-muted-foreground ml-2">输入 @ 引用日记</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-2">
                  <Loader2 className="h-8 w-8 opacity-50 animate-spin" />
                  <p>加载历史记录...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-4">
                  <MessageCircle className="h-8 w-8 opacity-50" />
                  <p>开启一段对话...</p>
                  <div className="text-xs text-muted-foreground/70 space-y-1 text-center">
                    <p>💡 输入 <span className="text-primary">@</span> 可以引用你的日记</p>
                    <p>按 <span className="text-primary">Enter</span> 发送，<span className="text-primary">Shift+Enter</span> 换行</p>
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
                    <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
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
                    选择要引用的日记
                  </div>
                  {loadingDiaries ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      加载中...
                    </div>
                  ) : filteredDiaries.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      没有找到匹配的日记
                    </div>
                  ) : (
                    <div className="py-1">
                      {filteredDiaries.slice(0, 5).map((diary) => (
                        <button
                          key={diary.diaryId}
                          onClick={() => handleSelectDiary(diary)}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2"
                        >
                          <Book className="w-4 h-4 text-primary/70 flex-shrink-0" />
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
              <div className="relative flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="说点什么吧... 输入@引用日记"
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

      <motion.button
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors touch-none"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>
    </>
  )
}
