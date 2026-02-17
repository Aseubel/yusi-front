import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, StopCircle, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { cn, API_BASE } from '../utils'
import { useAuthStore } from '../store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
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

  // 当打开聊天窗口时加载历史记录
  useEffect(() => {
    if (isOpen && user) {
      loadChatHistory()
    }
  }, [isOpen, user, token])

  useEffect(() => {
    if (isOpen && initialMessage) {
      setInput(initialMessage)
      setInitialMessage('')
    }
  }, [isOpen, initialMessage, setInitialMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !user || isStreaming) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)

    const aiMsgId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '', pending: true },
    ])

    try {
      abortControllerRef.current = new AbortController()
      const response = await fetch(
        `${API_BASE}/ai/chat/stream?message=${encodeURIComponent(userMsg.content)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortControllerRef.current.signal,
        }
      )

      if (!response.ok) {
        // Try to parse error response
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          const errorCode = errorData.code

          // Handle specific error codes
          if (errorCode === 42901) {
            toast.error('您有一个AI请求正在处理中，请等待完成后再试')
            // Remove the pending AI message
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
            // Process any remaining buffer content
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
        // Keep the last part in buffer as it might be incomplete
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

  if (!user) return null

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 right-4 z-50 w-[380px] h-[500px] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-background/95 backdrop-blur border border-border/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold text-sm">小予AI</span>
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
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-2">
                  <MessageCircle className="h-8 w-8 opacity-50" />
                  <p>开启一段对话...</p>
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
                      'max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted/50 border border-border/50 rounded-bl-none'
                    )}
                  >
                    {msg.content}
                    {msg.pending && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-current animate-bounce" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/40 bg-background/50">
              <div className="relative flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="说点什么吧..."
                  className="pr-10 rounded-full bg-muted/30 border-border/40 focus-visible:ring-1"
                  disabled={isStreaming}
                />
                {isStreaming ? (
                  <Button
                    size="icon"
                    variant="danger"
                    className="absolute right-1 h-8 w-8 rounded-full"
                    onClick={handleStop}
                  >
                    <StopCircle className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="primary"
                    className="absolute right-1 h-8 w-8 rounded-full"
                    onClick={handleSend}
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
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
