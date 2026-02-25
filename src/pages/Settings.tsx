import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEncryptionStore } from '../stores/encryptionStore';
import { useAuthStore } from '../store/authStore';
import { authApi, type User as UserProfile } from '../lib/api';
import { LocationManager } from '../components/LocationManager';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Lock, MapPin, User as UserIcon, Key, Shield, AlertTriangle, Check, X, Pencil, Save, Loader2, Code, Copy, RefreshCw } from 'lucide-react';
import { developerApi } from '../lib/api';

export default function Settings() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        keyMode,
        hasCloudBackup,
        isLoading,
        error,
        initialize,
        hasActiveKey,
        switchToDefaultMode,
        switchToCustomMode,
        changeCustomPassword,
        setCustomPassword,
        cryptoKey,
    } = useEncryptionStore();

    // Tabs
    const [activeTab, setActiveTab] = useState<'security' | 'locations' | 'account' | 'developer'>('security');

    // Modals
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [showChangeKeyModal, setShowChangeKeyModal] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        action: () => Promise<void>;
        variant?: 'primary' | 'danger';
    }>({
        isOpen: false,
        title: '',
        description: '',
        action: async () => { },
        variant: 'primary'
    });

    // Password Form
    const [customPassword, setCustomPassword_] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [enableBackup, setEnableBackup] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState('');
    const [rememberPassword, setRememberPassword] = useState(false);

    // Change Key Form
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newConfirmPassword, setNewConfirmPassword] = useState('');
    const [newEnableBackup, setNewEnableBackup] = useState(false);

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const handleSwitchToDefault = () => {
        setConfirmModal({
            isOpen: true,
            title: '切换到默认密钥模式',
            description: '确定要切换到默认密钥模式吗？您的所有日记将使用服务端托管的密钥重新加密。',
            variant: 'primary',
            action: async () => {
                try {
                    await switchToDefaultMode();
                    toast.success('已切换到默认密钥模式');
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch {
                    toast.error('切换失败，请重试');
                }
            }
        });
    };

    const handleSwitchToCustom = () => {
        if (customPassword.length < 8) {
            toast.error('密码至少需要8个字符');
            return;
        }
        if (customPassword !== confirmPassword) {
            toast.error('两次输入的密码不一致');
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: '确认切换模式',
            description: '警告：自定义密钥模式下，如果您忘记密码且未开启云端备份，您的数据将无法恢复！确定继续吗？',
            variant: 'danger',
            action: async () => {
                try {
                    await switchToCustomMode(customPassword, enableBackup);
                    toast.success('已切换到自定义密钥模式');
                    setShowPasswordModal(false);
                    resetPasswordForm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch {
                    toast.error('切换失败，请重试');
                }
            }
        });
    };

    const handleUnlock = async () => {
        if (!unlockPassword) {
            toast.error('请输入密码');
            return;
        }
        try {
            await setCustomPassword(unlockPassword, rememberPassword);
            if (hasActiveKey()) {
                toast.success('解锁成功');
                setShowUnlockModal(false);
                setUnlockPassword('');
            } else {
                toast.error('密码错误');
            }
        } catch {
            toast.error('解锁失败');
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 8) {
            toast.error('新密码至少需要8个字符');
            return;
        }
        if (newPassword !== newConfirmPassword) {
            toast.error('两次输入的新密码不一致');
            return;
        }
        try {
            await changeCustomPassword(oldPassword, newPassword, newEnableBackup);
            toast.success('密码更换成功');
            setShowChangeKeyModal(false);
            resetChangeKeyForm();
        } catch {
            toast.error('密码更换失败，请检查旧密码是否正确');
        }
    };

    const resetPasswordForm = () => {
        setCustomPassword_('');
        setConfirmPassword('');
        setEnableBackup(false);
    };

    const resetChangeKeyForm = () => {
        setOldPassword('');
        setNewPassword('');
        setNewConfirmPassword('');
        setNewEnableBackup(false);
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 pb-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        设置
                    </h1>
                </div>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {([
                        { id: 'security', label: '安全与隐私', icon: Lock },
                        { id: 'locations', label: '地点管理', icon: MapPin },
                        { id: 'account', label: '账户', icon: UserIcon },
                        { id: 'developer', label: '开发者', icon: Code },
                    ] as const).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                : 'bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold">密钥管理</h2>
                                        <p className="text-sm text-muted-foreground">管理您的加密方式和数据安全</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">当前模式</span>
                                        <div className="mt-2 flex items-center gap-2 font-medium">
                                            {keyMode === 'DEFAULT' ? <Shield className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                                            {keyMode === 'DEFAULT' ? '默认密钥' : '自定义密钥'}
                                        </div>
                                    </div>

                                    {keyMode === 'CUSTOM' && (
                                        <>
                                            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">云端备份</span>
                                                <div className="mt-2 flex items-center gap-2 font-medium">
                                                    {hasCloudBackup ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-destructive" />}
                                                    {hasCloudBackup ? '已开启' : '未开启'}
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">解锁状态</span>
                                                <div className="mt-2 flex items-center gap-2 font-medium">
                                                    {cryptoKey ? <Check className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-destructive" />}
                                                    {cryptoKey ? '已解锁' : '已锁定'}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">AI 功能</span>
                                        <div className="mt-2 flex items-center gap-2 font-medium">
                                            {keyMode === 'DEFAULT' || hasCloudBackup
                                                ? <span className="text-green-500 text-sm">✓ 可用</span>
                                                : <span className="text-muted-foreground text-sm">✗ 不可用</span>}
                                        </div>
                                    </div>
                                </div>

                                {keyMode === 'CUSTOM' && !hasCloudBackup && (
                                    <div className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-4 items-start">
                                        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <strong className="block text-destructive font-medium mb-1">最高隐私模式警告</strong>
                                            <p className="text-muted-foreground mb-2">您当前未开启云端备份，若忘记密码，数据将永久丢失。</p>
                                            <p className="text-muted-foreground">如需使用 AI 分析功能，请开启云端备份。</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {keyMode === 'DEFAULT' ? (
                                        <div className="p-5 rounded-xl border border-primary/20 bg-primary/5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-medium flex items-center gap-2">
                                                        <Shield className="w-4 h-4 text-primary" />
                                                        默认密钥模式
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1">服务端为您托管密钥，无需记忆密码，适合大多数用户。</p>
                                                </div>
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">当前使用</span>
                                            </div>
                                            <Button variant="outline" onClick={() => setShowPasswordModal(true)} disabled={isLoading}>
                                                切换到自定义密钥
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-5 rounded-xl border border-primary/20 bg-primary/5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-medium flex items-center gap-2">
                                                        <Lock className="w-4 h-4 text-primary" />
                                                        自定义密钥模式
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1">您完全掌控密钥，服务端无法解密，安全性最高。</p>
                                                </div>
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">当前使用</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {!cryptoKey && (
                                                    <Button onClick={() => setShowUnlockModal(true)} disabled={isLoading}>
                                                        解锁数据
                                                    </Button>
                                                )}
                                                <Button variant="outline" onClick={() => setShowChangeKeyModal(true)} disabled={isLoading}>
                                                    更换密码
                                                </Button>
                                                <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={handleSwitchToDefault} disabled={isLoading}>
                                                    切换回默认模式
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'locations' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <LocationManager />
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ProfileSection user={user} />
                        </div>
                    )}

                    {activeTab === 'developer' && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <DeveloperSection />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals - Using fixed positioning with backdrop blur */}
            {(showPasswordModal || showUnlockModal || showChangeKeyModal || confirmModal.isOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">

                    {/* Confirmation Modal */}
                    {confirmModal.isOpen && (
                        <div className="bg-card w-full max-w-md border border-border rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`p-2 rounded-full ${confirmModal.variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">{confirmModal.title}</h2>
                                    <p className="text-sm text-muted-foreground mt-1">{confirmModal.description}</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="ghost" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>取消</Button>
                                <Button
                                    variant={confirmModal.variant === 'danger' ? 'danger' : 'primary'}
                                    onClick={confirmModal.action}
                                    disabled={isLoading}
                                >
                                    {isLoading ? '处理中...' : '确认'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {!confirmModal.isOpen && (
                        <div className="bg-card w-full max-w-md border border-border rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                            {/* Password Modal Content */}
                            {showPasswordModal && (
                                <>
                                    <h2 className="text-xl font-bold mb-2">设置自定义密钥</h2>
                                    <p className="text-muted-foreground text-sm mb-6">设置一个安全的密码来保护您的日记。请务必牢记。</p>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">密码</label>
                                            <Input type="password" value={customPassword} onChange={e => setCustomPassword_(e.target.value)} placeholder="至少8位字符" autoFocus />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">确认密码</label>
                                            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="再次输入密码" />
                                        </div>
                                        <label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                                            <input type="checkbox" checked={enableBackup} onChange={e => setEnableBackup(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                            <div className="text-sm">
                                                <span className="font-medium block mb-1">开启云端备份（推荐）</span>
                                                <span className="text-muted-foreground text-xs">允许找回密码，并启用 AI 分析功能。</span>
                                            </div>
                                        </label>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button variant="ghost" onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }}>取消</Button>
                                            <Button onClick={handleSwitchToCustom} disabled={isLoading}>{isLoading ? '处理中...' : '确认切换'}</Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Unlock Modal Content */}
                            {showUnlockModal && (
                                <>
                                    <h2 className="text-xl font-bold mb-2">解锁日记</h2>
                                    <p className="text-muted-foreground text-sm mb-6">输入您的自定义密码来解锁内容。</p>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">密码</label>
                                            <Input
                                                type="password"
                                                value={unlockPassword}
                                                onChange={e => setUnlockPassword(e.target.value)}
                                                placeholder="输入密码"
                                                autoFocus
                                                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                            <input type="checkbox" checked={rememberPassword} onChange={e => setRememberPassword(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                                            <div className="text-sm">记住密码（仅限本次会话）</div>
                                        </label>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button variant="ghost" onClick={() => setShowUnlockModal(false)}>取消</Button>
                                            <Button onClick={handleUnlock} disabled={isLoading}>{isLoading ? '解锁中...' : '解锁'}</Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Change Key Modal Content */}
                            {showChangeKeyModal && (
                                <>
                                    <h2 className="text-xl font-bold mb-2">更换密码</h2>
                                    <div className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">旧密码</label>
                                            <Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="输入当前密码" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">新密码</label>
                                            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="至少8位字符" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">确认新密码</label>
                                            <Input type="password" value={newConfirmPassword} onChange={e => setNewConfirmPassword(e.target.value)} placeholder="再次输入新密码" />
                                        </div>
                                        <label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                                            <input type="checkbox" checked={newEnableBackup} onChange={e => setNewEnableBackup(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                            <div className="text-sm">
                                                <span className="font-medium block mb-1">保持云端备份</span>
                                                <span className="text-muted-foreground text-xs">建议开启以防数据丢失。</span>
                                            </div>
                                        </label>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button variant="ghost" onClick={() => { setShowChangeKeyModal(false); resetChangeKeyForm(); }}>取消</Button>
                                            <Button onClick={handleChangePassword} disabled={isLoading}>{isLoading ? '处理中...' : '确认更换'}</Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

type ProfileSectionProps = {
    user: UserProfile | null;
};

function ProfileSection({ user }: ProfileSectionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        userName: user?.userName || '',
        email: user?.email || '',
    });
    const { login } = useAuthStore();

    useEffect(() => {
        if (user) {
            setFormData({
                userName: user.userName || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (!formData.userName.trim()) {
            toast.error('用户名不能为空');
            return;
        }

        if (formData.userName.length < 2 || formData.userName.length > 20) {
            toast.error('用户名长度必须在2-20个字符之间');
            return;
        }

        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                toast.error('邮箱格式不正确');
                return;
            }
        }

        setIsLoading(true);
        try {
            const updatedUser = await authApi.updateUser(formData);
            login(updatedUser, localStorage.getItem('access_token') || '', localStorage.getItem('refresh_token') || '');
            toast.success('个人信息已更新');
            setIsEditing(false);
        } catch (error: unknown) {
            const message =
                typeof error === 'object' && error !== null && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error('更新失败: ' + (message || '请稍后重试'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <UserIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold">账户信息</h2>
                </div>
                {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        编辑
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isLoading}>
                            取消
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            保存
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-border/50 items-center">
                    <span className="text-muted-foreground w-20">用户名</span>
                    {isEditing ? (
                        <Input
                            value={formData.userName}
                            onChange={e => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                            className="max-w-[200px]"
                        />
                    ) : (
                        <span className="font-medium">{user?.userName}</span>
                    )}
                </div>
                <div className="flex justify-between py-3 border-b border-border/50 items-center">
                    <span className="text-muted-foreground w-20">邮箱</span>
                    {isEditing ? (
                        <Input
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="max-w-[200px]"
                            type="email"
                        />
                    ) : (
                        <span className="font-medium">{user?.email || '未设置'}</span>
                    )}
                </div>
                <div className="flex justify-between py-3 border-b border-border/50 items-center">
                    <span className="text-muted-foreground w-20">用户ID</span>
                    <span className="font-mono text-sm bg-secondary px-2 py-1 rounded">{user?.userId}</span>
                </div>
            </div>
        </>
    );
}

function DeveloperSection() {
    const [apiKey, setApiKey] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await developerApi.getConfig();
                if (data?.data?.apiKey) {
                    setApiKey(data.data.apiKey);
                }
            } catch (error) {
                console.error("Failed to load developer config:", error);
            }
        };
        fetchConfig();
    }, []);

    const handleRotate = async () => {
        setIsLoading(true);
        try {
            const data = await developerApi.rotateApiKey();
            if (data?.data?.apiKey) {
                setApiKey(data.data.apiKey);
                toast.success('已生成新的 API Key');
            }
        } catch (error) {
            toast.error('生成失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        toast.success('API Key 已复制到剪贴板');
    };

    return (
        <>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <Code className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">开发者设置</h2>
                    <p className="text-sm text-muted-foreground">管理供外部应用（如 MCP 客户端）调用的凭证</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="p-5 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-medium flex items-center gap-2">
                                <Key className="w-4 h-4 text-primary" />
                                个人 API Key
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">用于认证客户端对您个人数据的访问（请妥善保管）。</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            readOnly
                            type="password"
                            value={apiKey || '••••••••••••••••••••••••'}
                            className="font-mono bg-card"
                            placeholder="尚未生成 API Key"
                        />
                        <div className="flex gap-2 shrink-0">
                            <Button variant="outline" onClick={handleCopy} disabled={!apiKey}>
                                <Copy className="w-4 h-4 mr-2" />
                                复制
                            </Button>
                            <Button onClick={handleRotate} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                {apiKey ? '重新生成' : '生成 Key'}
                            </Button>
                        </div>
                    </div>
                    {apiKey && (
                        <p className="text-xs text-amber-500 mt-3 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            重要提示：该凭证可访问您的个人日记及生活图谱。如遇泄露请立即重新生成。
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
