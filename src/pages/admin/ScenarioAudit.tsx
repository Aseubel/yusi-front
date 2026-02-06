import { useCallback, useEffect, useState } from "react";
import { adminApi, type Scenario, type Page } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { InputDialog } from "../../components/ui/InputDialog";
import { toast } from "sonner";
import { Loader2, Check, X, AlertCircle } from "lucide-react";

export const ScenarioAudit = () => {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    // Dialog states
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

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
            const res = await adminApi.getPendingScenarios(page, 10);
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
            toast.error("加载待审核场景失败");
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadScenarios();
    }, [loadScenarios]);

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
            // Remove from list
            setScenarios((prev) => prev.filter(s => s.id !== scenarioId));
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
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">场景审核</h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadScenarios()}>
                        刷新列表
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {loading ? (
                    <div className="col-span-full h-40 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : scenarios.length === 0 ? (
                    <div className="col-span-full h-40 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                        <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                        <p>暂无待审核场景</p>
                    </div>
                ) : (
                    scenarios.map((scenario) => (
                        <div key={scenario.id} className="relative group overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-semibold leading-none tracking-tight">{scenario.title}</h3>
                                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                                        ID: {scenario.id.substring(0, 6)}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">场景描述</h4>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-3 rounded-md min-h-[100px] border border-border/50">
                                        {scenario.description}
                                    </p>
                                </div>

                                <div className="flex items-center text-xs text-muted-foreground">
                                    <span>提交人ID: {scenario.submitterId}</span>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        disabled={processing === scenario.id}
                                        onClick={() => onApproveClick(scenario.id)}
                                    >
                                        {processing === scenario.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                        通过
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        disabled={processing === scenario.id}
                                        onClick={() => onRejectClick(scenario.id)}
                                    >
                                        {processing === scenario.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                                        拒绝
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                >
                    上一页
                </Button>
                <div className="text-sm text-muted-foreground">
                    第 {page + 1} 页 / 共 {Math.max(1, totalPages)} 页
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || loading}
                >
                    下一页
                </Button>
            </div>

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
        </div >
    );
};
