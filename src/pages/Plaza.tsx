import { Layout } from '../components/Layout'
import { SoulCard } from '../components/plaza/SoulCard'
import { getFeed, type SoulCard as SoulCardType } from '../lib'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '../components/ui'

export const Plaza = () => {
    const [cards, setCards] = useState<SoulCardType[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const loadFeed = async (p: number) => {
        setLoading(true)
        try {
            const res = await getFeed(p)
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
        loadFeed(1)
    }, [])

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        loadFeed(nextPage)
    }

    return (
        <Layout>
            <div className="space-y-6 container mx-auto max-w-5xl">
                <div className="text-center space-y-4 py-8">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 font-display">
                        Soul Plaza
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        在这里，遇见共鸣的灵魂。匿名分享，温暖相拥。
                    </p>
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

                {!loading && hasMore && (
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
                        广场还很空旷，去发布第一个瞬间吧。
                    </div>
                )}
            </div>
        </Layout>
    )
}
