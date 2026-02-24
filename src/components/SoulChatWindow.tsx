import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, User, Check, CheckCheck } from 'lucide-react'
import { Button, Input } from './ui'
import { soulChatApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { cn } from '../utils'
import { toast } from 'sonner'

interface Message {
  id: number
  senderId: string
  content: string
  createTime: string
  isRead: boolean
}

interface SoulChatWindowProps {
  isOpen: boolean
  onClose: () => void
  matchId: number | null
  partnerName?: string // Optional: anonymous name or similar
}

export const SoulChatWindow = ({ isOpen, onClose, matchId, partnerName = '灵魂伙伴' }: SoulChatWindowProps) => {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 离线草稿加载
  useEffect(() => {
    if (user?.userId && matchId) {
      try {
        const saved = localStorage.getItem(`soul_chat_draft_${user.userId}_${matchId}`)
        if (saved) {
          setInput(saved)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [user?.userId, matchId])

  // 离线草稿保存
  useEffect(() => {
    if (user?.userId && matchId) {
      if (input) {
        localStorage.setItem(`soul_chat_draft_${user.userId}_${matchId}`, input)
      } else {
        localStorage.removeItem(`soul_chat_draft_${user.userId}_${matchId}`)
      }
    }
  }, [input, user?.userId, matchId])

  const fetchHistory = useCallback(async () => {
    if (!matchId) return
    try {
      const res = await soulChatApi.getHistory(matchId)
      setMessages(res.data.data)
      // Mark as read when opening/updating
      await soulChatApi.markAsRead(matchId)
    } catch (e) {
      console.error(e)
    }
  }, [matchId])

  useEffect(() => {
    if (isOpen && matchId) {
      fetchHistory()
      scrollToBottom()

      // Start polling every 3 seconds
      pollIntervalRef.current = setInterval(fetchHistory, 3000)
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      setMessages([])
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [isOpen, matchId, fetchHistory])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !matchId) return

    const tempId = Date.now()
    const tempMsg: Message = {
      id: tempId,
      senderId: user?.userId || '',
      content: input,
      createTime: new Date().toISOString(),
      isRead: false
    }

    // Optimistic update
    setMessages(prev => [...prev, tempMsg])
    setInput('')
    setLoading(true)

    try {
      await soulChatApi.sendMessage({ matchId, content: tempMsg.content })
      fetchHistory() // Refresh to get real ID and status
    } catch (e) {
      console.error(e)
      toast.error('发送失败')
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-border/50"
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {partnerName[0]}
              </div>
              <div>
                <h3 className="font-semibold">{partnerName}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  在线
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50">
                <User className="w-12 h-12" />
                <p>开始你们的第一次对话吧...</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.userId
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex w-full",
                      isMe ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm relative group",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-white dark:bg-slate-800 border rounded-bl-sm"
                      )}
                    >
                      <p>{msg.content}</p>
                      <div className={cn(
                        "text-[10px] mt-1 flex items-center gap-1 opacity-70",
                        isMe ? "text-primary-foreground/80 justify-end" : "text-muted-foreground"
                      )}>
                        {new Date(msg.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          msg.isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="输入消息..."
                className="flex-1"
                disabled={loading}
              />
              <Button onClick={handleSend} disabled={!input.trim() || loading} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
