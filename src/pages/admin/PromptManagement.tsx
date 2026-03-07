import { useCallback, useEffect, useMemo, useState } from "react";
import { promptApi, type PromptTemplate, type Page } from "../../lib/api";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Checkbox } from "../../components/ui/Checkbox";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import { Loader2, Plus, RefreshCw, Search, Pencil, Trash2, CheckCircle, XCircle, Filter, X } from "lucide-react";
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

const SCOPE_OPTIONS = (t: (key: string) => string) => [
    { value: "global", label: t('promptManagement.scope.global') },
    { value: "diary", label: t('promptManagement.scope.diary') },
    { value: "match", label: t('promptManagement.scope.match') },
    { value: "room", label: t('promptManagement.scope.room') },
    { value: "plaza", label: t('promptManagement.scope.plaza') },
    { value: "admin", label: t('promptManagement.scope.admin') },
];

const LOCALE_OPTIONS = (t: (key: string) => string) => [
    { value: "ALL", label: t('promptManagement.locale.all') },
    { value: "zh-CN", label: t('promptManagement.locale.zh') },
    { value: "en-US", label: t('promptManagement.locale.en') },
];

const STATUS_OPTIONS = (t: (key: string) => string) => [
    { value: "all", label: t('promptManagement.status.all') },
    { value: "active", label: t('promptManagement.status.active') },
    { value: "inactive", label: t('promptManagement.status.inactive') },
];

export const PromptManagement = () => {
    const { t } = useTranslation();
    const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [searchName, setSearchName] = useState("");
    const [scope, setScope] = useState("");
    const [locale, setLocale] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
    const [showForm, setShowForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
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

    const hasActiveFilters = searchName || scope || locale || activeFilter !== "all";

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
            setPrompts(payload.content || []);
            setTotalPages(payload.totalPages || 1);
            setTotalElements(payload.totalElements || 0);
        } catch {
            toast.error(t('promptManagement.loadFailed'));
            setPrompts([]);
            setTotalPages(1);
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

    const clearFilters = () => {
        setSearchName("");
        setScope("");
        setLocale("");
        setActiveFilter("all");
        setPage(0);
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
            toast.error(t('promptManagement.nameAndTemplateRequired'));
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
                toast.success(t('promptManagement.updateSuccess'));
            } else {
                await promptApi.create(payload);
                toast.success(t('promptManagement.createSuccess'));
            }
            resetForm();
            loadPrompts();
        } catch {
            toast.error(t('promptManagement.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async (id: number) => {
        try {
            await promptApi.activate(id);
            toast.success(t('promptManagement.activated'));
            loadPrompts();
        } catch {
            toast.error(t('promptManagement.activateFailed'));
        }
    };

    const handleDelete = async (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: t('promptManagement.deleteTitle'),
            description: t('promptManagement.deleteDescription'),
            action: async () => {
                try {
                    await promptApi.delete(id);
                    toast.success(t('promptManagement.deleted'));
                    loadPrompts();
                } catch {
                    toast.error(t('promptManagement.deleteFailed'));
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
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('promptManagement.title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t('promptManagement.totalRecords', { count: totalElements })}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('promptManagement.newPrompt')}
                    </Button>
                    <Button variant="outline" onClick={loadPrompts}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('common.refresh')}
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            placeholder={t('promptManagement.searchPlaceholder')}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">{t('common.search')}</Button>
                </form>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? "bg-primary/10" : ""}
                >
                    <Filter className="w-4 h-4 mr-2" />
                    {t('common.filter')}
                    {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                            {[searchName && t('promptManagement.filter.name'), scope && t('promptManagement.filter.scope'), locale && t('promptManagement.filter.locale'), activeFilter !== "all" && t('promptManagement.filter.status')].filter(Boolean).length}
                        </Badge>
                    )}
                </Button>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="w-4 h-4 mr-1" />
                        {t('promptManagement.clear')}
                    </Button>
                )}
            </div>

            {showFilters && (
                <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{t('promptManagement.filter.scope')}</label>
                        <Select
                            value={scope || "ALL"}
                            onChange={(e) => { setScope(e.target.value === "ALL" ? "" : e.target.value); setPage(0); }}
                            className="min-w-[120px]"
                        >
                            <option value="ALL">{t('promptManagement.scope.all')}</option>
                            {SCOPE_OPTIONS(t).map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{t('promptManagement.filter.locale')}</label>
                        <Select
                            value={locale || "ALL"}
                            onChange={(e) => { setLocale(e.target.value === "ALL" ? "" : e.target.value); setPage(0); }}
                            className="min-w-[120px]"
                        >
                            {LOCALE_OPTIONS(t).map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{t('promptManagement.filter.status')}</label>
                        <Select
                            value={activeFilter}
                            onChange={(e) => { setActiveFilter(e.target.value as "all" | "active" | "inactive"); setPage(0); }}
                            className="min-w-[120px]"
                        >
                            {STATUS_OPTIONS(t).map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="rounded-lg border border-border bg-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="font-semibold text-lg">{editingId ? t('promptManagement.editPrompt') : t('promptManagement.newPrompt')}</div>
                        <Button variant="ghost" size="icon" onClick={resetForm}>
                            <XCircle className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">{t('promptManagement.form.name')} *</label>
                            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">{t('promptManagement.form.version')}</label>
                            <Input value={form.version} onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">{t('promptManagement.form.scope')}</label>
                            <Select
                                value={form.scope}
                                onChange={(e) => setForm((prev) => ({ ...prev, scope: e.target.value }))}
                            >
                                {SCOPE_OPTIONS(t).map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">{t('promptManagement.form.locale')}</label>
                            <Input value={form.locale} onChange={(e) => setForm((prev) => ({ ...prev, locale: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">{t('promptManagement.form.tags')}</label>
                            <Input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder={t('promptManagement.form.tagsPlaceholder')} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">{t('promptManagement.form.priority')}</label>
                            <Input
                                type="number"
                                value={form.priority}
                                onChange={(e) => setForm((prev) => ({ ...prev, priority: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm text-muted-foreground">{t('promptManagement.form.description')}</label>
                            <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">{t('promptManagement.form.template')} *</label>
                        <Textarea
                            value={form.template}
                            onChange={(e) => setForm((prev) => ({ ...prev, template: e.target.value }))}
                            className="min-h-[200px] font-mono text-sm"
                            placeholder={t('promptManagement.form.templatePlaceholder')}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                                checked={form.active}
                                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked === true }))}
                            />
                            {t('promptManagement.form.enable')}
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                                checked={form.isDefault}
                                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isDefault: checked === true }))}
                            />
                            {t('promptManagement.form.setDefault')}
                        </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={resetForm}>{t('common.cancel')}</Button>
                        <Button onClick={handleSubmit} isLoading={saving} disabled={!form.name.trim() || !form.template.trim()}>
                            {editingId ? t('promptManagement.form.saveChanges') : t('promptManagement.form.createPrompt')}
                        </Button>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="bg-muted/50">
                            <tr className="border-b transition-colors">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">{t('promptManagement.table.name')}</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">{t('promptManagement.table.scope')}</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">{t('promptManagement.table.locale')}</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">{t('promptManagement.table.version')}</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">{t('promptManagement.table.status')}</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">{t('promptManagement.table.isDefault')}</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">{t('promptManagement.table.priority')}</th>
                                <th className="h-12 px-4 align-middle font-medium text-right">{t('promptManagement.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                        <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                                        {t('common.loading')}
                                    </td>
                                </tr>
                            ) : prompts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                        {t('promptManagement.noData')}
                                    </td>
                                </tr>
                            ) : (
                                prompts.map((item) => (
                                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/30">
                                        <td className="p-4 align-middle">
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[280px]">{item.description || "-"}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge variant="outline" className="font-normal">
                                                {SCOPE_OPTIONS(t).find(o => o.value === item.scope)?.label || item.scope}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">{item.locale}</td>
                                        <td className="p-4 align-middle text-muted-foreground">{item.version}</td>
                                        <td className="p-4 align-middle">
                                            {item.active ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm">
                                                    <CheckCircle className="w-4 h-4" />{t('promptManagement.status.active')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                                                    <XCircle className="w-4 h-4" />{t('promptManagement.status.inactive')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">
                                            {item.isDefault ? (
                                                <Badge variant="secondary" className="text-xs">{t('promptManagement.default')}</Badge>
                                            ) : "-"}
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">{item.priority}</td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title={t('common.edit')}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleActivate(item.id)} title={t('promptManagement.activate')}>
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} title={t('common.delete')} className="text-destructive hover:text-destructive">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                    >
                        {t('promptManagement.prevPage')}
                    </Button>
                    <div className="text-sm text-muted-foreground tabular-nums min-w-[80px] text-center">
                        <span className="font-medium text-foreground">{page + 1}</span>
                        <span className="mx-1">/</span>
                        <span>{totalPages}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                        disabled={page + 1 >= totalPages || loading}
                    >
                        {t('promptManagement.nextPage')}
                    </Button>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                description={confirmDialog.description}
                variant="danger"
                confirmText={t('promptManagement.confirmDelete')}
                cancelText={t('common.cancel')}
                onConfirm={confirmDialog.action}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};
