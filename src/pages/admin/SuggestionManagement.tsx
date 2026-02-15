import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Mail, Send, Loader2, ChevronLeft, Filter, User } from 'lucide-react'
import { Button, Card, Textarea, Badge } from '../../components/ui'
import { api } from '../../lib/api'
import { toast } from 'sonner'

interface Suggestion {
    id: number
    suggestionId: string
    userId: string
    content: string
    contactEmail: string | null
    status: string
    reply: string | null
    repliedBy: string | null
    repliedAt: string | null
    createTime: string
    updateTime: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING: { label: '待处理', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    REPLIED: { label: '已回复', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    RESOLVED: { label: '已解决', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    CLOSED: { label: '已关闭', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' }
}

export const SuggestionManagement = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
    const [replyContent, setReplyContent] = useState('')
    const [isReplying, setIsReplying] = useState(false)
    const [showFilters, setShowFilters] = useState(false)

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
            toast.error('加载建议列表失败')
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter])

    useEffect(() => {
        loadSuggestions()
    }, [loadSuggestions])

    const handleReply = async () => {
        if (!selectedSuggestion || !replyContent.trim()) {
            toast.error('请输入回复内容')
            return
        }

        setIsReplying(true)
        try {
            await api.post(`/admin/suggestions/${selectedSuggestion.suggestionId}/reply`, {
                reply: replyContent.trim()
            })
            toast.success('回复成功')
            setSelectedSuggestion(null)
            setReplyContent('')
            loadSuggestions()
        } catch (error) {
            console.error('Reply failed:', error)
            toast.error('回复失败')
        } finally {
            setIsReplying(false)
        }
    }

    const handleUpdateStatus = async (suggestionId: string, status: string) => {
        try {
            await api.post(`/admin/suggestions/${suggestionId}/status`, { status })
            toast.success('状态已更新')
            loadSuggestions()
        } catch (error) {
            console.error('Update status failed:', error)
            toast.error('更新状态失败')
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
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
        return (
            <Badge className={config.color}>
                {config.label}
            </Badge>
        )
    }

    if (selectedSuggestion) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setSelectedSuggestion(null)
                            setReplyContent('')
                        }}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-xl font-semibold">建议详情</h2>
                </div>

                <Card className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getStatusBadge(selectedSuggestion.status)}
                                <span className="text-sm text-muted-foreground">
                                    {formatDate(selectedSuggestion.createTime)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>用户ID: {selectedSuggestion.userId}</span>
                            {selectedSuggestion.contactEmail && (
                                <>
                                    <span className="mx-2">|</span>
                                    <Mail className="w-4 h-4" />
                                    <span>{selectedSuggestion.contactEmail}</span>
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
                                    回复内容
                                </h4>
                                <div className="p-4 bg-primary/5 rounded-lg">
                                    <p className="whitespace-pre-wrap">{selectedSuggestion.reply}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    回复时间: {formatDate(selectedSuggestion.repliedAt!)}
                                </p>
                            </div>
                        )}

                        {selectedSuggestion.status === 'PENDING' && (
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium mb-2">回复建议</h4>
                                <Textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="输入您的回复..."
                                    rows={4}
                                />
                                <div className="flex gap-2 mt-3">
                                    <Button
                                        onClick={handleReply}
                                        disabled={isReplying || !replyContent.trim()}
                                    >
                                        {isReplying ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4 mr-2" />
                                        )}
                                        发送回复
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t">
                            <span className="text-sm text-muted-foreground">更改状态:</span>
                            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                <Button
                                    key={status}
                                    variant={selectedSuggestion.status === status ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => handleUpdateStatus(selectedSuggestion.suggestionId, status)}
                                >
                                    {config.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    建议管理
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="w-4 h-4 mr-2" />
                    筛选
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
                                    onClick={() => setStatusFilter('')}
                                >
                                    全部
                                </Button>
                                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                    <Button
                                        key={status}
                                        variant={statusFilter === status ? 'primary' : 'outline'}
                                        size="sm"
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
                    <p className="text-muted-foreground">暂无建议</p>
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
                                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => setSelectedSuggestion(suggestion)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getStatusBadge(suggestion.status)}
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(suggestion.createTime)}
                                            </span>
                                        </div>
                                        <p className="text-sm line-clamp-2 mb-2">
                                            {suggestion.content}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {suggestion.userId.slice(0, 8)}...
                                            </span>
                                            {suggestion.contactEmail && (
                                                <span className="flex items-center gap-1">
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
                        onClick={() => setPage(p => p - 1)}
                    >
                        上一页
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                        {page + 1} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                    >
                        下一页
                    </Button>
                </div>
            )}
        </div>
    )
}
