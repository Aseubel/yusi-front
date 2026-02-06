import { useCallback, useEffect, useState } from "react";
import { adminApi, type User, type Page } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/Button";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";

export const UserManagement = () => {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);

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

    const handlePermissionChange = async (userId: string, currentLevel: number) => {
        setUpdating(userId);
        const newLevel = currentLevel >= 10 ? 0 : 10; // Toggle between admin and normal
        try {
            await adminApi.updateUserPermission(userId, newLevel);
            toast.success("权限更新成功");
            setUsers(prev => prev.map(u => u.userId === userId ? { ...u, permissionLevel: newLevel } : u));
        } catch (error) {
            console.error(error);
            toast.error("权限更新失败");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="搜索用户名..."
                            className="bg-background border border-input rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="secondary">搜索</Button>
                </form>
            </div>

            <div className="rounded-md border border-border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">用户名</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">权限等级</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">匹配状态</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="h-24 text-center text-muted-foreground">
                                        暂无用户
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-mono text-xs text-muted-foreground">{user.userId.substring(0, 8)}...</td>
                                        <td className="p-4 align-middle font-medium">{user.userName}</td>
                                        <td className="p-4 align-middle">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${user.permissionLevel >= 10 ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                                                {user.permissionLevel >= 10 ? '管理员' : '普通用户'}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">
                                            {user.isMatchEnabled ? (
                                                <span className="text-green-500 text-xs">开启</span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">关闭</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <Button
                                                variant={user.permissionLevel >= 10 ? "danger" : "secondary"}
                                                size="sm"
                                                disabled={updating === user.userId || currentUser?.userId === user.userId}
                                                onClick={() => handlePermissionChange(user.userId, user.permissionLevel ?? 0)}
                                                title={currentUser?.userId === user.userId ? "不能修改自己的权限" : ""}
                                            >
                                                {updating === user.userId && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                {user.permissionLevel >= 10 ? '降级' : '设为管理员'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
                    第 {page + 1} 页 / 共 {totalPages > 0 ? totalPages : 1} 页
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
        </div>
    );
};
