import { Card, Button, Badge } from '../ui'
import { Heart, HandHeart, MessageCircleHeart, Pencil, Trash2 } from 'lucide-react'
import { type SoulCard as SoulCardType, resonate } from '../../lib'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '../../utils'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

interface SoulCardProps {
    card: SoulCardType
    isOwn?: boolean
    onEdit?: (card: SoulCardType) => void
    onDelete?: (card: SoulCardType) => void
}

// 情感标签映射：后端英文值 -> 中文显示
const EMOTION_LABELS: Record<string, string> = {
    'Joy': '喜悦',
    'Sadness': '悲伤',
    'Anxiety': '焦虑',
    'Love': '温暖',
    'Anger': '愤怒',
    'Fear': '恐惧',
    'Hope': '希望',
    'Calm': '平静',
    'Confusion': '困惑',
    'Neutral': '随想',
}

// 情感标签颜色
const EMOTION_COLORS: Record<string, string> = {
    'Joy': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Sadness': 'bg-blue-100 text-blue-700 border-blue-200',
    'Anxiety': 'bg-orange-100 text-orange-700 border-orange-200',
    'Love': 'bg-pink-100 text-pink-700 border-pink-200',
    'Anger': 'bg-red-100 text-red-700 border-red-200',
    'Fear': 'bg-purple-100 text-purple-700 border-purple-200',
    'Hope': 'bg-green-100 text-green-700 border-green-200',
    'Calm': 'bg-teal-100 text-teal-700 border-teal-200',
    'Confusion': 'bg-gray-100 text-gray-700 border-gray-200',
    'Neutral': 'bg-slate-100 text-slate-700 border-slate-200',
}

export const SoulCard = ({ card, isOwn, onEdit, onDelete }: SoulCardProps) => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [count, setCount] = useState(card.resonanceCount)
    const [resonated, setResonated] = useState(card.isResonated || false)
    const [loading, setLoading] = useState(false)
    const [showOptions, setShowOptions] = useState(false)
    const isOwner = Boolean(isOwn || (user && card.userId === user.userId))
    const isLoggedIn = Boolean(user)

    const handleResonate = async (type: 'EMPATHY' | 'HUG' | 'SAME_HERE') => {
        if (!isLoggedIn) {
            navigate('/login', { state: { from: window.location.pathname } })
            return
        }
        if (resonated || isOwner) return
        setLoading(true)
        try {
            await resonate(card.id, type)
            setCount(prev => prev + 1)
            setResonated(true)
            setShowOptions(false)
            toast.success('已共鸣')
        } catch (e: unknown) {
            if (e instanceof Error && e.message?.includes('共鸣')) {
                setResonated(true)
                setShowOptions(false)
            }
        } finally {
            setLoading(false)
        }
    }

    const emotionColor = EMOTION_COLORS[card.emotion] || 'bg-primary/10 text-primary border-primary/20'

    return (
        <Card className="glass-card overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 border-white/20 dark:border-white/5 group h-full">
            <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        {/* 左上角：情绪标签 */}
                        <Badge className={cn("text-xs font-medium px-2.5 py-1 border", emotionColor)}>
                            {EMOTION_LABELS[card.emotion] || card.emotion}
                        </Badge>
                        {/* 右上角：日期或编辑删除按钮 */}
                        {isOwn ? (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
                                    onClick={() => onEdit?.(card)}
                                    title="编辑"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => onDelete?.(card)}
                                    title="删除"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <span className="text-[10px] text-muted-foreground font-medium opacity-60">{new Date(card.createdAt).toLocaleDateString()}</span>
                        )}
                    </div>

                    <div className="text-sm leading-7 whitespace-pre-wrap font-sans text-foreground/90 min-h-[80px]">
                        {card.content.length > 150 ? card.content.substring(0, 150) + '...' : card.content}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-dashed border-border/50">
                        {/* 左下角：类型标签 + 日期 */}
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/50 text-secondary-foreground text-[10px] font-medium">
                                {card.type === 'DIARY' ? '日记' : '随笔'}
                            </span>
                            {isOwn && (
                                <span className="text-[10px] opacity-60">{new Date(card.createdAt).toLocaleDateString()}</span>
                            )}
                        </div>

                        {/* 右下角：共鸣按钮 */}
                        <div className="relative">
                            {!resonated && showOptions && !isOwner && (
                                <div className="absolute bottom-full right-0 mb-3 flex gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 shadow-xl rounded-full p-1.5 z-10 animate-in fade-in slide-in-from-bottom-2 zoom-in-95">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-full text-red-500 bg-red-50/90 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                                        onClick={() => handleResonate('EMPATHY')}
                                        disabled={loading || isOwner}
                                        title="共情"
                                    >
                                        <Heart className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-full text-orange-500 bg-orange-50/90 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-900/40 transition-colors"
                                        onClick={() => handleResonate('HUG')}
                                        disabled={loading || isOwner}
                                        title="拥抱"
                                    >
                                        <HandHeart className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-full text-blue-500 bg-blue-50/90 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
                                        onClick={() => handleResonate('SAME_HERE')}
                                        disabled={loading || isOwner}
                                        title="同感"
                                    >
                                        <MessageCircleHeart className="w-5 h-5" />
                                    </Button>
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 px-3 text-xs gap-1.5 rounded-full transition-all duration-300",
                                    resonated
                                        ? "text-red-500 bg-red-50 dark:bg-red-950/20"
                                        : isOwner
                                            ? "text-muted-foreground bg-muted/40"
                                            : isLoggedIn
                                                ? "hover:bg-primary/5 hover:text-primary"
                                                : "text-muted-foreground/50 cursor-not-allowed"
                                )}
                                onClick={() => {
                                    if (!isLoggedIn) {
                                        navigate('/login', { state: { from: window.location.pathname } })
                                        return
                                    }
                                    if (resonated || isOwner) return
                                    setShowOptions(!showOptions)
                                }}
                                disabled={resonated || isOwner || loading || !isLoggedIn}
                            >
                                <Heart className={cn("w-4 h-4 transition-transform", resonated && "fill-current scale-110")} />
                                <span className="font-medium">{count > 0 ? count : '共鸣'}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
    )
}

