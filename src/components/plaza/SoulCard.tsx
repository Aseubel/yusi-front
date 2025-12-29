import { Card, Button, Badge } from '../ui'
import { Heart } from 'lucide-react'
import { type SoulCard as SoulCardType, resonate } from '../../lib'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '../../utils'

interface SoulCardProps {
    card: SoulCardType
}

export const SoulCard = ({ card }: SoulCardProps) => {
    const [count, setCount] = useState(card.resonanceCount)
    const [resonated, setResonated] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleResonate = async () => {
        if (resonated) return
        setLoading(true)
        try {
            await resonate(card.id, 'EMPATHY')
            setCount(prev => prev + 1)
            setResonated(true)
            toast.success('已共鸣')
        } catch (e: any) {
            if (e.message?.includes('共鸣')) {
                setResonated(true) // assume already resonated
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
                            {card.emotion && <span className="bg-primary/5 px-1.5 py-0.5 rounded text-primary/70">#{card.emotion}</span>}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-7 px-2 text-xs gap-1 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30", resonated && "text-red-500")}
                            onClick={handleResonate}
                            disabled={resonated || loading}
                        >
                            <Heart className={cn("w-3.5 h-3.5", resonated && "fill-current")} />
                            {count > 0 && count}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
