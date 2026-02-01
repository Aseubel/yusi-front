import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, StopCircle } from 'lucide-react'
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
  // const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!token) return

    const es = new EventSource(`${API_BASE}/sse/connect?token=${token}`)

    es.onmessage = (event) => {
      const data = event.data
      
      if (data === '[DONE]') {
        setIsStreaming(false)
        setMessages((prev) => 
          prev.map((msg) => (msg.pending ? { ...msg, pending: false } : msg))
        )
        return
      }

      if (data.startsWith('[ERROR]')) {
        toast.error(data.substring(7)) // Remove [ERROR]: prefix
        setIsStreaming(false)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.pending
              ? { ...msg, pending: false, content: msg.content + '\n' + data }
              : msg
          )
        )
        return
      }

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1]
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.pending) {
          return prev.map((msg, index) =>
            index === prev.length - 1
              ? { ...msg, content: msg.content + data }
              : msg
          )
        }
        return prev
      })
    }

    es.onerror = (err) => {
      console.error('SSE Error:', err)
      // EventSource automatically reconnects, but we might want to log or notify
    }

    eventSourceRef.current = es

    return () => {
      es.close()
    }
  }, [token])

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
      const response = await fetch(`${API_BASE}/ai/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: userMsg.content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.info || '发送失败')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      console.error('Chat error:', error)
      toast.error(message || '发送失败')
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: msg.content + '\n[错误: 发送失败]', pending: false }
            : msg
        )
      )
      setIsStreaming(false)
    }
  }

  const handleStop = () => {
    setIsStreaming(false)
    setMessages((prev) =>
      prev.map((msg) => (msg.pending ? { ...msg, pending: false } : msg))
    )
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
                <span className="font-semibold text-sm">AI Assistant</span>
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
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-2">
                  <MessageCircle className="h-8 w-8 opacity-50" />
                  <p>Start a conversation...</p>
                </div>
              )}
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
                  placeholder="Type a message..."
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
