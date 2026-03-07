import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi, type Scenario, type Page } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { InputDialog } from "../../components/ui/InputDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../components/ui/Sheet";
import { Select } from "../../components/ui/Select";
import { toast } from "sonner";
import { Loader2, Check, X, AlertCircle, FileText, ChevronLeft, ChevronRight, RefreshCw, User, Bot, Shield, Calendar, Clock } from "lucide-react";

const STATUS_MAP = (t: (key: string) => string): Record<number, { label: string; color: string }> => ({
    [-1]: { label: t('scenarioAudit.status.deleted'), color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    0: { label: t('scenarioAudit.status.pending'), color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    1: { label: t('scenarioAudit.status.rejected'), color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    2: { label: t('scenarioAudit.status.aiRejected'), color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    3: { label: t('scenarioAudit.status.aiApproved'), color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    4: { label: t('scenarioAudit.status.approved'), color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
});

const getSourceInfo = (t: (key: string) => string, submitterId: string | null | undefined): { label: string; icon: typeof User; color: string } => {
    if (!submitterId) {
        return { label: t('scenarioAudit.source.systemGenerated'), icon: Bot, color: 'text-purple-500' };
    }
    if (submitterId.startsWith('admin_') || submitterId === 'SYSTEM') {
        return { label: t('scenarioAudit.source.adminAdded'), icon: Shield, color: 'text-blue-500' };
    }
    return { label: t('scenarioAudit.source.userSubmitted'), icon: User, color: 'text-green-500' };
};

const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const ScenarioAudit = () => {
    const { t } = useTranslation();
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
    const [detailScenario, setDetailScenario] = useState<Scenario | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const getTotalPages = (data: unknown): number => {
        if (!data || typeof data !== "object") return 0;
        const record = data as Record<string, unknown>;
        if (typeof record.totalPages === "number") return record.totalPages;
        if (typeof record.total_pages === "number") return record.total_pages;
        if (record.page && typeof record.page === "object") {
            const pageRecord = record.page as Record<string, unknown>;
            if (typeof pageRecord.totalPages === "number") return pageRecord.totalPages;
        }
        return 0;
    };

    const loadScenarios = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminApi.getAllScenarios(page, 10, statusFilter);
            if (res.data.code === 200) {
                const data = res.data.data as Page<Scenario> | unknown;
                const content = Array.isArray((data as { content?: unknown }).content)
                    ? ((data as { content: Scenario[] }).content)
                    : [];
                setScenarios(content);
                const total = getTotalPages(data);
                setTotalPages(total);
            }
        } catch (error) {
            console.error(error);
            toast.error(t('scenarioAudit.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, t]);

    useEffect(() => {
        loadScenarios();
    }, [loadScenarios]);

    const onCardClick = (scenario: Scenario) => {
        setDetailScenario(scenario);
        setDetailOpen(true);
    };

    const onApproveClick = (id: string) => {
        setSelectedScenario(id);
        setConfirmOpen(true);
    };

    const onRejectClick = (id: string) => {
        setSelectedScenario(id);
        setRejectOpen(true);
    };

    const handleApproveConfirm = async () => {
        if (!selectedScenario) return;
        setConfirmOpen(false);
        await performAudit(selectedScenario, true);
    };

    const handleRejectConfirm = async (reason: string) => {
        if (!selectedScenario) return;
        if (!reason.trim()) {
            toast.error(t('scenarioAudit.actions.rejectReasonRequired'));
            return;
        }
        setRejectOpen(false);
        await performAudit(selectedScenario, false, reason);
    };

    const performAudit = async (scenarioId: string, approved: boolean, rejectReason: string = "") => {
        setProcessing(scenarioId);
        try {
            await adminApi.auditScenario(scenarioId, approved, rejectReason);
            toast.success(approved ? t('scenarioAudit.toast.approved') : t('scenarioAudit.toast.rejected'));
            setDetailOpen(false);
            loadScenarios();
        } catch (error) {
            console.error(error);
            toast.error(t('scenarioAudit.toast.operationFailed'));
        } finally {
            setProcessing(null);
            setSelectedScenario(null);
        }
    };

    const statusMap = STATUS_MAP(t);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        {t('scenarioAudit.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm">{t('scenarioAudit.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={statusFilter === undefined ? 'ALL' : String(statusFilter)}
                        onChange={(e) => {
                            const val = e.target.value;
                            setStatusFilter(val === 'ALL' ? undefined : Number(val));
                            setPage(0);
                        }}
                        className="w-32"
                    >
                        <option value="ALL">{t('scenarioAudit.filter.all')}</option>
                        <option value="0">{t('scenarioAudit.status.pending')}</option>
                        <option value="1">{t('scenarioAudit.status.rejected')}</option>
                        <option value="3">{t('scenarioAudit.status.aiApproved')}</option>
                        <option value="4">{t('scenarioAudit.status.approved')}</option>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => loadScenarios()} className="gap-2 shrink-0">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {t('scenarioAudit.refresh')}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : scenarios.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mb-4 opacity-30" />
                        <p className="text-sm">{t('scenarioAudit.noData')}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {scenarios.map((scenario) => {
                        const sourceInfo = getSourceInfo(t, scenario.submitterId);
                        const statusInfo = statusMap[scenario.status] || { label: t('scenarioAudit.status.unknown'), color: 'bg-gray-100 text-gray-600' };
                        const SourceIcon = sourceInfo.icon;
                        
                        return (
                            <Card 
                                key={scenario.id} 
                                className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
                                onClick={() => onCardClick(scenario)}
                            >
                                <CardContent className="p-0">
                                    <div className="p-4 md:p-5 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="text-base font-semibold leading-tight line-clamp-1">{scenario.title}</h3>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-2 text-muted-foreground">
                                                {scenario.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <SourceIcon className={`w-3.5 h-3.5 ${sourceInfo.color}`} />
                                                <span>{sourceInfo.label}</span>
                                            </div>
                                            <span className="text-[10px] font-mono">#{scenario.id.substring(0, 6)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        className="gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {t('scenarioAudit.prevPage')}
                    </Button>
                    <div className="text-sm text-muted-foreground tabular-nums">
                        <span className="font-medium text-foreground">{page + 1}</span>
                        <span className="mx-1">/</span>
                        <span>{Math.max(1, totalPages)}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1 || loading}
                        className="gap-1"
                    >
                        {t('scenarioAudit.nextPage')}
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                    {detailScenario && (
                        <>
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    {t('scenarioAudit.detail.title')}
                                </SheetTitle>
                                <SheetDescription>
                                    {t('scenarioAudit.detail.description')}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    {(() => {
                                        const statusInfo = statusMap[detailScenario.status] || { label: t('scenarioAudit.status.unknown'), color: 'bg-gray-100 text-gray-600' };
                                        return (
                                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        );
                                    })()}
                                    <span className="text-xs text-muted-foreground font-mono">
                                        ID: {detailScenario.id}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">{detailScenario.title}</h3>
                                </div>

                                <div className="bg-muted/50 rounded-lg p-4">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                        {detailScenario.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {(() => {
                                        const sourceInfo = getSourceInfo(t, detailScenario.submitterId);
                                        const SourceIcon = sourceInfo.icon;
                                        return (
                                            <div className="flex items-center gap-2">
                                                <SourceIcon className={`w-4 h-4 ${sourceInfo.color}`} />
                                                <span className="text-muted-foreground">{t('scenarioAudit.detail.source')}:</span>
                                                <span>{sourceInfo.label}</span>
                                            </div>
                                        );
                                    })()}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">{t('scenarioAudit.detail.created')}:</span>
                                        <span>{formatDate(detailScenario.createTime)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">{t('scenarioAudit.detail.updated')}:</span>
                                        <span>{formatDate(detailScenario.updateTime)}</span>
                                    </div>
                                </div>

                                {detailScenario.rejectReason && (
                                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                        <span className="font-medium">{t('scenarioAudit.detail.rejectReason')}: </span>
                                        {detailScenario.rejectReason}
                                    </div>
                                )}

                                {detailScenario.status === 0 && (
                                    <div className="flex gap-3 pt-4 border-t border-border">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            disabled={processing === detailScenario.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onApproveClick(detailScenario.id);
                                            }}
                                        >
                                            {processing === detailScenario.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>
                                                    <Check className="w-4 h-4 mr-1.5" />
                                                    {t('scenarioAudit.actions.approve')}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="danger"
                                            className="flex-1"
                                            disabled={processing === detailScenario.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRejectClick(detailScenario.id);
                                            }}
                                        >
                                            {processing === detailScenario.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>
                                                    <X className="w-4 h-4 mr-1.5" />
                                                    {t('scenarioAudit.actions.reject')}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                isOpen={confirmOpen}
                title={t('scenarioAudit.actions.confirmApprove')}
                description={t('scenarioAudit.actions.confirmApproveDesc')}
                onConfirm={handleApproveConfirm}
                onCancel={() => setConfirmOpen(false)}
            />

            <InputDialog
                isOpen={rejectOpen}
                title={t('scenarioAudit.actions.rejectTitle')}
                description={t('scenarioAudit.actions.rejectDesc')}
                placeholder={t('scenarioAudit.actions.rejectPlaceholder')}
                inputType="textarea"
                confirmText={t('scenarioAudit.actions.confirmReject')}
                onConfirm={handleRejectConfirm}
                onCancel={() => setRejectOpen(false)}
            />
        </div>
    );
};
