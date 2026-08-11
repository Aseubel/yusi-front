import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { notificationApi, lifegraphApi, type NotificationType, type UserNotification } from '../lib/lifegraph';
import { chatApi } from '../lib/api';
import { useNotificationStore } from '../stores/notificationStore';
import { useChatStore } from '../stores';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useTranslation } from 'react-i18next';
import { 
    Bell, 
    Merge, 
    Check, 
    X, 
    RefreshCw, 
    ArrowLeft,
    Inbox,
    Loader2,
    CheckCheck,
    Trash2,
    Moon,
    MessageSquare,
    Sparkles,
    Megaphone,
    Radio,
    HeartHandshake,
    type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils';

type TabType = 'all' | NotificationType;

const PAGE_SIZE = 20;

const NOTIFICATION_TAB_CONFIG: { id: NotificationType; labelKey: string; icon: LucideIcon }[] = [
    { id: 'MERGE_SUGGESTION', labelKey: 'messages.tabs.mergeSuggestion', icon: Merge },
    { id: 'ANNOUNCEMENT', labelKey: 'messages.tabs.announcement', icon: Megaphone },
    { id: 'SYSTEM', labelKey: 'messages.tabs.system', icon: Bell },
    { id: 'REMINDER', labelKey: 'messages.tabs.reminder', icon: Bell },
    { id: 'SOUL_WEEKLY_REPORT', labelKey: 'messages.tabs.soulWeeklyReport', icon: Moon },
    { id: 'AGENT_GREETING', labelKey: 'messages.tabs.agentGreeting', icon: MessageSquare },
    { id: 'RESONANCE_SIGNAL', labelKey: 'messages.tabs.resonanceSignal', icon: Radio },
    { id: 'MUTUAL_RESONANCE', labelKey: 'messages.tabs.mutualResonance', icon: HeartHandshake },
];

export function Messages() {
    const { t } = useTranslation()
    const navigate = useNavigate();
    const { unreadCount, setUnreadCount, decrementUnreadCount } = useNotificationStore();
    const { setIsOpen, setShouldReloadHistory } = useChatStore();
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const requestSequence = useRef(0);

    const handleAction = async (notification: UserNotification) => {
        if (!notification.isRead) {
            await handleMarkAsRead(notification.id);
        }
        
        if (notification.type === 'SOUL_WEEKLY_REPORT') {
            navigate('/memory-center?section=SOUL_REPORT');
        } else if (notification.type === 'AGENT_GREETING') {
            try {
                await chatApi.injectGreeting(notification.id);
                setShouldReloadHistory(true);
                setIsOpen(true);
            } catch (error) {
                console.error(error);
                toast.error(t('messages.greetingLoadFailed'));
            }
        }
    };

    const fetchNotifications = useCallback(async (targetPage = 0, append = false) => {
        const requestId = ++requestSequence.current;
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setLoadingMore(false);
        }
        try {
            const type = activeTab === 'all' ? undefined : activeTab;
            const [notificationsRes, countRes] = await Promise.all([
                notificationApi.getNotifications(targetPage, PAGE_SIZE, type),
                notificationApi.getUnreadCount(),
            ]);

            if (requestId !== requestSequence.current) return;
            const pageData = notificationsRes.data?.data;
            const incoming = pageData?.content ?? [];
            setNotifications(previous => {
                if (!append) return incoming;
                const byId = new Map([...previous, ...incoming].map(notification => [notification.id, notification]));
                return Array.from(byId.values());
            });
            if (pageData) {
                setPage(pageData.number ?? targetPage);
                setTotalPages(pageData.totalPages ?? 0);
                setTotalElements(pageData.totalElements ?? 0);
            }
            if (countRes.data?.data !== undefined) {
                setUnreadCount(countRes.data.data);
            }
        } catch {
            if (requestId === requestSequence.current) {
                toast.error(t('messages.fetchError'));
            }
        } finally {
            if (requestId !== requestSequence.current) return;
            if (append) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    }, [activeTab, setUnreadCount, t]);

    useEffect(() => {
        void fetchNotifications();
    }, [fetchNotifications]);

    const handleLoadMore = () => {
        if (loading || loadingMore || page >= totalPages - 1) return;
        void fetchNotifications(page + 1, true);
    };

    const handleMarkAsRead = async (notificationId: number) => {
        const notification = notifications.find(item => item.id === notificationId);
        if (!notification || notification.isRead) return;
        try {
            const response = await notificationApi.markAsRead(notificationId);
            if (response.data?.data) {
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
                );
                decrementUnreadCount();
            }
        } catch {
            toast.error(t('common.operationFailed'));
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success(t('messages.allMarkedRead'));
        } catch {
            toast.error(t('common.operationFailed'));
        }
    };

    const handleDelete = async (notificationId: number) => {
        try {
            const notification = notifications.find(n => n.id === notificationId);
            await notificationApi.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (notification && !notification.isRead) {
                decrementUnreadCount();
            }
            toast.success(t('common.deleted'));
        } catch {
            toast.error(t('messages.deleteFailed'));
        }
    };

    const handleAcceptMerge = async (notification: UserNotification) => {
        if (!notification.refId || processingId) return;
        setProcessingId(notification.id);
        try {
            await lifegraphApi.acceptMerge(Number(notification.refId));
            toast.success(t('messages.acceptedMerge'));
            await notificationApi.deleteNotification(notification.id);
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
            if (!notification.isRead) {
                decrementUnreadCount();
            }
        } catch {
            toast.error(t('common.operationFailed'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectMerge = async (notification: UserNotification) => {
        if (!notification.refId || processingId) return;
        setProcessingId(notification.id);
        try {
            await lifegraphApi.rejectMerge(Number(notification.refId));
            toast.success(t('messages.rejectedMerge'));
            await notificationApi.deleteNotification(notification.id);
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
            if (!notification.isRead) {
                decrementUnreadCount();
            }
        } catch {
            toast.error(t('common.operationFailed'));
        } finally {
            setProcessingId(null);
        }
    };

    const tabs: { id: TabType; label: string; icon: LucideIcon }[] = [
        { id: 'all', label: t('messages.tabs.all'), icon: Inbox },
        ...NOTIFICATION_TAB_CONFIG.map(tab => ({
            ...tab,
            label: t(tab.labelKey),
        })),
    ];

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 pb-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label={t('common.back')} title={t('common.back')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{t('messages.title')}</h1>
                            {unreadCount > 0 && (
                                <p className="text-sm text-muted-foreground">{unreadCount} {t('messages.unread')}</p>
                            )}
                        </div>
                    </div>
                    <div className="ml-auto flex gap-2">
                        {unreadCount > 0 && (
                            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                                <CheckCheck className="w-4 h-4 mr-1" />
                                {t('messages.markAllRead')}
                            </Button>
                        )}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => void fetchNotifications()}
                            disabled={loading}
                            aria-label={t('common.refresh')}
                            title={t('common.refresh')}
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            aria-pressed={activeTab === tab.id}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Inbox className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">{t('messages.noMessages')}</p>
                        <p className="text-sm">{t('messages.noMessagesHint')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                                onDelete={() => handleDelete(notification.id)}
                                onAccept={() => handleAcceptMerge(notification)}
                                onReject={() => handleRejectMerge(notification)}
                                onAction={() => handleAction(notification)}
                                isProcessing={processingId === notification.id}
                            />
                        ))}
                        {page < totalPages - 1 && (
                            <div className="flex flex-col items-center gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    {loadingMore ? t('messages.loadingMore') : t('messages.loadMore')}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    {t('messages.loadedCount', { loaded: notifications.length, total: totalElements })}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

interface NotificationCardProps {
    notification: UserNotification;
    onMarkAsRead: () => void;
    onDelete: () => void;
    onAccept: () => void;
    onReject: () => void;
    onAction: () => void;
    isProcessing: boolean;
}

function NotificationCard({ 
    notification, 
    onMarkAsRead, 
    onDelete, 
    onAccept, 
    onReject, 
    onAction,
    isProcessing 
}: NotificationCardProps) {
    const { t } = useTranslation()
    const typeConfig = {
        MERGE_SUGGESTION: {
            icon: Merge,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            label: t('messages.types.mergeSuggestion'),
        },
        SYSTEM: {
            icon: Bell,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            label: t('messages.types.system'),
        },
        REMINDER: {
            icon: Bell,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            label: t('messages.types.reminder'),
        },
        ANNOUNCEMENT: {
            icon: Megaphone,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            label: t('messages.types.announcement'),
        },
        SOUL_WEEKLY_REPORT: {
            icon: Moon,
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-500/10',
            label: t('messages.types.soulWeeklyReport'),
        },
        AGENT_GREETING: {
            icon: MessageSquare,
            color: 'text-pink-500',
            bgColor: 'bg-pink-500/10',
            label: t('messages.types.agentGreeting'),
        },
        RESONANCE_SIGNAL: {
            icon: Radio,
            color: 'text-cyan-500',
            bgColor: 'bg-cyan-500/10',
            label: t('messages.types.resonanceSignal'),
        },
        MUTUAL_RESONANCE: {
            icon: HeartHandshake,
            color: 'text-rose-500',
            bgColor: 'bg-rose-500/10',
            label: t('messages.types.mutualResonance'),
        },
    };

    const config = typeConfig[notification.type] || typeConfig.SYSTEM;
    const Icon = config.icon;

    return (
        <div className={cn(
            "bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow",
            !notification.isRead && "border-l-4 border-l-primary"
        )}>
            <div className="flex items-start gap-4">
                <div className={cn("p-2.5 rounded-xl shrink-0", config.bgColor)}>
                    <Icon className={cn("w-5 h-5", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{notification.title}</h3>
                        <Badge variant="outline" className="text-xs">
                            {config.label}
                        </Badge>
                        {!notification.isRead && (
                            <Badge className="text-xs bg-primary/20 text-primary">{t('messages.isUnread')}</Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{notification.content}</p>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt, t)}
                        </span>
                        <div className="flex gap-2">
                            {notification.type === 'MERGE_SUGGESTION' && notification.refId && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onReject}
                                        disabled={isProcessing}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        {t('common.reject')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={onAccept}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4 mr-1" />
                                        )}
                                        {t('common.accept')}
                                    </Button>
                                </>
                            )}
                            {notification.type === 'SOUL_WEEKLY_REPORT' && (
                                <Button
                                    size="sm"
                                    onClick={onAction}
                                >
                                    <Sparkles className="w-4 h-4 mr-1" />
                                    {t('common.view')}
                                </Button>
                            )}
                            {notification.type === 'AGENT_GREETING' && (
                                <Button
                                    size="sm"
                                    onClick={onAction}
                                >
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    {t('diary.startChat')}
                                </Button>
                            )}
                            {!notification.isRead && (
                                <Button variant="ghost" size="sm" onClick={onMarkAsRead}>
                                    <Check className="w-4 h-4 mr-1" />
                                    {t('messages.markAsRead')}
                                </Button>
                            )}
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={onDelete}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatTime(isoString: string, t: (key: string) => string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('messages.time.justNow');
    if (minutes < 60) return t('messages.time.minutesAgo').replace('{{minutes}}', String(minutes));
    if (hours < 24) return t('messages.time.hoursAgo').replace('{{hours}}', String(hours));
    if (days < 7) return t('messages.time.daysAgo').replace('{{days}}', String(days));
    return date.toLocaleDateString();
}
