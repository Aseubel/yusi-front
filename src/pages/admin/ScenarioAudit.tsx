import { useCallback, useEffect, useState } from "react";
import { adminApi, type Scenario, type Page } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { InputDialog } from "../../components/ui/InputDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../components/ui/Sheet";
import { Select } from "../../components/ui/Select";
import { toast } from "sonner";
import { Loader2, Check, X, AlertCircle, FileText, ChevronLeft, ChevronRight, RefreshCw, User, Bot, Shield, Calendar, Clock } from "lucide-react";

const STATUS_MAP: Record<number, { label: string; color: string }> = {
    [-1]: { label: '已删除', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    0: { label: '待审核', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    1: { label: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    2: { label: 'AI拒绝', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    3: { label: 'AI通过', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    4: { label: '已通过', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

const getSourceInfo = (submitterId: string | null | undefined): { label: string; icon: typeof User; color: string } => {
    if (!submitterId) {
        return { label: '系统生成', icon: Bot, color: 'text-purple-500' };
    }
    if (submitterId.startsWith('admin_') || submitterId === 'SYSTEM') {
        return { label: '管理员添加', icon: Shield, color: 'text-blue-500' };
    }
    return { label: '用户投稿', icon: User, color: 'text-green-500' };
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
            toast.error("加载场景失败");
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

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
            toast.error("拒绝理由不能为空");
            return;
        }
        setRejectOpen(false);
        await performAudit(selectedScenario, false, reason);
    };

    const performAudit = async (scenarioId: string, approved: boolean, rejectReason: string = "") => {
        setProcessing(scenarioId);
        try {
            await adminApi.auditScenario(scenarioId, approved, rejectReason);
            toast.success(approved ? "已通过" : "已拒绝");
            setDetailOpen(false);
            loadScenarios();
        } catch (error) {
            console.error(error);
            toast.error("操作失败");
        } finally {
            setProcessing(null);
            setSelectedScenario(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        情景管理
                    </h1>
                    <p className="text-muted-foreground text-sm">管理所有情景内容，区分来源</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={statusFilter ?? ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            setStatusFilter(val === '' ? undefined : Number(val));
                            setPage(0);
                        }}
                        className="w-32"
                    >
                        <option value="">全部状态</option>
                        <option value="0">待审核</option>
                        <option value="1">已拒绝</option>
                        <option value="3">AI通过</option>
                        <option value="4">已通过</option>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => loadScenarios()} className="gap-2 shrink-0">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        刷新
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
                        <p className="text-sm">暂无情景数据</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {scenarios.map((scenario) => {
                        const sourceInfo = getSourceInfo(scenario.submitterId);
                        const statusInfo = STATUS_MAP[scenario.status] || { label: '未知', color: 'bg-gray-100 text-gray-600' };
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
                        上一页
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
                        下一页
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
                                    情景详情
                                </SheetTitle>
                                <SheetDescription>
                                    查看情景完整内容并进行审核操作
                                </SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    {(() => {
                                        const statusInfo = STATUS_MAP[detailScenario.status] || { label: '未知', color: 'bg-gray-100 text-gray-600' };
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
                                        const sourceInfo = getSourceInfo(detailScenario.submitterId);
                                        const SourceIcon = sourceInfo.icon;
                                        return (
                                            <div className="flex items-center gap-2">
                                                <SourceIcon className={`w-4 h-4 ${sourceInfo.color}`} />
                                                <span className="text-muted-foreground">来源:</span>
                                                <span>{sourceInfo.label}</span>
                                            </div>
                                        );
                                    })()}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">创建:</span>
                                        <span>{formatDate(detailScenario.createTime)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">更新:</span>
                                        <span>{formatDate(detailScenario.updateTime)}</span>
                                    </div>
                                </div>

                                {detailScenario.rejectReason && (
                                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                        <span className="font-medium">拒绝理由: </span>
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
                                                    通过
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
                                                    拒绝
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
                title="确认通过"
                description="确定通过该场景吗？通过后将对所有用户可见。"
                onConfirm={handleApproveConfirm}
                onCancel={() => setConfirmOpen(false)}
            />

            <InputDialog
                isOpen={rejectOpen}
                title="拒绝场景"
                description="请输入拒绝理由，将反馈给用户。"
                placeholder="例如：内容包含违规信息..."
                inputType="textarea"
                confirmText="确认拒绝"
                onConfirm={handleRejectConfirm}
                onCancel={() => setRejectOpen(false)}
            />
        </div>
    );
};
