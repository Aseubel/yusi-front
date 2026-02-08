import { useCallback, useEffect, useMemo, useState } from "react";
import { promptApi, type PromptTemplate, type Page } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Loader2, Plus, RefreshCw, Search, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_FORM: Omit<PromptTemplate, "id"> = {
    name: "",
    template: "",
    version: "v1",
    active: true,
    scope: "global",
    locale: "zh-CN",
    description: "",
    tags: "",
    isDefault: false,
    priority: 0,
};

const SCOPE_OPTIONS = ["global", "diary", "match", "room", "plaza", "admin"];

export const PromptManagement = () => {
    const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [searchName, setSearchName] = useState("");
    const [scope, setScope] = useState("");
    const [locale, setLocale] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: "",
        description: "",
        action: () => { },
    });

    const activeParam = useMemo(() => {
        if (activeFilter === "all") return undefined;
        return activeFilter === "active";
    }, [activeFilter]);

    const loadPrompts = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await promptApi.search({
                name: searchName || undefined,
                scope: scope || undefined,
                locale: locale || undefined,
                active: activeParam,
                page,
                size,
            });
            const payload = data.data as Page<PromptTemplate>;
            setPrompts(payload.content);
            setTotalPages(payload.totalPages);
        } catch {
            toast.error("加载Prompt失败");
        } finally {
            setLoading(false);
        }
    }, [activeParam, locale, page, scope, searchName, size]);

    useEffect(() => {
        loadPrompts();
    }, [loadPrompts]);

    const resetForm = () => {
        setForm(DEFAULT_FORM);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (item: PromptTemplate) => {
        setEditingId(item.id);
        setForm({
            name: item.name,
            template: item.template,
            version: item.version,
            active: item.active,
            scope: item.scope,
            locale: item.locale,
            description: item.description || "",
            tags: item.tags || "",
            isDefault: item.isDefault,
            priority: item.priority,
        });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.template.trim()) {
            toast.error("名称和模板内容不能为空");
            return;
        }
        try {
            setSaving(true);
            const payload = {
                ...form,
                name: form.name.trim(),
                template: form.template.trim(),
            };
            if (editingId) {
                await promptApi.update(editingId, payload);
                toast.success("更新成功");
            } else {
                await promptApi.create(payload);
                toast.success("创建成功");
            }
            resetForm();
            loadPrompts();
        } catch {
            toast.error("保存失败");
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async (id: number) => {
        try {
            await promptApi.activate(id);
            toast.success("已激活");
            loadPrompts();
        } catch {
            toast.error("激活失败");
        }
    };

    const handleDelete = async (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "删除Prompt",
            description: "删除后不可恢复，确认继续吗？",
            action: async () => {
                try {
                    await promptApi.delete(id);
                    toast.success("已删除");
                    loadPrompts();
                } catch {
                    toast.error("删除失败");
                } finally {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            },
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        loadPrompts();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Prompt管理</h1>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        新建Prompt
                    </Button>
                    <Button variant="outline" onClick={loadPrompts}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        刷新
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder="搜索名称..."
                        className="pl-8 w-52"
                    />
                </div>
                <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className="bg-background border border-input rounded-md px-3 py-2 text-sm"
                >
                    <option value="">全部范围</option>
                    {SCOPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <Input
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    placeholder="语言，如 zh-CN"
                    className="w-36"
                />
                <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "inactive")}
                    className="bg-background border border-input rounded-md px-3 py-2 text-sm"
                >
                    <option value="all">全部状态</option>
                    <option value="active">启用</option>
                    <option value="inactive">停用</option>
                </select>
                <Button type="submit" variant="secondary">搜索</Button>
            </form>

            {showForm && (
                <div className="rounded-lg border border-border bg-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="font-semibold">{editingId ? "编辑Prompt" : "新建Prompt"}</div>
                        <Button variant="ghost" size="icon" onClick={resetForm}>
                            <XCircle className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">名称</label>
                            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">版本</label>
                            <Input value={form.version} onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">范围</label>
                            <select
                                value={form.scope}
                                onChange={(e) => setForm((prev) => ({ ...prev, scope: e.target.value }))}
                                className="bg-background border border-input rounded-md px-3 py-2 text-sm w-full"
                            >
                                {SCOPE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">语言</label>
                            <Input value={form.locale} onChange={(e) => setForm((prev) => ({ ...prev, locale: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">标签</label>
                            <Input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">优先级</label>
                            <Input
                                type="number"
                                value={form.priority}
                                onChange={(e) => setForm((prev) => ({ ...prev, priority: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm text-muted-foreground">描述</label>
                            <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">模板内容</label>
                        <Textarea
                            value={form.template}
                            onChange={(e) => setForm((prev) => ({ ...prev, template: e.target.value }))}
                            className="min-h-[200px]"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                            />
                            启用
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.isDefault}
                                onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                            />
                            设为默认
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={resetForm}>取消</Button>
                        <Button onClick={handleSubmit} isLoading={saving} disabled={!form.name.trim() || !form.template.trim()}>
                            {editingId ? "保存修改" : "创建Prompt"}
                        </Button>
                    </div>
                </div>
            )}

            <div className="rounded-md border border-border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors">
                                <th className="h-12 px-4 align-middle font-medium">名称</th>
                                <th className="h-12 px-4 align-middle font-medium">范围</th>
                                <th className="h-12 px-4 align-middle font-medium">语言</th>
                                <th className="h-12 px-4 align-middle font-medium">版本</th>
                                <th className="h-12 px-4 align-middle font-medium">状态</th>
                                <th className="h-12 px-4 align-middle font-medium">默认</th>
                                <th className="h-12 px-4 align-middle font-medium">优先级</th>
                                <th className="h-12 px-4 align-middle font-medium text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                                        加载中...
                                    </td>
                                </tr>
                            ) : prompts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                        暂无数据
                                    </td>
                                </tr>
                            ) : (
                                prompts.map((item) => (
                                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[280px]">{item.description || "-"}</div>
                                        </td>
                                        <td className="p-4 align-middle">{item.scope}</td>
                                        <td className="p-4 align-middle">{item.locale}</td>
                                        <td className="p-4 align-middle">{item.version}</td>
                                        <td className="p-4 align-middle">
                                            {item.active ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600">
                                                    <CheckCircle className="w-4 h-4" />启用
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                    <XCircle className="w-4 h-4" />停用
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">{item.isDefault ? "是" : "否"}</td>
                                        <td className="p-4 align-middle">{item.priority}</td>
                                        <td className="p-4 align-middle text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleActivate(item.id)}>
                                                <CheckCircle className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-end space-x-2 py-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                >
                    上一页
                </Button>
                <div className="text-sm text-muted-foreground">
                    第 {page + 1} / {Math.max(totalPages, 1)} 页
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                    disabled={page + 1 >= totalPages || loading}
                >
                    下一页
                </Button>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                description={confirmDialog.description}
                variant="danger"
                confirmText="确认删除"
                cancelText="取消"
                onConfirm={confirmDialog.action}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};
