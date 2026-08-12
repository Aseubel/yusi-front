import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ArrowRight, BookOpen, FileText, LayoutGrid, MessageSquare, RotateCcw, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { adminApi, type AdminStats } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

export const AdminDashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const isSuperAdmin = user?.isSuperAdmin === true;

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await adminApi.getStats();
                if (res.data.code === 200) {
                    setStats(res.data.data);
                }
            } catch (error) {
                console.error("Failed to load admin dashboard stats", error);
                toast.error(t("adminDashboard.loadFailed"));
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [t]);

    const handleFullSync = async () => {
        try {
            setSyncing(true);
            const res = await adminApi.fullSyncEmbeddings();
            if (res.data.code === 200) {
                toast.success(t("adminDashboard.fullSyncTriggered", { count: res.data.data }));
                setShowResetDialog(false);
            }
        } catch (error) {
            console.error("Milvus reset failed", error);
            toast.error(t("adminDashboard.fullSyncFailed"));
        } finally {
            setSyncing(false);
        }
    };

    const formatMetric = (value?: number) => value === undefined ? "-" : value.toLocaleString();

    const statItems = useMemo(() => [
        { title: t("adminDashboard.totalUsers"), value: stats?.totalUsers, icon: Users, tone: "text-sky-600 bg-sky-500/10" },
        { title: t("adminDashboard.activeUsersToday"), value: stats?.activeUsersToday, icon: Activity, tone: "text-emerald-600 bg-emerald-500/10" },
        { title: t("adminDashboard.activeUsers30d"), value: stats?.activeUsers30d, icon: Users, tone: "text-violet-600 bg-violet-500/10" },
        { title: t("adminDashboard.totalDiaries"), value: stats?.totalDiaries, icon: BookOpen, tone: "text-amber-600 bg-amber-500/10" },
        { title: t("adminDashboard.pendingScenarios"), value: stats?.pendingScenarios, icon: FileText, tone: "text-orange-600 bg-orange-500/10", href: "/admin/scenarios" },
        { title: t("adminDashboard.pendingSuggestions"), value: stats?.pendingSuggestions, icon: MessageSquare, tone: "text-rose-600 bg-rose-500/10", href: "/admin/suggestions" },
        { title: t("adminDashboard.totalRooms"), value: stats?.totalRooms, icon: LayoutGrid, tone: "text-slate-600 bg-slate-500/10" },
    ], [stats, t]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Activity className="h-7 w-7 animate-pulse text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <header className="flex flex-col gap-2 border-b border-border pb-5 sm:pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Shield className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("admin.layout.adminPanel")}</p>
                        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t("adminDashboard.title")}</h1>
                    </div>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">{t("adminDashboard.welcome")}</p>
            </header>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("adminDashboard.overview")}>
                {statItems.map((item) => {
                    const content = (
                        <Card className="h-full border-border/70 shadow-none transition-colors hover:border-primary/40">
                            <CardContent className="flex items-start justify-between gap-3 p-4 sm:gap-4 sm:p-5">
                                <div>
                                    <p className="text-sm text-muted-foreground">{item.title}</p>
                                    <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{formatMetric(item.value)}</p>
                                </div>
                                <div className={`rounded-lg p-2.5 ${item.tone}`}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                    return item.href ? <Link key={item.title} to={item.href} className="block">{content}</Link> : <div key={item.title}>{content}</div>;
                })}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                <Card className="border-border/70 shadow-none">
                    <CardContent className="p-4 sm:p-6">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">{t("adminDashboard.activityTitle")}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">{t("adminDashboard.activityDescription")}</p>
                            </div>
                            <Activity className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg bg-muted/50 p-4">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("adminDashboard.activeUsersToday")}</p>
                                <p className="mt-2 text-2xl font-semibold">{formatMetric(stats?.activeUsersToday)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{t("adminDashboard.activityToday")}</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-4">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("adminDashboard.activeUsers7d")}</p>
                                <p className="mt-2 text-2xl font-semibold">{formatMetric(stats?.activeUsers7d)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{t("adminDashboard.activity7d")}</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-4">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("adminDashboard.activeUsers30d")}</p>
                                <p className="mt-2 text-2xl font-semibold">{formatMetric(stats?.activeUsers30d)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{t("adminDashboard.activity30d")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/70 shadow-none">
                    <CardContent className="p-4 sm:p-6">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">{t("adminDashboard.pendingWork")}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">{t("adminDashboard.pendingWorkDescription")}</p>
                            </div>
                            <MessageSquare className="h-5 w-5 text-rose-500" />
                        </div>
                        <Link to="/admin/suggestions" className="group flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
                            <div>
                                <p className="font-medium">{t("adminDashboard.pendingSuggestions")}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{t("adminDashboard.reviewSuggestions")}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-semibold">{formatMetric(stats?.pendingSuggestions)}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </section>

            {isSuperAdmin && (
                <section>
                    <Card className="border-destructive/30 bg-destructive/[0.03] shadow-none">
                        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-destructive/10 p-2 text-destructive"><AlertTriangle className="h-5 w-5" /></div>
                                <div>
                                    <h2 className="font-semibold">{t("adminDashboard.milvusResetTitle")}</h2>
                                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("adminDashboard.milvusResetDescription")}</p>
                                </div>
                            </div>
                            <Button variant="danger" className="w-full sm:w-auto" onClick={() => setShowResetDialog(true)} disabled={syncing}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                {t("adminDashboard.milvusResetAction")}
                            </Button>
                        </CardContent>
                    </Card>
                </section>
            )}

            <ConfirmDialog
                isOpen={showResetDialog}
                title={t("adminDashboard.milvusResetConfirmTitle")}
                description={t("adminDashboard.milvusResetConfirmDescription")}
                variant="danger"
                isLoading={syncing}
                confirmText={t("adminDashboard.milvusResetConfirm")}
                cancelText={t("common.cancel")}
                onConfirm={handleFullSync}
                onCancel={() => setShowResetDialog(false)}
            />
        </div>
    );
};
