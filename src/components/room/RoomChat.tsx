import { useState, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { Users, Send, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button, Input } from '../ui'
import { sendRoomMessage, pollRoomMessages, type RoomMessage } from '../../lib'
import { toast } from 'sonner'
import { cn } from '../../utils'

interface RoomChatProps {
    roomCode: string
    roomStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    memberNames?: Record<string, string>
}

// 根据用户ID生成一个稳定的颜色
const getUserColor = (userId: string) => {
    const colors = [
        'bg-rose-500',
        'bg-orange-500',
        'bg-amber-500',
        'bg-emerald-500',
        'bg-teal-500',
        'bg-cyan-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-purple-500',
        'bg-fuchsia-500',
        'bg-pink-500',
    ]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
}

// 获取用户名首字母作为头像
const getInitials = (name: string) => {
    if (!name) return '?'
    // 如果是中文名，取第一个字
    if (/[\u4e00-\u9fa5]/.test(name)) {
        return name.charAt(0)
    }
    // 英文名取首字母
    return name.charAt(0).toUpperCase()
}

export const RoomChat = ({ roomCode, roomStatus, memberNames = {} }: RoomChatProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<RoomMessage[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const lastMessageTimeRef = useRef<string | null>(null)
    const currentUserId = localStorage.getItem('yusi-user-id') || ''

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // 离线草稿：加载
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`room_chat_draft_${roomCode}_${currentUserId}`)
            if (saved) {
                setInput(saved)
            }
        } catch (e) {
            console.error('Failed to load room chat draft', e)
        }
    }, [roomCode, currentUserId])

    // 离线草稿：保存
    useEffect(() => {
        if (input) {
            localStorage.setItem(`room_chat_draft_${roomCode}_${currentUserId}`, input)
        } else {
            localStorage.removeItem(`room_chat_draft_${roomCode}_${currentUserId}`)
        }
    }, [input, roomCode, currentUserId])

    const stompClientRef = useRef<Client | null>(null)
    const isOpenRef = useRef(isOpen)

    useEffect(() => {
        isOpenRef.current = isOpen
    }, [isOpen])

    // WebSocket 连接
    useEffect(() => {
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws-chat`

        // 创建 STOMP 客户端
        const client = new Client({
            brokerURL: wsUrl,
            connectionTimeout: 10000,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('WebSocket connected to room:', roomCode)
                // 订阅房间消息
                client.subscribe(`/topic/room/${roomCode}`, (message) => {
                    const roomMsg: RoomMessage = JSON.parse(message.body)
                    setMessages(prev => {
                        // 避免重复
                        if (prev.some(m => m.id === roomMsg.id)) return prev

                        lastMessageTimeRef.current = roomMsg.createdAt

                        return [...prev, roomMsg]
                    })
                    // 单独处理未读计数，需要 ref
                    if (!isOpenRef.current) {
                        setUnreadCount(prevCount => prevCount + 1)
                    }
                })
            },
            onDisconnect: () => {
                console.log('WebSocket disconnected from room:', roomCode)
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message'])
                console.error('Additional details: ' + frame.body)
            },
            onWebSocketError: (event) => {
                console.error('WebSocket error:', event)
            }
        })

        // 激活客户端
        client.activate()
        stompClientRef.current = client

        // 初始加载历史消息 (HTTP)
        const loadHistory = async () => {
            try {
                // 使用 poll 接口首次拉取历史 (或者专门的 history 接口)
                // 这里复用 pollRoomMessages 传 undefined 获取最近消息
                const history = await pollRoomMessages(roomCode)
                if (history.length > 0) {
                    setMessages(history)
                    lastMessageTimeRef.current = history[history.length - 1].createdAt
                }
            } catch (e) {
                console.error('Failed to load history:', e)
            }
        }
        loadHistory()

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate()
            }
        }
    }, [roomCode])

    // 监听 isOpen 变化清空未读
    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
            setUnreadCount(0)
        }
    }, [isOpen, messages.length])

    // 发送消息
    const handleSend = async () => {
        if (!input.trim() || sending) return

        setSending(true)
        try {
            await sendRoomMessage(roomCode, input.trim())
            // 不在本地添加消息，依赖 WebSocket 广播来更新
            // 这样可以避免重复，且所有客户端行为一致
            setInput('')
        } catch {
            toast.error('发送失败')
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const canSend = roomStatus === 'WAITING' || roomStatus === 'IN_PROGRESS'

    // 格式化时间
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    // 判断是否需要显示时间分隔符（超过5分钟）
    const shouldShowTimeDivider = (currentMsg: RoomMessage, prevMsg?: RoomMessage) => {
        if (!prevMsg) return true
        const current = new Date(currentMsg.createdAt).getTime()
        const prev = new Date(prevMsg.createdAt).getTime()
        return current - prev > 5 * 60 * 1000 // 5分钟
    }

    // 判断是否是连续消息（同一用户连续发送）
    const isContinuousMessage = (currentMsg: RoomMessage, prevMsg?: RoomMessage) => {
        if (!prevMsg) return false
        if (currentMsg.senderId !== prevMsg.senderId) return false
        const current = new Date(currentMsg.createdAt).getTime()
        const prev = new Date(prevMsg.createdAt).getTime()
        return current - prev < 60 * 1000 // 1分钟内
    }

    return (
        <>
            {/* 侧边栏切换按钮 - 固定在屏幕右侧 */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed top-1/2 -translate-y-1/2 right-0 z-40",
                    "w-8 h-24 rounded-l-lg",
                    "bg-secondary/90 backdrop-blur border border-r-0 border-border",
                    "flex flex-col items-center justify-center gap-1",
                    "hover:bg-secondary transition-colors",
                    "shadow-lg"
                )}
            >
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground writing-mode-vertical">聊天</span>
                {unreadCount > 0 && (
                    <span className="absolute -left-1 top-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                <ChevronLeft className="w-3 h-3 text-muted-foreground" />
            </button>

            {/* 侧边抽屉 */}
            <div className={cn(
                "fixed top-0 right-0 z-150 h-full",
                "w-80 md:w-[480px]",
                "bg-background border-l border-border shadow-2xl",
                "flex flex-col",
                "transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* 头部 */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="font-semibold">房间讨论</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {messages.length}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-muted rounded-md transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* 消息列表 - Discord/Slack 风格 */}
                <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                            <Users className="w-16 h-16 mb-3 opacity-20" />
                            <p className="text-sm">开始和房间成员聊天吧</p>
                            <p className="text-xs mt-1 opacity-70">在游戏开始前互相认识一下？</p>
                        </div>
                    )}

                    <div className="px-3 py-2">
                        {messages.map((msg, index) => {
                            const isMe = msg.senderId === currentUserId
                            const prevMsg = index > 0 ? messages[index - 1] : undefined
                            const showDivider = shouldShowTimeDivider(msg, prevMsg)
                            const isContinuous = !showDivider && isContinuousMessage(msg, prevMsg)
                            const displayName = memberNames[msg.senderId] || msg.senderName || '成员'

                            return (
                                <div key={msg.id}>
                                    {/* 时间分隔符 */}
                                    {showDivider && (
                                        <div className="flex items-center justify-center my-3">
                                            <div className="h-px flex-1 bg-border" />
                                            <span className="px-3 text-[10px] text-muted-foreground">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                            <div className="h-px flex-1 bg-border" />
                                        </div>
                                    )}

                                    {/* 消息项 - 列表式布局 */}
                                    <div className={cn(
                                        "group flex items-start gap-2 py-1 px-2 -mx-2 rounded-md",
                                        "hover:bg-muted/50 transition-colors",
                                        isContinuous ? "pt-0" : "pt-2"
                                    )}>
                                        {/* 头像或占位 */}
                                        {isContinuous ? (
                                            <div className="w-8 shrink-0" />
                                        ) : (
                                            <div className={cn(
                                                "w-8 h-8 rounded-md shrink-0",
                                                "flex items-center justify-center",
                                                "text-white text-sm font-medium",
                                                getUserColor(msg.senderId)
                                            )}>
                                                {getInitials(displayName)}
                                            </div>
                                        )}

                                        {/* 消息内容 */}
                                        <div className="flex-1 min-w-0">
                                            {!isContinuous && (
                                                <div className="flex items-baseline gap-2">
                                                    <span className={cn(
                                                        "text-sm font-medium truncate",
                                                        isMe ? "text-primary" : "text-foreground"
                                                    )}>
                                                        {isMe ? '我' : displayName}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                            <p className="text-sm text-foreground/90 wrap-break-word whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* 输入框 - 增加 pb-safe 适配移动端底部安全区 */}
                <div className="border-t p-3 bg-muted/20 pb-safe md:pb-3">
                    {canSend ? (
                        <div className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="发送消息..."
                                className="flex-1 bg-background"
                                maxLength={500}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || sending}
                                size="icon"
                                className="shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground text-sm py-2 bg-muted/30 rounded-md">
                            {roomStatus === 'COMPLETED' ? '游戏已结束' : '房间已解散'}
                        </div>
                    )}
                </div>
            </div>

            {/* 遮罩层 - 移动端 */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}
