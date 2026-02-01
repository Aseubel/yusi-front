import { api } from './api';
import type { Diary } from './diary';

export type KeyMode = 'DEFAULT' | 'CUSTOM';

export interface KeySettings {
    keyMode: KeyMode;
    hasCloudBackup: boolean;
    keySalt?: string;
    backupPublicKey?: string;
}

export interface KeyModeUpdateRequest {
    keyMode: KeyMode;
    enableCloudBackup?: boolean;
    encryptedBackupKey?: string;
    keySalt?: string;
}

export interface ReEncryptedDiary {
    diaryId: string;
    encryptedContent: string;
    encryptedTitle?: string;
}

export interface DiaryReEncryptRequest {
    diaries: ReEncryptedDiary[];
    newKeyMode: KeyMode;
    newKeySalt?: string;
    enableCloudBackup?: boolean;
    encryptedBackupKey?: string;
}

/**
 * 获取当前密钥设置
 */
export const getKeySettings = async (): Promise<KeySettings> => {
    const { data } = await api.get('/key/settings');
    return data.data;
};

/**
 * 更新密钥模式（不涉及日记重新加密）
 */
export const updateKeyMode = async (request: KeyModeUpdateRequest): Promise<void> => {
    await api.post('/key/settings', request);
};

/**
 * 获取所有日记用于重新加密
 */
export const getDiariesForReEncrypt = async (): Promise<Diary[]> => {
    const { data } = await api.get('/key/diaries-for-reencrypt');
    return data.data;
};

/**
 * 批量更新重新加密后的日记
 */
export const batchUpdateReEncryptedDiaries = async (request: DiaryReEncryptRequest): Promise<void> => {
    await api.post('/key/reencrypt-diaries', request);
};

/**
 * 管理员获取用户备份密钥
 */
export const getBackupKeyForRecovery = async (targetUserId: string): Promise<string> => {
    const { data } = await api.get(`/key/admin/backup-key/${targetUserId}`);
    return data.data;
};
