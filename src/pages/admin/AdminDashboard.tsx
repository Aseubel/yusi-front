import { useEffect, useState } from "react";
import { adminApi, type AdminStats } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { Users, Book, FileText, LayoutGrid, TrendingUp, Activity, Sparkles, Shield, RefreshCw } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { toast } from "sonner";

export const AdminDashboard = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const { user } = useAuthStore();
    const isSuperAdmin = user?.permissionLevel !== undefined && user.permissionLevel >= 99;

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await adminApi.getStats();
                if (res.data.code === 200) {
                    setStats(res.data.data);
                }
            } catch (error) {
                console.error("Failed to load stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const handleFullSync = async () => {
        try {
            setSyncing(true);
            const res = await adminApi.fullSyncEmbeddings();
            if (res.data.code === 200) {
                toast.success(`全量同步已触发，将重置 ${res.data.data} 个任务`);
            }
        } catch (error) {
            console.error("Full sync failed", error);
        } finally {
            setSyncing(false);
        }
    };

    const statItems = [
        { title: "总用户数", value: stats?.totalUsers ?? 0, icon: Users, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500/10" },
        { title: "总日记数", value: stats?.totalDiaries ?? 0, icon: Book, color: "from-emerald-500 to-green-500", bgColor: "bg-emerald-500/10" },
        { title: "待审核场景", value: stats?.pendingScenarios ?? 0, icon: FileText, color: "from-orange-500 to-amber-500", bgColor: "bg-orange-500/10" },
        { title: "总房间数", value: stats?.totalRooms ?? 0, icon: LayoutGrid, color: "from-violet-500 to-purple-500", bgColor: "bg-violet-500/10" },
    ];

    const quickActions = [
        { title: "用户管理", description: "管理用户权限", icon: Shield, href: "/admin/users", color: "text-blue-500" },
        { title: "场景审核", description: "审核待处理场景", icon: FileText, href: "/admin/scenarios", color: "text-orange-500" },
        { title: "Prompt管理", description: "配置AI提示词", icon: Sparkles, href: "/admin/prompts", color: "text-violet-500" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 animate-pulse text-primary" />
                    <p className="text-muted-foreground text-sm">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">管理仪表盘</h1>
                <p className="text-muted-foreground text-sm">欢迎回来，查看系统运行状态</p>
            </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {statItems.map((item, index) => (
                    <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs md:text-sm text-muted-foreground font-medium">{item.title}</p>
                                    <p className="text-2xl md:text-3xl font-bold">{item.value.toLocaleString()}</p>
                                </div>
                                <div className={`p-2 md:p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className={`w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br ${item.color} bg-clip-text text-transparent`} style={{ color: item.color.includes('blue') ? '#3b82f6' : item.color.includes('emerald') ? '#10b981' : item.color.includes('orange') ? '#f97316' : '#8b5cf6' }} />
                                </div>
                            </div>
                            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-semibold">快速操作</h2>
                        </div>
                        <div className="grid gap-3">
                            {quickActions.map((action, index) => (
                                <a
                                    key={index}
                                    href={action.href}
                                    className="flex items-center gap-4 p-3 md:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                                >
                                    <div className="p-2 rounded-lg bg-background">
                                        <action.icon className={`w-5 h-5 ${action.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm md:text-base">{action.title}</p>
                                        <p className="text-xs md:text-sm text-muted-foreground truncate">{action.description}</p>
                                    </div>
                                    <svg className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                            ))}
                            {isSuperAdmin && (
                                <button
                                    onClick={handleFullSync}
                                    disabled={syncing}
                                    className="flex items-center gap-4 p-3 md:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="p-2 rounded-lg bg-background">
                                        <RefreshCw className={`w-5 h-5 text-red-500 ${syncing ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="font-medium text-sm md:text-base">全量同步</p>
                                        <p className="text-xs md:text-sm text-muted-foreground truncate">清空Milvus并重置任务（超级管理员）</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-semibold">系统状态</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm">API 服务</span>
                                </div>
                                <span className="text-xs text-green-500 font-medium">正常运行</span>
                            </div>
                            <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm">数据库连接</span>
                                </div>
                                <span className="text-xs text-green-500 font-medium">正常</span>
                            </div>
                            <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm">Redis 缓存</span>
                                </div>
                                <span className="text-xs text-green-500 font-medium">正常</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
