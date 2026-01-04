import { Layout } from '../components/Layout'
import { SoulCard } from '../components/plaza/SoulCard'
import { getFeed, submitToPlaza, type SoulCard as SoulCardType } from '../lib'
import { useState, useEffect } from 'react'
import { Loader2, PenLine, X } from 'lucide-react'
import { Button, Textarea } from '../components/ui'
import { toast } from 'sonner'
import { cn } from '../utils'

const EMOTIONS = ['All', 'Joy', 'Sadness', 'Anger', 'Fear', 'Surprise', 'Neutral']

export const Plaza = () => {
    const [cards, setCards] = useState<SoulCardType[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [selectedEmotion, setSelectedEmotion] = useState('All')
    
    // Post Modal State
    const [isPostOpen, setIsPostOpen] = useState(false)
    const [postContent, setPostContent] = useState('')
    const [posting, setPosting] = useState(false)

    const loadFeed = async (p: number, emotion: string) => {
        setLoading(true)
        try {
            const res = await getFeed(p, emotion)
            if (p === 1) {
                setCards(res.content)
            } else {
                setCards(prev => [...prev, ...res.content])
            }
            setHasMore(!res.last)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFeed(1, selectedEmotion)
    }, [selectedEmotion])

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        loadFeed(nextPage, selectedEmotion)
    }

    const handleEmotionSelect = (emotion: string) => {
        if (selectedEmotion === emotion) return
        setSelectedEmotion(emotion)
        setPage(1)
        setCards([]) // Clear to avoid confusion
        // loadFeed called by useEffect
    }

    const handlePost = async () => {
        if (!postContent.trim() || postContent.length < 5) {
            toast.error('内容太短啦，多写一点吧')
            return
        }
        setPosting(true)
        try {
            await submitToPlaza(postContent, 'direct-post', 'DIARY')
            toast.success('发送成功')
            setIsPostOpen(false)
            setPostContent('')
            // Refresh feed
            setPage(1)
            loadFeed(1, selectedEmotion)
        } catch (e) {
            toast.error('发送失败，请稍后重试')
            console.log(e)
        } finally {
            setPosting(false)
        }
    }

    return (
        <Layout>
            <div className="space-y-6 container mx-auto max-w-5xl relative min-h-screen pb-20">
                <div className="text-center space-y-4 py-8">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 font-display">
                        Soul Plaza
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        在这里，遇见共鸣的灵魂。匿名分享，温暖相拥。
                    </p>
                </div>

                {/* Emotion Filter */}
                <div className="flex justify-center gap-2 flex-wrap pb-4">
                    {EMOTIONS.map(emo => (
                        <button
                            key={emo}
                            onClick={() => handleEmotionSelect(emo)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm transition-all border",
                                selectedEmotion === emo 
                                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                                    : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                            )}
                        >
                            {emo === 'All' ? '全部' : emo}
                        </button>
                    ))}
                </div>

                {/* Masonry-like Grid */}
                <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                    {cards.map(card => (
                        <SoulCard key={card.id} card={card} />
                    ))}
                </div>

                {loading && (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!loading && hasMore && cards.length > 0 && (
                    <div className="flex justify-center py-8">
                        <Button variant="outline" onClick={handleLoadMore}>
                            加载更多
                        </Button>
                    </div>
                )}

                {!loading && !hasMore && cards.length > 0 && (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                        已经到底啦 ~
                    </div>
                )}

                {!loading && cards.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                        {selectedEmotion === 'All' ? '广场还很空旷，去发布第一个瞬间吧。' : '这个情绪下还没有内容哦。'}
                    </div>
                )}

                {/* FAB */}
                <div className="fixed bottom-8 right-8 z-50">
                    <Button 
                        size="icon" 
                        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                        onClick={() => setIsPostOpen(true)}
                    >
                        <PenLine className="w-6 h-6" />
                    </Button>
                </div>

                {/* Post Modal Overlay */}
                {isPostOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-lg bg-background rounded-xl shadow-2xl border animate-in zoom-in-95 duration-200 p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">投递心声</h3>
                                <Button variant="ghost" size="icon" onClick={() => setIsPostOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Textarea 
                                    placeholder="写下此刻的想法，匿名投递到广场..." 
                                    className="min-h-[150px] resize-none text-base"
                                    value={postContent}
                                    onChange={e => setPostContent(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {postContent.length}/500
                                </p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setIsPostOpen(false)}>取消</Button>
                                <Button 
                                    onClick={handlePost} 
                                    isLoading={posting}
                                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                >
                                    投递
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}
