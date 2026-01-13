import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEncryptionStore } from '../stores/encryptionStore';
import { useAuthStore } from '../store/authStore';
import '../styles/settings.css';

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

    // 表单状态
    const [activeTab, setActiveTab] = useState<'security' | 'account'>('security');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [showChangeKeyModal, setShowChangeKeyModal] = useState(false);

    // 密码表单
    const [customPassword, setCustomPassword_] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [enableBackup, setEnableBackup] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState('');
    const [rememberPassword, setRememberPassword] = useState(false);

    // 更换密钥表单
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

    const handleSwitchToDefault = async () => {
        if (!window.confirm('确定要切换到默认密钥模式吗？您的所有日记将使用服务端托管的密钥重新加密。')) {
            return;
        }
        try {
            await switchToDefaultMode();
            toast.success('已切换到默认密钥模式');
        } catch {
            toast.error('切换失败，请重试');
        }
    };

    const handleSwitchToCustom = async () => {
        if (customPassword.length < 8) {
            toast.error('密码至少需要8个字符');
            return;
        }
        if (customPassword !== confirmPassword) {
            toast.error('两次输入的密码不一致');
            return;
        }
        if (!window.confirm('警告：自定义密钥模式下，如果您忘记密码且未开启云端备份，您的数据将无法恢复！确定继续吗？')) {
            return;
        }
        try {
            await switchToCustomMode(customPassword, enableBackup);
            toast.success('已切换到自定义密钥模式');
            setShowPasswordModal(false);
            resetPasswordForm();
        } catch {
            toast.error('切换失败，请重试');
        }
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
        <div className="settings-container">
            <div className="settings-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ← 返回
                </button>
                <h1>设置</h1>
            </div>

            <div className="settings-tabs">
                <button
                    className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    🔐 安全与隐私
                </button>
                <button
                    className={`tab ${activeTab === 'account' ? 'active' : ''}`}
                    onClick={() => setActiveTab('account')}
                >
                    👤 账户
                </button>
            </div>

            <div className="settings-content">
                {activeTab === 'security' && (
                    <div className="security-section">
                        <div className="section-card">
                            <h2>🔑 密钥管理</h2>
                            <p className="section-desc">
                                选择如何保护您的日记内容。所有日记都会被加密存储，只有您能解密查看。
                            </p>

                            <div className="key-mode-status">
                                <div className="status-item">
                                    <span className="label">当前模式</span>
                                    <span className={`value mode-${keyMode?.toLowerCase()}`}>
                                        {keyMode === 'DEFAULT' ? '🛡️ 默认密钥' : '🔐 自定义密钥'}
                                    </span>
                                </div>
                                {keyMode === 'CUSTOM' && (
                                    <>
                                        <div className="status-item">
                                            <span className="label">云端备份</span>
                                            <span className={`value ${hasCloudBackup ? 'enabled' : 'disabled'}`}>
                                                {hasCloudBackup ? '✓ 已开启' : '✗ 未开启'}
                                            </span>
                                        </div>
                                        <div className="status-item">
                                            <span className="label">解锁状态</span>
                                            <span className={`value ${cryptoKey ? 'unlocked' : 'locked'}`}>
                                                {cryptoKey ? '🔓 已解锁' : '🔒 已锁定'}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {/* AI 功能可用性提示 */}
                                <div className="status-item">
                                    <span className="label">AI 功能</span>
                                    <span className={`value ${keyMode === 'DEFAULT' || hasCloudBackup ? 'enabled' : 'disabled'}`}>
                                        {keyMode === 'DEFAULT' || hasCloudBackup
                                            ? '✓ 日记搜索/AI 分析可用'
                                            : '✗ 不可用（最高隐私）'}
                                    </span>
                                </div>
                            </div>

                            {/* 最高隐私模式提示 */}
                            {keyMode === 'CUSTOM' && !hasCloudBackup && (
                                <div className="privacy-notice">
                                    <span className="icon">🔒</span>
                                    <div>
                                        <strong>最高隐私模式</strong>
                                        <p>您当前使用自定义密钥且未开启云端备份，这意味着：</p>
                                        <ul>
                                            <li>服务端无法解密您的日记内容</li>
                                            <li>日记搜索和 AI 分析功能不可用</li>
                                            <li>如忘记密码，数据将永久无法恢复</li>
                                        </ul>
                                        <p>如需使用 AI 功能，请开启云端备份。</p>
                                    </div>
                                </div>
                            )}

                            <div className="key-mode-options">
                                {keyMode === 'DEFAULT' ? (
                                    <div className="mode-card active">
                                        <div className="mode-header">
                                            <span className="mode-icon">🛡️</span>
                                            <h3>默认密钥模式</h3>
                                            <span className="badge current">当前</span>
                                        </div>
                                        <p>服务端为您生成并安全存储加密密钥，您无需记忆任何密码。</p>
                                        <ul className="mode-features">
                                            <li>✓ 无需记忆密码</li>
                                            <li>✓ 换设备无缝使用</li>
                                            <li>△ 安全性依赖服务端</li>
                                        </ul>
                                        <button
                                            className="mode-action-btn secondary"
                                            onClick={() => setShowPasswordModal(true)}
                                            disabled={isLoading}
                                        >
                                            切换到自定义密钥
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mode-card active">
                                        <div className="mode-header">
                                            <span className="mode-icon">🔐</span>
                                            <h3>自定义密钥模式</h3>
                                            <span className="badge current">当前</span>
                                        </div>
                                        <p>使用您自己设置的密码加密，即使服务器被攻破也无法解密您的数据。</p>
                                        <ul className="mode-features">
                                            <li>✓ 最高安全级别</li>
                                            <li>✓ 服务端无法解密</li>
                                            <li>△ 需要记忆密码</li>
                                        </ul>
                                        <div className="mode-actions">
                                            {!cryptoKey && (
                                                <button
                                                    className="mode-action-btn primary"
                                                    onClick={() => setShowUnlockModal(true)}
                                                    disabled={isLoading}
                                                >
                                                    🔓 解锁
                                                </button>
                                            )}
                                            <button
                                                className="mode-action-btn secondary"
                                                onClick={() => setShowChangeKeyModal(true)}
                                                disabled={isLoading}
                                            >
                                                更换密码
                                            </button>
                                            <button
                                                className="mode-action-btn tertiary"
                                                onClick={handleSwitchToDefault}
                                                disabled={isLoading}
                                            >
                                                切换到默认密钥
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="security-tips">
                                <h4>💡 安全提示</h4>
                                <ul>
                                    <li>自定义密钥模式下，请务必牢记您的密码</li>
                                    <li>如果忘记密码且未开启云端备份，数据将无法恢复</li>
                                    <li>开启云端备份后，可联系管理员协助找回密码</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="account-section">
                        <div className="section-card">
                            <h2>👤 账户信息</h2>
                            <div className="account-info">
                                <div className="info-item">
                                    <span className="label">用户名</span>
                                    <span className="value">{user?.userName}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">邮箱</span>
                                    <span className="value">{user?.email || '未设置'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">用户ID</span>
                                    <span className="value code">{user?.userId}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 设置自定义密钥模态框 */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>🔐 设置自定义密钥</h2>
                        <p className="modal-desc">
                            设置一个安全的密码来保护您的日记。请牢记此密码，它是解锁您数据的唯一方式。
                        </p>
                        <div className="form-group">
                            <label>密码（至少8个字符）</label>
                            <input
                                type="password"
                                value={customPassword}
                                onChange={e => setCustomPassword_(e.target.value)}
                                placeholder="输入密码"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>确认密码</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="再次输入密码"
                            />
                        </div>
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={enableBackup}
                                    onChange={e => setEnableBackup(e.target.checked)}
                                />
                                开启云端备份
                            </label>
                            <p className="checkbox-hint">
                                开启后可联系管理员找回密码，同时启用日记搜索和 AI 分析功能。
                                不开启则为最高隐私模式，AI 功能将不可用。
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn secondary"
                                onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }}
                            >
                                取消
                            </button>
                            <button
                                className="btn primary"
                                onClick={handleSwitchToCustom}
                                disabled={isLoading}
                            >
                                {isLoading ? '处理中...' : '确认切换'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 解锁模态框 */}
            {showUnlockModal && (
                <div className="modal-overlay" onClick={() => setShowUnlockModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>🔓 解锁日记</h2>
                        <p className="modal-desc">
                            输入您的自定义密码来解锁日记内容。
                        </p>
                        <div className="form-group">
                            <label>密码</label>
                            <input
                                type="password"
                                value={unlockPassword}
                                onChange={e => setUnlockPassword(e.target.value)}
                                placeholder="输入密码"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                            />
                        </div>
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={rememberPassword}
                                    onChange={e => setRememberPassword(e.target.checked)}
                                />
                                记住密码（仅在本设备）
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn secondary"
                                onClick={() => { setShowUnlockModal(false); setUnlockPassword(''); }}
                            >
                                取消
                            </button>
                            <button
                                className="btn primary"
                                onClick={handleUnlock}
                                disabled={isLoading}
                            >
                                {isLoading ? '解锁中...' : '解锁'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 更换密码模态框 */}
            {showChangeKeyModal && (
                <div className="modal-overlay" onClick={() => setShowChangeKeyModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>🔄 更换密码</h2>
                        <p className="modal-desc">
                            更换密码后，所有日记将使用新密码重新加密。此过程可能需要一些时间。
                        </p>
                        <div className="form-group">
                            <label>当前密码</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                placeholder="输入当前密码"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>新密码（至少8个字符）</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="输入新密码"
                            />
                        </div>
                        <div className="form-group">
                            <label>确认新密码</label>
                            <input
                                type="password"
                                value={newConfirmPassword}
                                onChange={e => setNewConfirmPassword(e.target.value)}
                                placeholder="再次输入新密码"
                            />
                        </div>
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={newEnableBackup}
                                    onChange={e => setNewEnableBackup(e.target.checked)}
                                />
                                开启云端备份（可联系管理员找回）
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn secondary"
                                onClick={() => { setShowChangeKeyModal(false); resetChangeKeyForm(); }}
                            >
                                取消
                            </button>
                            <button
                                className="btn primary"
                                onClick={handleChangePassword}
                                disabled={isLoading}
                            >
                                {isLoading ? '处理中...' : '确认更换'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
