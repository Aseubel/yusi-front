import { Card, Button, Badge } from '../ui'
import { Heart, HandHeart, MessageCircleHeart } from 'lucide-react'
import { type SoulCard as SoulCardType, resonate } from '../../lib'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '../../utils'

interface SoulCardProps {
    card: SoulCardType
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

export const SoulCard = ({ card }: SoulCardProps) => {
    const [count, setCount] = useState(card.resonanceCount)
    const [resonated, setResonated] = useState(card.isResonated || false)
    const [loading, setLoading] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    const handleResonate = async (type: 'EMPATHY' | 'HUG' | 'SAME_HERE') => {
        if (resonated) return
        setLoading(true)
        try {
            await resonate(card.id, type)
            setCount(prev => prev + 1)
            setResonated(true)
            setShowOptions(false)
            toast.success('已共鸣')
        } catch (e: unknown) {
            if (e instanceof Error && e.message?.includes('共鸣')) {
                setResonated(true) // assume already resonated
                setShowOptions(false)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="break-inside-avoid mb-4">
            <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-primary/10 bg-gradient-to-br from-card to-secondary/30">
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs font-normal opacity-70">
                            {card.type === 'DIARY' ? '日记' : '情景'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{new Date(card.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif text-foreground/90 min-h-[80px]">
                        {card.content.length > 150 ? card.content.substring(0, 150) + '...' : card.content}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-muted-foreground italic flex items-center gap-1">
                            {card.emotion && <span className="bg-primary/5 px-1.5 py-0.5 rounded text-primary/70">#{EMOTION_LABELS[card.emotion] || card.emotion}</span>}
                        </div>

                        <div className="relative">
                            {!resonated && showOptions && (
                                <div className="absolute bottom-full right-0 mb-2 flex gap-1 bg-background border shadow-lg rounded-full p-1 z-10 animate-in fade-in slide-in-from-bottom-2">
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-500"
                                        onClick={() => handleResonate('EMPATHY')} disabled={loading} title="共情"
                                    >
                                        <Heart className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-orange-100 hover:text-orange-500"
                                        onClick={() => handleResonate('HUG')} disabled={loading} title="拥抱"
                                    >
                                        <HandHeart className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-500"
                                        onClick={() => handleResonate('SAME_HERE')} disabled={loading} title="同感"
                                    >
                                        <MessageCircleHeart className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("h-7 px-2 text-xs gap-1 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30", resonated && "text-red-500")}
                                onClick={() => !resonated && setShowOptions(!showOptions)}
                                disabled={resonated && !loading}
                            >
                                <Heart className={cn("w-3.5 h-3.5", resonated && "fill-current")} />
                                {count > 0 && count}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
