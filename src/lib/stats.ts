import { api } from './api';

export interface PlatformStats {
    userCount: number;
    diaryCount: number;
    soulCardCount: number;
    roomCount: number;
    resonanceCount: number;
}

/**
 * 获取平台统计数据
 */
export const getPlatformStats = async (): Promise<PlatformStats> => {
    const response = await api.get('/stats/platform');
    return response.data.data;
};
