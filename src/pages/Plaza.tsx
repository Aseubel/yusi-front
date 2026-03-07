import { SoulCard } from '../components/plaza/SoulCard'
import { getFeed, getMyCards, submitToPlaza, updateCard, deleteCard, type SoulCard as SoulCardType, useRequireAuth } from '../lib'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Loader2, PenLine, X, Sparkles, User, Globe } from 'lucide-react'
import { Button, Textarea, ConfirmDialog } from '../components/ui'
import { toast } from 'sonner'
import { cn } from '../utils'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const getEmotionMap = (t: (key: string) => string): Record<string, string> => ({
    'All': t('plaza.emotion.All'),
    'Joy': t('plaza.emotion.Joy'),
    'Sadness': t('plaza.emotion.Sadness'),
    'Anxiety': t('plaza.emotion.Anxiety'),
    'Love': t('plaza.emotion.Love'),
    'Anger': t('plaza.emotion.Anger'),
    'Fear': t('plaza.emotion.Fear'),
    'Hope': t('plaza.emotion.Hope'),
    'Calm': t('plaza.emotion.Calm'),
    'Confusion': t('plaza.emotion.Confusion'),
    'Neutral': t('plaza.emotion.Neutral'),
})

const EMOTIONS = ['All', 'Joy', 'Sadness', 'Anxiety', 'Love', 'Anger', 'Fear', 'Hope', 'Calm', 'Confusion', 'Neutral']

type TabType = 'feed' | 'my'

export const Plaza = () => {
    const { t } = useTranslation()
    const [cards, setCards] = useState<SoulCardType[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [selectedEmotion, setSelectedEmotion] = useState('All')
    const [activeTab, setActiveTab] = useState<TabType>('feed')

    const emotionMap = useMemo(() => getEmotionMap(t), [t])

    // Post/Edit Modal State
    const [isPostOpen, setIsPostOpen] = useState(false)
    const [postContent, setPostContent] = useState('')
    const [posting, setPosting] = useState(false)
    const [editingCard, setEditingCard] = useState<SoulCardType | null>(null)
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        card: SoulCardType | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        card: null,
        isLoading: false,
    })
    const { requireAuth, isLoggedIn } = useRequireAuth()

    // 用于处理竞态条件的请求ID
    const requestIdRef = useRef(0)

    const loadFeed = useCallback(async (p: number, emotion: string) => {
        const currentRequestId = ++requestIdRef.current
        setLoading(true)
        try {
            const res = await getFeed(p, emotion)
            // 检查是否是最新请求
            if (currentRequestId !== requestIdRef.current) {
                return
            }
            if (p === 1) {
                setCards(res.content)
            } else {
                setCards(prev => [...prev, ...res.content])
            }
            setHasMore(!res.last)
        } catch (e) {
            console.error(e)
        } finally {
            if (currentRequestId === requestIdRef.current) {
                setLoading(false)
            }
        }
    }, [])

    const loadMyCards = useCallback(async (p: number) => {
        const currentRequestId = ++requestIdRef.current
        setLoading(true)
        try {
            const res = await getMyCards(p)
            // 检查是否是最新请求
            if (currentRequestId !== requestIdRef.current) {
                return
            }
            if (p === 1) {
                setCards(res.content)
            } else {
                setCards(prev => [...prev, ...res.content])
            }
            setHasMore(!res.last)
        } catch (e) {
            console.error(e)
        } finally {
            if (currentRequestId === requestIdRef.current) {
                setLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        setPage(1)
        setCards([])
        if (activeTab === 'feed') {
            loadFeed(1, selectedEmotion)
        } else {
            if (isLoggedIn) {
                loadMyCards(1)
            }
        }
    }, [selectedEmotion, activeTab, isLoggedIn, loadFeed, loadMyCards])

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        if (activeTab === 'feed') {
            loadFeed(nextPage, selectedEmotion)
        } else {
            loadMyCards(nextPage)
        }
    }

    const handleEmotionSelect = (emotion: string) => {
        if (selectedEmotion === emotion) return
        setSelectedEmotion(emotion)
        setPage(1)
        setCards([])
    }

    const handleTabChange = (tab: TabType) => {
        if (tab === 'my' && !requireAuth(t('plaza.auth.myCards'))) {
            return
        }
        setActiveTab(tab)
    }

    const handlePost = async () => {
        if (!requireAuth(t('common.login'))) {
            setIsPostOpen(false)
            return
        }
        if (!postContent.trim() || postContent.length < 5) {
            toast.error(t('plaza.post.contentTooShort'))
            return
        }
        setPosting(true)
        try {
            if (editingCard) {
                await updateCard(editingCard.id, postContent)
                toast.success(t('plaza.post.editSuccess'))
            } else {
                await submitToPlaza(postContent, 'direct-post', 'SITUATION')
                toast.success(t('plaza.post.success'))
            }
            setIsPostOpen(false)
            setPostContent('')
            setEditingCard(null)
            // Refresh - 重置请求ID确保新请求生效
            requestIdRef.current = 0
            setPage(1)
            if (activeTab === 'feed') {
                loadFeed(1, selectedEmotion)
            } else {
                loadMyCards(1)
            }
        } catch (e) {
            // toast.error(editingCard ? '修改失败，请稍后重试' : '发送失败，请稍后重试')
            console.log(e)
        } finally {
            setPosting(false)
        }
    }

    const handleEditCard = (card: SoulCardType) => {
        setEditingCard(card)
        setPostContent(card.content)
        setIsPostOpen(true)
    }

    const handleDeleteCard = async (card: SoulCardType) => {
        setConfirmDialog({ isOpen: true, card, isLoading: false })
    }

    const confirmDelete = async () => {
        if (!confirmDialog.card) return
        setConfirmDialog(prev => ({ ...prev, isLoading: true }))
        try {
            await deleteCard(confirmDialog.card.id)
            toast.success(t('plaza.delete.success'))
            setCards(prev => prev.filter(c => c.id !== confirmDialog.card!.id))
        } catch (e) {
            toast.error(t('plaza.delete.failed'))
            console.log(e)
        } finally {
            setConfirmDialog({ isOpen: false, card: null, isLoading: false })
        }
    }

    const closeModal = () => {
        setIsPostOpen(false)
        setPostContent('')
        setEditingCard(null)
    }

    return (
        <div className="min-h-screen relative">
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />

            <div className="space-y-8 container mx-auto max-w-6xl relative pb-20 px-4 pt-12">
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 text-xs font-medium text-muted-foreground mb-2"
                    >
                        <Sparkles className="w-3 h-3" />
                        <span>{t('plaza.title')} · {t('plaza.subtitle')}</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-4xl md:text-6xl font-bold text-gradient font-display"
                    >
                        {t('plaza.title')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-muted-foreground text-lg max-w-xl mx-auto"
                    >
                        {t('plaza.description')}
                    </motion.p>
                </div>

                {/* Tab Switcher */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="flex justify-center gap-2"
                >
                    <button
                        onClick={() => handleTabChange('feed')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                            activeTab === 'feed'
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                : "bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20"
                        )}
                    >
                        <Globe className="w-4 h-4" />
                        {t('plaza.tabs.feed')}
                    </button>
                    {isLoggedIn && (
                        <button
                            onClick={() => handleTabChange('my')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                activeTab === 'my'
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                    : "bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20"
                            )}
                        >
                            <User className="w-4 h-4" />
                            {t('plaza.tabs.my')}
                        </button>
                    )}
                </motion.div>

                {/* Emotion Filter - only show for feed tab */}
                {activeTab === 'feed' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex justify-center gap-2 flex-wrap pb-4"
                    >
                        {EMOTIONS.map(emo => (
                            <button
                                key={emo}
                                onClick={() => handleEmotionSelect(emo)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                                    selectedEmotion === emo
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                                        : "bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 shadow-sm"
                                )}
                            >
                                {emotionMap[emo] || emo}
                            </button>
                        ))}
                    </motion.div>
                )}

                {/* Grid Layout - 固定每行3个卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <SoulCard
                                card={card}
                                isOwn={activeTab === 'my'}
                                onEdit={handleEditCard}
                                onDelete={handleDeleteCard}
                            />
                        </motion.div>
                    ))}
                </div>

                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                    </div>
                )}

                {!loading && hasMore && cards.length > 0 && (
                    <div className="flex justify-center py-12">
                        <Button variant="outline" onClick={handleLoadMore} className="rounded-full px-8">
                            {t('plaza.loadMore')}
                        </Button>
                    </div>
                )}

                {!loading && !hasMore && cards.length > 0 && (
                    <div className="text-center text-muted-foreground py-12 text-sm flex flex-col items-center gap-2">
                        <div className="w-12 h-1 bg-muted rounded-full" />
                        {t('plaza.endOfList')}
                    </div>
                )}

                {!loading && cards.length === 0 && (
                    <div className="text-center text-muted-foreground py-24 bg-muted/20 rounded-3xl border border-dashed border-border/50">
                        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                        <p>
                            {activeTab === 'my'
                                ? t('plaza.empty.my')
                                : selectedEmotion === 'All'
                                    ? t('plaza.empty.feed')
                                    : t('plaza.empty.filtered')
                            }
                        </p>
                    </div>
                )}

                {/* FAB */}
                <div className="fixed bottom-40 right-4 md:bottom-8 md:right-8 z-50">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Button
                            size="icon"
                            className="h-16 w-16 rounded-full shadow-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white"
                            onClick={() => {
                                if (requireAuth(t('plaza.auth.post'))) {
                                    setEditingCard(null)
                                    setPostContent('')
                                    setIsPostOpen(true)
                                }
                            }}
                        >
                            <PenLine className="w-7 h-7" />
                        </Button>
                    </motion.div>
                </div>

                {/* Post/Edit Modal Overlay */}
                {isPostOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 p-6 space-y-6">
                            <div className="flex justify-between items-center border-b border-border/50 pb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    {editingCard ? t('plaza.post.editTitle') : t('plaza.post.title')}
                                </h3>
                                <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="space-y-3">
                                <Textarea
                                    placeholder={t('plaza.post.placeholder')}
                                    className="min-h-[180px] resize-none text-base bg-muted/30 border-transparent focus:border-primary/50 focus:ring-0 rounded-xl p-4 leading-relaxed"
                                    value={postContent}
                                    onChange={e => setPostContent(e.target.value)}
                                />
                                <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                                    <span>{t('plaza.post.anonymous')}</span>
                                    <span>{postContent.length}/500</span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="ghost" onClick={closeModal}>{t('plaza.post.cancel')}</Button>
                                <Button
                                    onClick={handlePost}
                                    isLoading={posting}
                                    className="px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                                >
                                    {editingCard ? t('plaza.post.save') : t('plaza.post.publish')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={t('plaza.delete.title')}
                description={t('plaza.delete.description')}
                variant="danger"
                cancelText={t('plaza.delete.cancel')}
                confirmText={t('plaza.delete.confirm')}
                isLoading={confirmDialog.isLoading}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, card: null, isLoading: false })}
            />
        </div>
    )
}

