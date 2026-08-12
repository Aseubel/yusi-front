import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Mail, Send, Loader2, ChevronLeft, Filter, Calendar, Clock } from 'lucide-react'
import { Button, Card, Textarea, Badge } from '../../components/ui'
import { api } from '../../lib/api'
import { toast } from 'sonner'

interface Suggestion {
    id: number
    suggestionId: string
    content: string
    contactEmail: string | null
    status: string
    reply: string | null
    repliedBy: string | null
    repliedAt: string | null
    createTime: string
    updateTime: string
}

const STATUS_CONFIG = (t: (key: string) => string): Record<string, { label: string; color: string }> => ({
    PENDING: { label: t('suggestionManagement.status.pending'), color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    REPLIED: { label: t('suggestionManagement.status.replied'), color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    RESOLVED: { label: t('suggestionManagement.status.resolved'), color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    CLOSED: { label: t('suggestionManagement.status.closed'), color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' }
})

export const SuggestionManagement = () => {
    const { t } = useTranslation();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
    const [replyContent, setReplyContent] = useState('')
    const [isReplying, setIsReplying] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [statusUpdateTime, setStatusUpdateTime] = useState('')
    const [showTimePicker, setShowTimePicker] = useState(false)

    const loadSuggestions = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: '10'
            })
            if (statusFilter) {
                params.append('status', statusFilter)
            }
            const { data } = await api.get(`/admin/suggestions?${params}`)
            setSuggestions(data.data.content || [])
            setTotalPages(data.data.totalPages || 1)
        } catch (error) {
            console.error('Load suggestions failed:', error)
            toast.error(t('suggestionManagement.loadFailed'))
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter, t])

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadSuggestions()
        }, 0)
        return () => clearTimeout(timer)
    }, [loadSuggestions])

    useEffect(() => {
        if (selectedSuggestion) {
            const statusTime = selectedSuggestion.repliedAt
                ? selectedSuggestion.repliedAt.slice(0, 16)
                : (() => {
                    const now = new Date()
                    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
                    return now.toISOString().slice(0, 16)
                })()
            const timer = setTimeout(() => setStatusUpdateTime(statusTime), 0)
            return () => clearTimeout(timer)
        }
    }, [selectedSuggestion])

    const handleReply = async () => {
        if (!selectedSuggestion || !replyContent.trim()) {
            toast.error(t('suggestionManagement.enterReply'))
            return
        }

        setIsReplying(true)
        try {
            await api.post(`/admin/suggestions/${selectedSuggestion.suggestionId}/reply`, {
                reply: replyContent.trim()
            })
            toast.success(t('suggestionManagement.replySuccess'))
            setSelectedSuggestion(null)
            setReplyContent('')
            loadSuggestions()
        } catch (error) {
            console.error('Reply failed:', error)
            toast.error(t('suggestionManagement.replyFailed'))
        } finally {
            setIsReplying(false)
        }
    }

    const handleUpdateStatus = async (suggestionId: string, status: string) => {
        try {
            await api.post(`/admin/suggestions/${suggestionId}/status`, {
                status,
                repliedAt: statusUpdateTime ? new Date(statusUpdateTime).toISOString() : null
            })
            const statusLabel = STATUS_CONFIG(t)[status]?.label || status
            toast.success(t('suggestionManagement.statusUpdated', { status: statusLabel }))
            loadSuggestions()
        } catch (error) {
            console.error('Update status failed:', error)
            toast.error(t('suggestionManagement.updateStatusFailed'))
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = (status: string) => {
        const config = STATUS_CONFIG(t)[status] || STATUS_CONFIG(t).PENDING
        return (
            <Badge className={config.color}>
                {config.label}
            </Badge>
        )
    }

    if (selectedSuggestion) {
        return (
            <div className="space-y-5 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 sm:h-9 sm:w-9"
                        onClick={() => {
                            setSelectedSuggestion(null)
                            setReplyContent('')
                            setShowTimePicker(false)
                        }}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="min-w-0 break-words text-xl font-semibold">{t('suggestionManagement.detailTitle')}</h2>
                </div>

                <Card className="p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {getStatusBadge(selectedSuggestion.status)}
                                <span className="text-sm text-muted-foreground">
                                    {formatDate(selectedSuggestion.createTime)}
                                </span>
                            </div>
                        </div>

                        <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                            {selectedSuggestion.contactEmail && (
                                <>
                                    <Mail className="w-4 h-4" />
                                    <span className="min-w-0 break-words">{selectedSuggestion.contactEmail}</span>
                                </>
                            )}
                        </div>

                        <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="whitespace-pre-wrap">{selectedSuggestion.content}</p>
                        </div>

                        {selectedSuggestion.reply && (
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    {t('suggestionManagement.replyContent')}
                                </h4>
                                <div className="p-4 bg-primary/5 rounded-lg">
                                    <p className="whitespace-pre-wrap">{selectedSuggestion.reply}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {t('suggestionManagement.replyTime')}: {formatDate(selectedSuggestion.repliedAt!)}
                                </p>
                            </div>
                        )}

                        {selectedSuggestion.status === 'PENDING' && (
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium mb-2">{t('suggestionManagement.replySuggestion')}</h4>
                                <Textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={t('suggestionManagement.replyPlaceholder')}
                                    rows={4}
                                />
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        onClick={handleReply}
                                        disabled={isReplying || !replyContent.trim()}
                                    >
                                        {isReplying ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4 mr-2" />
                                        )}
                                        {t('suggestionManagement.sendReply')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-muted-foreground">{t('suggestionManagement.changeStatus')}:</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="min-h-11 text-muted-foreground sm:min-h-9"
                                    onClick={() => setShowTimePicker(!showTimePicker)}
                                >
                                    <Clock className="w-4 h-4 mr-1" />
                                    {showTimePicker ? t('suggestionManagement.hideTimePicker') : t('suggestionManagement.setProcessingTime')}
                                </Button>
                            </div>

                            {showTimePicker && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-3"
                                >
                                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="datetime-local"
                                            value={statusUpdateTime}
                                            onChange={(e) => setStatusUpdateTime(e.target.value)}
                                            className="min-h-11 w-full min-w-0 bg-transparent border-none text-sm focus:outline-none sm:min-h-9"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {Object.entries(STATUS_CONFIG(t)).map(([status, config]) => (
                                    <Button
                                        key={status}
                                        variant={selectedSuggestion.status === status ? 'primary' : 'outline'}
                                        size="sm"
                                        className="min-h-11 sm:min-h-9"
                                        onClick={() => handleUpdateStatus(selectedSuggestion.suggestionId, status)}
                                    >
                                        {config.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                    <MessageSquare className="w-5 h-5" />
                    {t('suggestionManagement.title')}
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11 sm:min-h-9"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="w-4 h-4 mr-2" />
                    {t('common.filter')}
                </Button>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="p-4">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={statusFilter === '' ? 'primary' : 'outline'}
                                    size="sm"
                                    className="min-h-11 sm:min-h-9"
                                    onClick={() => setStatusFilter('')}
                                >
                                    {t('suggestionManagement.filter.all')}
                                </Button>
                                {Object.entries(STATUS_CONFIG(t)).map(([status, config]) => (
                                    <Button
                                        key={status}
                                        variant={statusFilter === status ? 'primary' : 'outline'}
                                        size="sm"
                                        className="min-h-11 sm:min-h-9"
                                        onClick={() => setStatusFilter(status)}
                                    >
                                        {config.label}
                                    </Button>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : suggestions.length === 0 ? (
                <Card className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">{t('suggestionManagement.noData')}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {suggestions.map((suggestion, index) => (
                        <motion.div
                            key={suggestion.suggestionId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card
                                className="cursor-pointer p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedSuggestion(suggestion)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        setSelectedSuggestion(suggestion)
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getStatusBadge(suggestion.status)}
                                            <span className="break-all text-xs text-muted-foreground">
                                                {formatDate(suggestion.createTime)}
                                            </span>
                                        </div>
                                        <p className="text-sm line-clamp-2 mb-2">
                                            {suggestion.content}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {suggestion.contactEmail && (
                                                <span className="flex min-w-0 items-start gap-1 break-words">
                                                    <Mail className="w-3 h-3" />
                                                    {suggestion.contactEmail}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        className="min-h-11 sm:min-h-9"
                        onClick={() => setPage(p => p - 1)}
                    >
                        {t('suggestionManagement.prevPage')}
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                        {page + 1} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages - 1}
                        className="min-h-11 sm:min-h-9"
                        onClick={() => setPage(p => p + 1)}
                    >
                        {t('suggestionManagement.nextPage')}
                    </Button>
                </div>
            )}
        </div>
    )
}
