import { useCallback, useEffect, useMemo, useState } from "react";
import { modelApi, type ModelRoutingConfig, type ModelRuntimeState, type ModelSelectionStrategy } from "../../lib/api";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import { RefreshCw, Save, Settings2, Activity, ShieldAlert, ShieldCheck, Copy, Download } from "lucide-react";
import { toast } from "sonner";

const STRATEGIES = (t: (key: string) => string) => [
    { value: "ROUND_ROBIN", label: t('modelManagement.strategy.roundRobin') },
    { value: "LEAST_LATENCY", label: t('modelManagement.strategy.leastLatency') },
    { value: "WEIGHTED_RANDOM", label: t('modelManagement.strategy.weightedRandom') },
    { value: "FAIL_OVER", label: t('modelManagement.strategy.failOver') },
];

export const ModelManagement = () => {
    const { t } = useTranslation();
    const [states, setStates] = useState<ModelRuntimeState[]>([]);
    const [loading, setLoading] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [configSaving, setConfigSaving] = useState(false);
    const [rawConfig, setRawConfig] = useState("");
    const [configLoaded, setConfigLoaded] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [strategy, setStrategy] = useState<ModelSelectionStrategy>("ROUND_ROBIN");

    const loadStates = useCallback(async () => {
        try {
            setLoading(true);
            const res = await modelApi.states();
            setStates(res.data.data || []);
        } catch {
            toast.error(t('modelManagement.loadStateFailed'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const loadConfig = useCallback(async () => {
        try {
            const res = await modelApi.getConfig();
            const payload = res.data.data;
            setRawConfig(JSON.stringify(payload, null, 2));
            setConfigLoaded(true);
        } catch {
            toast.error(t('modelManagement.loadConfigFailed'));
        }
    }, [t]);

    useEffect(() => {
        loadStates();
        loadConfig();
    }, [loadConfig, loadStates]);

    const groups = useMemo(() => {
        if (!configLoaded) {
            return [];
        }
        try {
            const parsed = JSON.parse(rawConfig) as ModelRoutingConfig;
            return Object.keys(parsed.groups || {});
        } catch {
            return [];
        }
    }, [configLoaded, rawConfig]);

    const parsedConfig = useMemo((): ModelRoutingConfig | null => {
        if (!configLoaded || !rawConfig) {
            return null;
        }
        try {
            return JSON.parse(rawConfig) as ModelRoutingConfig;
        } catch {
            return null;
        }
    }, [configLoaded, rawConfig]);

    useEffect(() => {
        if (!groupName && groups.length > 0) {
            setGroupName(groups[0]);
        }
    }, [groupName, groups]);

    useEffect(() => {
        if (groupName && parsedConfig?.groups?.[groupName]?.strategy) {
            setStrategy(parsedConfig.groups[groupName].strategy);
        }
    }, [groupName, parsedConfig]);

    const handleSwitchStrategy = async () => {
        if (!groupName) {
            toast.error(t('modelManagement.selectGroup'));
            return;
        }
        try {
            setSwitching(true);
            await modelApi.switchStrategy(groupName, strategy);
            toast.success(t('modelManagement.strategySwitched'));
        } catch {
            toast.error(t('modelManagement.strategySwitchFailed'));
        } finally {
            setSwitching(false);
        }
    };

    const handleSaveConfig = async () => {
        let parsed: ModelRoutingConfig;
        try {
            parsed = JSON.parse(rawConfig) as ModelRoutingConfig;
        } catch {
            toast.error(t('modelManagement.invalidJson'));
            return;
        }
        try {
            setConfigSaving(true);
            await modelApi.updateConfig(parsed);
            toast.success(t('modelManagement.configSaved'));
            await loadConfig();
        } catch {
            toast.error(t('modelManagement.saveConfigFailed'));
        } finally {
            setConfigSaving(false);
        }
    };

    const handleCopyConfig = async () => {
        try {
            await navigator.clipboard.writeText(rawConfig);
            toast.success(t('modelManagement.configCopied'));
        } catch {
            toast.error(t('modelManagement.copyFailed'));
        }
    };

    const handleExportConfig = () => {
        const blob = new Blob([rawConfig], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `model-routing-config-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(t('modelManagement.configExported'));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('modelManagement.title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t('modelManagement.subtitle')}</p>
                </div>
                <Button variant="outline" onClick={loadStates} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    {t('common.refresh')}
                </Button>
            </div>

            <Card>
                <CardContent className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">{t('modelManagement.strategyHotSwap')}</h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">{t('modelManagement.modelGroup')}</label>
                            <Select
                                value={groupName || "NONE"}
                                onValueChange={(value) => setGroupName(value === "NONE" ? "" : value)}
                                options={[
                                    { value: "NONE", label: groups.length ? t('modelManagement.selectGroup') : t('modelManagement.noGroups') },
                                    ...groups.map(item => ({ value: item, label: item })),
                                ]}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">{t('modelManagement.strategyLabel')}</label>
                            <Select
                                value={strategy}
                                onValueChange={(value) => setStrategy(value as ModelSelectionStrategy)}
                                options={STRATEGIES(t).map(item => ({ value: item.value, label: item.label }))}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleSwitchStrategy} disabled={switching || !groupName} className="w-full">
                                <Activity className="w-4 h-4 mr-2" />
                                {t('modelManagement.applyStrategy')}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-semibold">{t('modelManagement.runtimeStatus')}</h2>
                        </div>
                        <Badge variant="secondary">{t('modelManagement.instances', { count: states.length })}</Badge>
                    </div>
                    <div className="overflow-auto border rounded-xl">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40">
                                <tr className="text-left">
                                    <th className="px-3 py-2">{t('modelManagement.table.instance')}</th>
                                    <th className="px-3 py-2">{t('modelManagement.table.model')}</th>
                                    <th className="px-3 py-2">{t('modelManagement.table.availability')}</th>
                                    <th className="px-3 py-2">{t('modelManagement.table.healthScore')}</th>
                                    <th className="px-3 py-2">{t('modelManagement.table.qps')}</th>
                                    <th className="px-3 py-2">{t('modelManagement.table.latency')}</th>
                                    <th className="px-3 py-2">{t('modelManagement.table.errorRate')}</th>
                                    <th className="px-3 py-2">{t('modelManagement.table.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {states.map(item => (
                                    <tr key={item.instanceId} className="border-t">
                                        <td className="px-3 py-2 font-medium">{item.instanceId}</td>
                                        <td className="px-3 py-2">{item.modelName || "-"}</td>
                                        <td className="px-3 py-2">
                                            {item.available ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600">
                                                    <ShieldCheck className="w-4 h-4" />
                                                    {t('modelManagement.available')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-rose-600">
                                                    <ShieldAlert className="w-4 h-4" />
                                                    {t('modelManagement.unavailable')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">{(item.healthScore * 100).toFixed(1)}%</td>
                                        <td className="px-3 py-2">{item.qps.toFixed(2)}</td>
                                        <td className="px-3 py-2">{item.avgLatencyMs.toFixed(1)}</td>
                                        <td className="px-3 py-2">{(item.errorRate * 100).toFixed(1)}%</td>
                                        <td className="px-3 py-2">
                                            <Badge variant={item.phase === "UP" ? "secondary" : "destructive"}>
                                                {item.phase}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {!states.length && (
                                    <tr>
                                        <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                                            {t('modelManagement.noStatusData')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 md:p-6 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">{t('modelManagement.configManagement')}</h2>
                            <p className="text-xs text-muted-foreground mt-1">{t('modelManagement.configDescription')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleCopyConfig} disabled={!rawConfig}>
                                <Copy className="w-4 h-4 mr-2" />
                                {t('modelManagement.copyConfig')}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportConfig} disabled={!rawConfig}>
                                <Download className="w-4 h-4 mr-2" />
                                {t('modelManagement.exportConfig')}
                            </Button>
                            <Button variant="outline" size="sm" onClick={loadConfig}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {t('modelManagement.reload')}
                            </Button>
                            <Button size="sm" onClick={handleSaveConfig} disabled={configSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                {t('modelManagement.saveAndReload')}
                            </Button>
                        </div>
                    </div>
                    <Textarea
                        value={rawConfig}
                        onChange={(e) => setRawConfig(e.target.value)}
                        className="min-h-[420px] font-mono text-xs"
                        placeholder={t('modelManagement.configPlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground">{t('modelManagement.securityNote')}</p>
                </CardContent>
            </Card>
        </div>
    );
};
