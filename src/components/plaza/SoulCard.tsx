import { Card, Button, Badge } from '../ui'
import { Heart, HandHeart, MessageCircleHeart, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { type SoulCard as SoulCardType, resonate } from '../../lib'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { cn } from '../../utils'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface SoulCardProps {
    card: SoulCardType
    isOwn?: boolean
    onEdit?: (card: SoulCardType) => void
    onDelete?: (card: SoulCardType) => void
}

const isRichText = (text: string) => /<\/?[a-z][\s\S]*>/i.test(text)

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

// 内容展开/收起动画配置
const contentVariants = {
    collapsed: {
        height: 168,
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 30,
        }
    },
    expanded: {
        height: 'auto',
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 30,
        }
    }
}

// 按钮脉动动画
const pulseVariants = {
    pulse: {
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut' as const
        }
    }
}

export const SoulCard = ({ card, isOwn, onEdit, onDelete }: SoulCardProps) => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { t } = useTranslation()
    const [count, setCount] = useState(card.resonanceCount)
    const [resonated, setResonated] = useState(card.isResonated || false)
    const [loading, setLoading] = useState(false)
    const [showOptions, setShowOptions] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isOverflowing, setIsOverflowing] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)
    const isOwner = Boolean(isOwn || (user && card.userId === user.userId))
    const isLoggedIn = Boolean(user)

    // 检测内容是否超出限制高度
    useEffect(() => {
        if (contentRef.current) {
            const contentHeight = contentRef.current.scrollHeight
            // 6行文本大约高度为 168px (line-height: 1.75rem = 28px * 6)
            setIsOverflowing(contentHeight > 168)
        }
    }, [card.content])

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
            toast.success(t('soulCard.resonate'))
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
    const emotionLabel = t(`plaza.emotion.${card.emotion}`, { defaultValue: card.emotion })

    return (
        <Card className="glass-card overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 border-white/20 dark:border-white/5 group h-full">
            <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <Badge className={cn("text-xs font-medium px-2.5 py-1 border", emotionColor)}>
                        {emotionLabel}
                    </Badge>
                    {isOwn ? (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
                                onClick={() => onEdit?.(card)}
                                title={t('soulCard.edit')}
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => onDelete?.(card)}
                                title={t('soulCard.delete')}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground/50 font-mono">
                            {new Date(card.createdAt).toLocaleDateString()}
                        </span>
                    )}
                </div>

                {/* 内容区域 - 带展开/收起功能 */}
                <div className="relative">
                    <motion.div
                        variants={contentVariants}
                        initial="collapsed"
                        animate={isExpanded ? 'expanded' : 'collapsed'}
                        className="overflow-hidden"
                    >
                        <div ref={contentRef}>
                            {isRichText(card.content) ? (
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-7"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(card.content) }}
                                />
                            ) : (
                                <div className="text-sm leading-7 whitespace-pre-wrap font-sans text-foreground/90">
                                    {card.content}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* 渐变遮罩 - 仅在收起且内容溢出时显示 */}
                    <AnimatePresence>
                        {!isExpanded && isOverflowing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card via-card/90 to-transparent pointer-events-none"
                            />
                        )}
                    </AnimatePresence>

                    {/* 展开/收起按钮 */}
                    <AnimatePresence>
                        {isOverflowing && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className={cn(
                                    "flex justify-center",
                                    isExpanded ? "mt-4" : "absolute bottom-0 left-0 right-0 z-10"
                                )}
                            >
                                <motion.button
                                    variants={!isExpanded ? pulseVariants : undefined}
                                    animate={!isExpanded ? 'pulse' : undefined}
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium",
                                        "bg-primary/10 text-primary hover:bg-primary/20",
                                        "dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30",
                                        "backdrop-blur-sm border border-primary/20",
                                        "transition-colors duration-200 shadow-sm hover:shadow-md",
                                        !isExpanded && "shadow-primary/20"
                                    )}
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp className="w-3.5 h-3.5" />
                                            <span>{t('soulCard.collapse', '收起')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-3.5 h-3.5" />
                                            <span>{t('soulCard.expand', '展开更多')}</span>
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dashed border-border/50">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/50 text-secondary-foreground text-[10px] font-medium">
                            {card.type === 'DIARY' ? t('soulCard.diary') : t('soulCard.note')}
                        </span>
                        {isOwn && (
                            <span className="text-[10px] opacity-60">{new Date(card.createdAt).toLocaleDateString()}</span>
                        )}
                    </div>

                    <div className="relative">
                        {!resonated && showOptions && !isOwner && (
                            <div className="absolute bottom-full right-0 mb-3 flex gap-2 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-full p-1.5 z-10 animate-in fade-in slide-in-from-bottom-2 zoom-in-95">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-red-500 bg-red-100/80 hover:bg-red-200/80 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40 transition-colors"
                                    onClick={() => handleResonate('EMPATHY')}
                                    disabled={loading || isOwner}
                                    title={t('soulCard.empathy')}
                                >
                                    <Heart className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-orange-500 bg-orange-100/80 hover:bg-orange-200/80 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-800/40 transition-colors"
                                    onClick={() => handleResonate('HUG')}
                                    disabled={loading || isOwner}
                                    title={t('soulCard.hug')}
                                >
                                    <HandHeart className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-blue-500 bg-blue-100/80 hover:bg-blue-200/80 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/40 transition-colors"
                                    onClick={() => handleResonate('SAME_HERE')}
                                    disabled={loading || isOwner}
                                    title={t('soulCard.sameHere')}
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
                            <span className="font-medium">{count > 0 ? count : t('soulCard.resonate')}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}
