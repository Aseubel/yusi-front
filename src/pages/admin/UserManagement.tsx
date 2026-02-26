import { useCallback, useEffect, useState } from "react";
import { adminApi, type User, type Page } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { toast } from "sonner";
import { Search, Loader2, Shield, UserCircle, ChevronLeft, ChevronRight, Users, Crown, Edit2, X } from "lucide-react";

const PERMISSION_LEVELS = [
    { value: 0, label: "普通用户", description: "无管理权限" },
    { value: 1, label: "初级管理员", description: "基础管理权限" },
    { value: 5, label: "中级管理员", description: "中等管理权限" },
    { value: 10, label: "高级管理员", description: "完整管理权限" },
    { value: 99, label: "超级管理员", description: "最高权限" },
];

const getPermissionLabel = (level: number) => {
    const found = PERMISSION_LEVELS.find(l => l.value === level);
    if (found) return found.label;
    if (level >= 10) return "管理员";
    return "普通用户";
};

const getPermissionColor = (level: number) => {
    if (level >= 99) return "bg-red-500/10 text-red-600 border-red-200";
    if (level >= 10) return "bg-primary/10 text-primary border-primary/20";
    if (level >= 1) return "bg-blue-500/10 text-blue-600 border-blue-200";
    return "bg-muted text-muted-foreground";
};

export const UserManagement = () => {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<number>(0);

    const currentAdminLevel = currentUser?.permissionLevel || 0;

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

    const loadUsers = useCallback(async (targetPage = page, targetSearch = search) => {
        setLoading(true);
        try {
            const res = await adminApi.getUsers(targetPage, 10, targetSearch);
            if (res.data.code === 200) {
                const data = res.data.data as Page<User> | unknown;
                const content = Array.isArray((data as { content?: unknown }).content)
                    ? ((data as { content: User[] }).content)
                    : [];
                setUsers(content);
                const total = getTotalPages(data);
                setTotalPages(total);
            }
        } catch (error) {
            console.error(error);
            toast.error("加载用户列表失败");
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        loadUsers(page, search);
    }, [page, search, loadUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        loadUsers(0, search);
    };

    const openPermissionDialog = (user: User) => {
        setEditingUser(user);
        setSelectedLevel(user.permissionLevel || 0);
    };

    const closePermissionDialog = () => {
        setEditingUser(null);
        setSelectedLevel(0);
    };

    const handlePermissionChange = async () => {
        if (!editingUser) return;

        const targetLevel = editingUser.permissionLevel || 0;

        if (currentUser?.userId === editingUser.userId) {
            toast.error("不能修改自己的权限");
            return;
        }

        if (targetLevel >= currentAdminLevel) {
            toast.error("无法修改权限等级大于等于自己的用户");
            return;
        }

        if (selectedLevel >= currentAdminLevel) {
            toast.error("无法设置权限等级大于等于自己的等级");
            return;
        }

        setUpdating(editingUser.userId);
        try {
            await adminApi.updateUserPermission(editingUser.userId, selectedLevel);
            toast.success("权限更新成功");
            setUsers(prev => prev.map(u => u.userId === editingUser.userId ? { ...u, permissionLevel: selectedLevel } : u));
            closePermissionDialog();
        } catch (error: unknown) {
            console.error(error);
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "权限更新失败");
        } finally {
            setUpdating(null);
        }
    };

    const canModifyUser = (user: User) => {
        if (currentUser?.userId === user.userId) return false;
        const targetLevel = user.permissionLevel || 0;
        return targetLevel < currentAdminLevel;
    };

    const getAvailableLevels = () => {
        return PERMISSION_LEVELS.filter(l => l.value < currentAdminLevel);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        用户管理
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        管理系统用户权限 · 当前等级:
                        <Badge variant="outline" className={`ml-2 ${getPermissionColor(currentAdminLevel)}`}>
                            <Crown className="w-3 h-3 mr-1" />
                            {getPermissionLabel(currentAdminLevel)}
                        </Badge>
                    </p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="搜索用户名..."
                            className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="secondary" className="shrink-0">搜索</Button>
                </form>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : users.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Users className="h-12 w-12 mb-4 opacity-30" />
                        <p className="text-sm">暂无用户数据</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="h-12 px-6 text-left font-medium text-muted-foreground">用户ID</th>
                                        <th className="h-12 px-6 text-left font-medium text-muted-foreground">用户名</th>
                                        <th className="h-12 px-6 text-left font-medium text-muted-foreground">权限等级</th>
                                        <th className="h-12 px-6 text-left font-medium text-muted-foreground">匹配状态</th>
                                        <th className="h-12 px-6 text-right font-medium text-muted-foreground">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{user.userId.substring(0, 8)}...</td>
                                            <td className="px-6 py-4 font-medium">{user.userName}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={getPermissionColor(user.permissionLevel || 0)}>
                                                    {(user.permissionLevel || 0) >= 10 && <Shield className="w-3 h-3 mr-1" />}
                                                    {getPermissionLabel(user.permissionLevel || 0)}
                                                    <span className="ml-1 text-xs opacity-60">Lv.{user.permissionLevel || 0}</span>
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs ${user.isMatchEnabled ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isMatchEnabled ? 'bg-green-500' : 'bg-muted-foreground/50'}`} />
                                                    {user.isMatchEnabled ? '已开启' : '已关闭'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!canModifyUser(user)}
                                                    onClick={() => openPermissionDialog(user)}
                                                    title={!canModifyUser(user) ? "无法修改此用户权限" : "修改权限"}
                                                >
                                                    <Edit2 className="w-3 h-3 mr-1" />
                                                    修改权限
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="md:hidden space-y-3">
                        {users.map((user) => (
                            <Card key={user.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <UserCircle className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{user.userName}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{user.userId.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={getPermissionColor(user.permissionLevel || 0)}>
                                            {(user.permissionLevel || 0) >= 10 && <Shield className="w-3 h-3 mr-1" />}
                                            {getPermissionLabel(user.permissionLevel || 0)}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.isMatchEnabled ? 'bg-green-500' : 'bg-muted-foreground/50'}`} />
                                            匹配: {user.isMatchEnabled ? '开启' : '关闭'}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!canModifyUser(user)}
                                            onClick={() => openPermissionDialog(user)}
                                        >
                                            修改权限
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
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
                        <span>{totalPages}</span>
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

            {editingUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                    onClick={closePermissionDialog}
                >
                    <div
                        className="bg-card w-full max-w-md border border-border rounded-2xl shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/10 text-primary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">修改用户权限</h2>
                                    <p className="text-sm text-muted-foreground">{editingUser.userName}</p>
                                </div>
                            </div>
                            <button
                                onClick={closePermissionDialog}
                                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">选择权限等级</label>
                                <div className="space-y-2">
                                    {getAvailableLevels().map((level) => (
                                        <label
                                            key={level.value}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedLevel === level.value
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:bg-muted/50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedLevel === level.value ? 'border-primary' : 'border-input'}`}>
                                                    {selectedLevel === level.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="permissionLevel"
                                                    value={level.value}
                                                    checked={selectedLevel === level.value}
                                                    onChange={() => setSelectedLevel(level.value)}
                                                    className="sr-only"
                                                />
                                                <div>
                                                    <div className="font-medium text-sm">{level.label}</div>
                                                    <div className="text-xs text-muted-foreground">{level.description}</div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs">Lv.{level.value}</Badge>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {(editingUser.permissionLevel || 0) >= currentAdminLevel && (
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    无法修改权限等级大于等于自己的用户
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 p-6 border-t border-border">
                            <Button variant="outline" onClick={closePermissionDialog}>取消</Button>
                            <Button
                                onClick={handlePermissionChange}
                                disabled={updating !== null || selectedLevel >= currentAdminLevel}
                                isLoading={updating !== null}
                            >
                                确认修改
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
