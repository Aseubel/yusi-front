import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useEncryptionStore } from '../stores/encryptionStore';
import { useAuthStore } from '../store/authStore';
import { authApi, type User as UserProfile } from '../lib/api';
import { LocationManager } from '../components/LocationManager';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { ArrowLeft, Lock, MapPin, User as UserIcon, Key, Shield, AlertTriangle, Check, X, Pencil, Save, Loader2, Code, Copy, RefreshCw } from 'lucide-react';
import { developerApi } from '../lib/api';
import { validatePasswordStrength } from '../lib/crypto';

export default function Settings() {
    const navigate = useNavigate();
    const { t } = useTranslation();
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
            title: t('settings.modals.switchToDefaultTitle'),
            description: t('settings.modals.switchToDefaultDesc'),
            variant: 'primary',
            action: async () => {
                try {
                    await switchToDefaultMode();
                    toast.success(t('settings.modals.switchSuccess'));
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch {
                    toast.error(t('settings.modals.switchFailed'));
                }
            }
        });
    };

    const handleSwitchToCustom = () => {
        const strength = validatePasswordStrength(customPassword);
        if (!strength.valid) {
            toast.error(t('settings.modals.passwordWeak') || '密码强度不足：' + strength.feedback.join('; '));
            return;
        }
        if (customPassword !== confirmPassword) {
            toast.error(t('settings.modals.passwordMismatch'));
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: t('settings.modals.switchToCustomTitle'),
            description: t('settings.modals.switchToCustomDesc'),
            variant: 'danger',
            action: async () => {
                try {
                    await switchToCustomMode(customPassword, enableBackup);
                    toast.success(t('settings.modals.switchSuccess'));
                    setShowPasswordModal(false);
                    resetPasswordForm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch {
                    toast.error(t('settings.modals.switchFailed'));
                }
            }
        });
    };

    const handleUnlock = async () => {
        if (!unlockPassword) {
            toast.error(t('settings.modals.enterPassword'));
            return;
        }
        try {
            await setCustomPassword(unlockPassword, rememberPassword);
            if (hasActiveKey()) {
                toast.success(t('settings.modals.unlockSuccess'));
                setShowUnlockModal(false);
                setUnlockPassword('');
            } else {
                toast.error(t('settings.modals.passwordError'));
            }
        } catch {
            toast.error(t('settings.modals.unlockFailed'));
        }
    };

    const handleChangePassword = async () => {
        const strength = validatePasswordStrength(newPassword);
        if (!strength.valid) {
            toast.error(t('settings.modals.passwordWeak') || '密码强度不足：' + strength.feedback.join('; '));
            return;
        }
        if (newPassword !== newConfirmPassword) {
            toast.error(t('settings.modals.newPasswordMismatch'));
            return;
        }
        try {
            await changeCustomPassword(oldPassword, newPassword, newEnableBackup);
            toast.success(t('settings.modals.changeSuccess'));
            setShowChangeKeyModal(false);
            resetChangeKeyForm();
        } catch {
            toast.error(t('settings.modals.changeFailed'));
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
                        {t('settings.title')}
                    </h1>
                </div>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {([
                        { id: 'security', label: t('settings.tabs.security'), icon: Lock },
                        { id: 'locations', label: t('settings.tabs.locations'), icon: MapPin },
                        { id: 'account', label: t('settings.tabs.account'), icon: UserIcon },
                        { id: 'developer', label: t('settings.tabs.developer'), icon: Code },
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
                                        <h2 className="text-lg font-semibold">{t('settings.security.keyManagement')}</h2>
                                        <p className="text-sm text-muted-foreground">{t('settings.security.keyManagementDesc')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('settings.security.currentMode')}</span>
                                        <div className="mt-2 flex items-center gap-2 font-medium">
                                            {keyMode === 'DEFAULT' ? <Shield className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                                            {keyMode === 'DEFAULT' ? t('settings.security.defaultKey') : t('settings.security.customKey')}
                                        </div>
                                    </div>

                                    {keyMode === 'CUSTOM' && (
                                        <>
                                            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('settings.security.cloudBackup')}</span>
                                                <div className="mt-2 flex items-center gap-2 font-medium">
                                                    {hasCloudBackup ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-destructive" />}
                                                    {hasCloudBackup ? t('settings.security.enabled') : t('settings.security.disabled')}
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('settings.security.unlockStatus')}</span>
                                                <div className="mt-2 flex items-center gap-2 font-medium">
                                                    {cryptoKey ? <Check className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-destructive" />}
                                                    {cryptoKey ? t('settings.security.unlocked') : t('settings.security.locked')}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('settings.security.aiFeatures')}</span>
                                        <div className="mt-2 flex items-center gap-2 font-medium">
                                            {keyMode === 'DEFAULT' || hasCloudBackup
                                                ? <span className="text-green-500 text-sm">✓ {t('settings.security.available')}</span>
                                                : <span className="text-muted-foreground text-sm">✗ {t('settings.security.unavailable')}</span>}
                                        </div>
                                    </div>
                                </div>

                                {keyMode === 'CUSTOM' && !hasCloudBackup && (
                                    <div className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-4 items-start">
                                        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <strong className="block text-destructive font-medium mb-1">{t('settings.security.warningTitle')}</strong>
                                            <p className="text-muted-foreground mb-2">{t('settings.security.warningDesc')}</p>
                                            <p className="text-muted-foreground">{t('settings.security.warningAIDesc')}</p>
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
                                                        {t('settings.security.defaultModeTitle')}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1">{t('settings.security.defaultModeDesc')}</p>
                                                </div>
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">{t('settings.security.currentUsing')}</span>
                                            </div>
                                            <Button variant="outline" onClick={() => setShowPasswordModal(true)} disabled={isLoading}>
                                                {t('settings.security.switchToCustom')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-5 rounded-xl border border-primary/20 bg-primary/5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-medium flex items-center gap-2">
                                                        <Lock className="w-4 h-4 text-primary" />
                                                        {t('settings.security.customModeTitle')}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1">{t('settings.security.customModeDesc')}</p>
                                                </div>
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">{t('settings.security.currentUsing')}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {!cryptoKey && (
                                                    <Button onClick={() => setShowUnlockModal(true)} disabled={isLoading}>
                                                        {t('settings.security.unlockData')}
                                                    </Button>
                                                )}
                                                <Button variant="outline" onClick={() => setShowChangeKeyModal(true)} disabled={isLoading}>
                                                    {t('settings.security.changePassword')}
                                                </Button>
                                                <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={handleSwitchToDefault} disabled={isLoading}>
                                                    {t('settings.security.switchToDefault')}
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
                                <Button variant="ghost" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>{t('settings.modals.cancel')}</Button>
                                <Button
                                    variant={confirmModal.variant === 'danger' ? 'danger' : 'primary'}
                                    onClick={confirmModal.action}
                                    disabled={isLoading}
                                >
                                    {isLoading ? t('settings.modals.processing') : t('settings.modals.confirm')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {!confirmModal.isOpen && (
                        <div className="bg-card w-full max-w-md border border-border rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                            {/* Password Modal Content */}
                            {showPasswordModal && (
                                <>
                                    <h2 className="text-xl font-bold mb-2">{t('settings.modals.setCustomKey')}</h2>
                                    <p className="text-muted-foreground text-sm mb-6">{t('settings.modals.setCustomKeyDesc')}</p>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">{t('settings.modals.password')}</label>
                                            <Input type="password" value={customPassword} onChange={e => setCustomPassword_(e.target.value)} placeholder={t('settings.modals.passwordPlaceholder')} autoFocus />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">{t('settings.modals.confirmPassword')}</label>
                                            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('settings.modals.confirmPasswordPlaceholder')} />
                                        </div>
                                        <label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                                            <Checkbox checked={enableBackup} onCheckedChange={checked => setEnableBackup(checked === true)} className="mt-1" />
                                            <div className="text-sm">
                                                <span className="font-medium block mb-1">{t('settings.modals.enableCloudBackup')}</span>
                                                <span className="text-muted-foreground text-xs">{t('settings.security.warningAIDesc')}</span>
                                            </div>
                                        </label>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button variant="ghost" onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }}>{t('settings.modals.cancel')}</Button>
                                            <Button onClick={handleSwitchToCustom} disabled={isLoading}>{isLoading ? t('settings.modals.processing') : t('settings.modals.confirm')}</Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Unlock Modal Content */}
                            {showUnlockModal && (
                                <>
                                    <h2 className="text-xl font-bold mb-2">{t('settings.modals.unlockTitle')}</h2>
                                    <p className="text-muted-foreground text-sm mb-6">{t('settings.modals.unlockDesc')}</p>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">{t('settings.modals.password')}</label>
                                            <Input
                                                type="password"
                                                value={unlockPassword}
                                                onChange={e => setUnlockPassword(e.target.value)}
                                                placeholder={t('settings.modals.enterPassword')}
                                                autoFocus
                                                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                            <Checkbox checked={rememberPassword} onCheckedChange={checked => setRememberPassword(checked === true)} />
                                            <div className="text-sm">{t('settings.modals.rememberPassword')}</div>
                                        </label>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button variant="ghost" onClick={() => setShowUnlockModal(false)}>{t('settings.modals.cancel')}</Button>
                                            <Button onClick={handleUnlock} disabled={isLoading}>{isLoading ? t('settings.modals.processing') : t('settings.security.unlockData')}</Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Change Key Modal Content */}
                            {showChangeKeyModal && (
                                <>
                                    <h2 className="text-xl font-bold mb-2">{t('settings.modals.changeKeyTitle')}</h2>
                                    <div className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">{t('settings.modals.oldPassword')}</label>
                                            <Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder={t('settings.modals.oldPasswordPlaceholder')} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">{t('settings.modals.newPassword')}</label>
                                            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('settings.modals.newPasswordPlaceholder')} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">{t('settings.modals.newConfirmPassword')}</label>
                                            <Input type="password" value={newConfirmPassword} onChange={e => setNewConfirmPassword(e.target.value)} placeholder={t('settings.modals.newConfirmPasswordPlaceholder')} />
                                        </div>
                                        <label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                                            <Checkbox checked={newEnableBackup} onCheckedChange={checked => setNewEnableBackup(checked === true)} className="mt-1" />
                                            <div className="text-sm">
                                                <span className="font-medium block mb-1">{t('settings.security.cloudBackup')}</span>
                                                <span className="text-muted-foreground text-xs">{t('settings.security.warningDesc')}</span>
                                            </div>
                                        </label>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button variant="ghost" onClick={() => { setShowChangeKeyModal(false); resetChangeKeyForm(); }}>{t('settings.modals.cancel')}</Button>
                                            <Button onClick={handleChangePassword} disabled={isLoading}>{isLoading ? t('settings.modals.processing') : t('settings.modals.confirm')}</Button>
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
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        userName: user?.userName || '',
        email: user?.email || '',
    });
    const { login, token, refreshToken } = useAuthStore();

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
            toast.error(t('settings.account.errorEmpty'));
            return;
        }

        if (formData.userName.length < 2 || formData.userName.length > 20) {
            toast.error(t('register.errorUsernameLength'));
            return;
        }

        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                toast.error(t('register.errorEmailFormat'));
                return;
            }
        }

        setIsLoading(true);
        try {
            const updatedUser = await authApi.updateUser(formData);
            login(updatedUser, token || '', refreshToken || '');
            toast.success(t('settings.account.updateSuccess'));
            setIsEditing(false);
        } catch (error: unknown) {
            const message =
                typeof error === 'object' && error !== null && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(t('settings.account.updateFailed') + ': ' + (message || t('settings.modals.processing')));
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
                    <h2 className="text-lg font-semibold">{t('settings.account.profile')}</h2>
                </div>
                {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        {t('settings.account.editProfile')}
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isLoading}>
                            {t('settings.account.cancelEdit')}
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {t('settings.account.save')}
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-border/50 items-center">
                    <span className="text-muted-foreground w-20">{t('settings.account.username')}</span>
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
                    <span className="text-muted-foreground w-20">{t('settings.account.email')}</span>
                    {isEditing ? (
                        <Input
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="max-w-[200px]"
                            type="email"
                        />
                    ) : (
                        <span className="font-medium">{user?.email || '-'}</span>
                    )}
                </div>
                <div className="flex justify-between py-3 border-b border-border/50 items-center">
                    <span className="text-muted-foreground w-20">ID</span>
                    <span className="font-mono text-sm bg-secondary px-2 py-1 rounded">{user?.userId}</span>
                </div>
            </div>
        </>
    );
}

function DeveloperSection() {
    const { t } = useTranslation();
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
                toast.success(t('settings.developer.apiKeyRegenerated'));
            }
        } catch (error) {
            toast.error(t('settings.modals.switchFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        toast.success(t('settings.developer.apiKeyCopied'));
    };

    return (
        <>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <Code className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">{t('settings.developer.title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('settings.developer.apiKeyDesc')}</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="p-5 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-medium flex items-center gap-2">
                                <Key className="w-4 h-4 text-primary" />
                                {t('settings.developer.apiKey')}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{t('settings.developer.apiKeyDesc')}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            readOnly
                            type={apiKey ? "password" : "text"}
                            value={apiKey || ''}
                            className="font-mono bg-card"
                            placeholder={apiKey ? undefined : t('settings.developer.apiKeyEmpty')}
                        />
                        <div className="flex gap-2 shrink-0">
                            <Button variant="outline" onClick={handleCopy} disabled={!apiKey}>
                                <Copy className="w-4 h-4 mr-2" />
                                {t('settings.developer.copyApiKey')}
                            </Button>
                            <Button onClick={handleRotate} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                {apiKey ? t('settings.developer.regenerateApiKey') : t('settings.developer.generateApiKey')}
                            </Button>
                        </div>
                    </div>
                    {!apiKey && (
                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                            {t('settings.developer.apiKeyEmptyHint')}
                        </p>
                    )}
                    {apiKey && (
                        <p className="text-xs text-amber-500 mt-3 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {t('settings.developer.apiKeyWarning')}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
