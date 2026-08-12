import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ConfirmDialog, Input, Select, Textarea } from '../../components/ui'
import { adminApi, type AdminAnnouncement } from '../../lib/api'
import { cn } from '../../utils'
import { BellRing, CheckCircle2, ChevronLeft, ChevronRight, Megaphone, Send, Users } from 'lucide-react'

const PAGE_SIZE = 10

export const NotificationManagement = () => {
    const { t, i18n } = useTranslation()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [audience, setAudience] = useState<'ALL'>('ALL')
    const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([])
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [loading, setLoading] = useState(true)
    const [publishing, setPublishing] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const loadAnnouncements = useCallback(async (targetPage: number) => {
        setLoading(true)
        try {
            const { data } = await adminApi.getAnnouncements(targetPage, PAGE_SIZE)
            setAnnouncements(data.data?.content || [])
            setPage(data.data?.number ?? targetPage)
            setTotalPages(data.data?.totalPages ?? 0)
        } catch (error) {
            console.error('Failed to load announcements', error)
            toast.error(t('notificationManagement.loadFailed'))
        } finally {
            setLoading(false)
        }
    }, [t])

    useEffect(() => {
        const timer = window.setTimeout(() => void loadAnnouncements(0), 0)
        return () => window.clearTimeout(timer)
    }, [loadAnnouncements])

    const formReady = title.trim().length > 0 && content.trim().length > 0
    const titleCount = title.length
    const contentCount = content.length
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }), [i18n.language])

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!formReady) {
            toast.error(t('notificationManagement.required'))
            return
        }
        setConfirmOpen(true)
    }

    const publish = async () => {
        setPublishing(true)
        try {
            const { data } = await adminApi.publishAnnouncement({
                title: title.trim(),
                content: content.trim(),
                audience,
            })
            const recipientCount = data.data?.recipientCount ?? 0
            toast.success(t('notificationManagement.publishSuccess', { count: recipientCount }))
            setTitle('')
            setContent('')
            setAudience('ALL')
            setConfirmOpen(false)
            await loadAnnouncements(0)
        } catch (error) {
            console.error('Failed to publish announcement', error)
            toast.error(t('notificationManagement.publishFailed'))
        } finally {
            setPublishing(false)
        }
    }

    const formatDate = (value: string) => {
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <header className="flex flex-col gap-2 border-b border-border pb-5 sm:pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Megaphone className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t('admin.layout.adminPanel')}</p>
                        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t('notificationManagement.title')}</h1>
                    </div>
                </div>
                <p className="max-w-3xl text-sm text-muted-foreground">{t('notificationManagement.subtitle')}</p>
            </header>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
                <Card className="border-border/70 shadow-none">
                    <CardHeader className="border-b border-border/60 p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">{t('notificationManagement.composeTitle')}</CardTitle>
                                <CardDescription className="mt-2">{t('notificationManagement.composeDescription')}</CardDescription>
                            </div>
                            <Send className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-5 sm:p-6 sm:pt-6">
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <label htmlFor="announcement-title" className="text-sm font-medium">{t('notificationManagement.titleLabel')}</label>
                                    <span className="text-xs tabular-nums text-muted-foreground">{titleCount}/120</span>
                                </div>
                                <Input
                                    id="announcement-title"
                                    value={title}
                                    maxLength={120}
                                    onChange={(event) => setTitle(event.target.value)}
                                    placeholder={t('notificationManagement.titlePlaceholder')}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <label htmlFor="announcement-content" className="text-sm font-medium">{t('notificationManagement.contentLabel')}</label>
                                    <span className="text-xs tabular-nums text-muted-foreground">{contentCount}/5000</span>
                                </div>
                                <Textarea
                                    id="announcement-content"
                                    value={content}
                                    maxLength={5000}
                                    rows={10}
                                    onChange={(event) => setContent(event.target.value)}
                                    placeholder={t('notificationManagement.contentPlaceholder')}
                                    className="resize-y leading-6"
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-end">
                                <div className="space-y-2">
                                    <label htmlFor="announcement-audience" className="text-sm font-medium">{t('notificationManagement.audienceLabel')}</label>
                                    <Select
                                        value={audience}
                                        onValueChange={(value) => setAudience(value as 'ALL')}
                                        options={[{ value: 'ALL', label: t('notificationManagement.audienceAll') }]}
                                        aria-label={t('notificationManagement.audienceLabel')}
                                    />
                                </div>
                                <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                                    <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                    <span>{t('notificationManagement.audienceHint')}</span>
                                </div>
                            </div>

                            <div className="flex justify-stretch border-t border-border/60 pt-5 sm:justify-end">
                                <Button type="submit" className="w-full sm:w-auto" disabled={!formReady}>
                                    <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                                    {t('notificationManagement.publish')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-primary/15 bg-primary/[0.035] shadow-none">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <BellRing className="h-4 w-4" aria-hidden="true" />
                            {t('notificationManagement.previewTitle')}
                        </div>
                        <CardDescription>{t('notificationManagement.previewDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                        <article className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm">
                            <div className="mb-3 flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Megaphone className="h-4 w-4" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="break-words font-semibold">{title.trim() || t('notificationManagement.previewTitlePlaceholder')}</h2>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="outline">{t('messages.types.announcement')}</Badge>
                                        <span>{t('notificationManagement.previewRecipient')}</span>
                                    </div>
                                </div>
                            </div>
                            <p className={cn('min-h-28 whitespace-pre-wrap break-words text-sm leading-6', content.trim() ? 'text-foreground/85' : 'text-muted-foreground')}>
                                {content.trim() || t('notificationManagement.previewContentPlaceholder')}
                            </p>
                        </article>
                    </CardContent>
                </Card>
            </section>

            <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">{t('notificationManagement.historyTitle')}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t('notificationManagement.historyDescription')}</p>
                    </div>
                    <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                        {t('notificationManagement.publishedStatus')}
                    </Badge>
                </div>

                <Card className="border-border/70 shadow-none">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="space-y-3 p-6">
                                {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-muted/50" />)}
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-muted-foreground">
                                <Megaphone className="mb-3 h-8 w-8 opacity-40" aria-hidden="true" />
                                <p className="font-medium">{t('notificationManagement.empty')}</p>
                                <p className="mt-1 text-sm">{t('notificationManagement.emptyHint')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/60">
                                {announcements.map((announcement) => (
                                        <article key={announcement.announcementId} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="break-words font-medium">{announcement.title}</h3>
                                                <Badge variant="outline" className="text-[11px]">{t('notificationManagement.audienceAll')}</Badge>
                                            </div>
                                            <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-5 text-muted-foreground">{announcement.content}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground sm:flex-col sm:items-end sm:gap-1">
                                            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />{t('notificationManagement.publishedStatus')}</span>
                                            <span>{t('notificationManagement.recipients', { count: announcement.recipientCount ?? 0 })}</span>
                                            <time dateTime={announcement.publishedAt}>{formatDate(announcement.publishedAt)}</time>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 sm:px-5">
                            <span className="text-xs text-muted-foreground">{t('notificationManagement.page', { current: page + 1, total: totalPages })}</span>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-11 w-11 sm:h-9 sm:w-9"
                                    onClick={() => void loadAnnouncements(page - 1)}
                                    disabled={loading || page <= 0}
                                    aria-label={t('notificationManagement.previousPage')}
                                    title={t('notificationManagement.previousPage')}
                                >
                                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-11 w-11 sm:h-9 sm:w-9"
                                    onClick={() => void loadAnnouncements(page + 1)}
                                    disabled={loading || page >= totalPages - 1}
                                    aria-label={t('notificationManagement.nextPage')}
                                    title={t('notificationManagement.nextPage')}
                                >
                                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </section>

            <ConfirmDialog
                isOpen={confirmOpen}
                title={t('notificationManagement.confirmTitle')}
                description={t('notificationManagement.confirmDescription')}
                confirmText={t('notificationManagement.confirmPublish')}
                cancelText={t('common.cancel')}
                isLoading={publishing}
                onConfirm={() => void publish()}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}
