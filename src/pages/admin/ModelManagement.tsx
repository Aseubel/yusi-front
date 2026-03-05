import { useCallback, useEffect, useMemo, useState } from "react";
import { modelApi, type ModelRoutingConfig, type ModelRuntimeState, type ModelSelectionStrategy } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import { RefreshCw, Save, Settings2, Activity, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const STRATEGIES: { value: ModelSelectionStrategy; label: string }[] = [
    { value: "ROUND_ROBIN", label: "轮询" },
    { value: "LEAST_LATENCY", label: "最低延迟" },
    { value: "WEIGHTED_RANDOM", label: "权重随机" },
    { value: "FAIL_OVER", label: "故障转移" },
];

export const ModelManagement = () => {
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
            toast.error("加载模型状态失败");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadConfig = useCallback(async () => {
        try {
            const res = await modelApi.getConfig();
            const payload = res.data.data;
            setRawConfig(JSON.stringify(payload, null, 2));
            setConfigLoaded(true);
        } catch {
            toast.error("加载模型配置失败");
        }
    }, []);

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

    useEffect(() => {
        if (!groupName && groups.length > 0) {
            setGroupName(groups[0]);
        }
    }, [groupName, groups]);

    const handleSwitchStrategy = async () => {
        if (!groupName) {
            toast.error("请选择分组");
            return;
        }
        try {
            setSwitching(true);
            await modelApi.switchStrategy(groupName, strategy);
            toast.success("策略已切换");
        } catch {
            toast.error("策略切换失败");
        } finally {
            setSwitching(false);
        }
    };

    const handleSaveConfig = async () => {
        let parsed: ModelRoutingConfig;
        try {
            parsed = JSON.parse(rawConfig) as ModelRoutingConfig;
        } catch {
            toast.error("配置JSON格式不正确");
            return;
        }
        try {
            setConfigSaving(true);
            await modelApi.updateConfig(parsed);
            toast.success("配置已保存并热更新");
            await loadConfig();
        } catch {
            toast.error("保存配置失败");
        } finally {
            setConfigSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">模型治理中心</h1>
                    <p className="text-sm text-muted-foreground mt-1">管理模型状态、策略与全量配置</p>
                </div>
                <Button variant="outline" onClick={loadStates} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    刷新状态
                </Button>
            </div>

            <Card>
                <CardContent className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">分组策略热切换</h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">模型组</label>
                            <Select
                                value={groupName || "NONE"}
                                onValueChange={(value) => setGroupName(value === "NONE" ? "" : value)}
                                options={[
                                    { value: "NONE", label: groups.length ? "请选择分组" : "暂无分组" },
                                    ...groups.map(item => ({ value: item, label: item })),
                                ]}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">策略</label>
                            <Select
                                value={strategy}
                                onValueChange={(value) => setStrategy(value as ModelSelectionStrategy)}
                                options={STRATEGIES.map(item => ({ value: item.value, label: item.label }))}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleSwitchStrategy} disabled={switching || !groupName} className="w-full">
                                <Activity className="w-4 h-4 mr-2" />
                                应用策略
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
                            <h2 className="text-lg font-semibold">模型运行状态</h2>
                        </div>
                        <Badge variant="secondary">{states.length} 个实例</Badge>
                    </div>
                    <div className="overflow-auto border rounded-xl">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40">
                                <tr className="text-left">
                                    <th className="px-3 py-2">实例</th>
                                    <th className="px-3 py-2">模型</th>
                                    <th className="px-3 py-2">可用性</th>
                                    <th className="px-3 py-2">健康度</th>
                                    <th className="px-3 py-2">QPS</th>
                                    <th className="px-3 py-2">延迟(ms)</th>
                                    <th className="px-3 py-2">错误率</th>
                                    <th className="px-3 py-2">状态</th>
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
                                                    可用
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-rose-600">
                                                    <ShieldAlert className="w-4 h-4" />
                                                    不可用
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
                                            暂无状态数据，请先发起真实请求采样
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
                            <h2 className="text-lg font-semibold">全量配置管理</h2>
                            <p className="text-xs text-muted-foreground mt-1">此处支持管理模型、分组、矩阵映射、绑定关系与阈值</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={loadConfig}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                重载
                            </Button>
                            <Button onClick={handleSaveConfig} disabled={configSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                保存并热更新
                            </Button>
                        </div>
                    </div>
                    <Textarea
                        value={rawConfig}
                        onChange={(e) => setRawConfig(e.target.value)}
                        className="min-h-[420px] font-mono text-xs"
                        placeholder="模型路由配置JSON"
                    />
                    <p className="text-xs text-muted-foreground">安全说明：apikey 默认脱敏显示，保留为 ****** 则表示不修改密钥</p>
                </CardContent>
            </Card>
        </div>
    );
};
