import { api, type ApiResponse } from './api';

export interface MergeSuggestion {
    judgmentId: number;
    entityIdA: number;
    entityIdB: number;
    nameA: string;
    nameB: string;
    type: string;
    score: number;
    reason: string;
    recommendedMasterName: string;
}

export interface UserNotification {
    id: number;
    notificationId: string;
    userId: string;
    type: 'MERGE_SUGGESTION' | 'SYSTEM' | 'REMINDER' | 'ANNOUNCEMENT';
    title: string;
    content: string;
    isRead: boolean;
    refType: string | null;
    refId: string | null;
    extraData: string | null;
    createdAt: string;
    readAt: string | null;
}

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export const lifegraphApi = {
    getMergeSuggestions: (limit = 10) =>
        api.get<ApiResponse<MergeSuggestion[]>>(`/lifegraph/merge-suggestions?limit=${limit}`),
    acceptMerge: (judgmentId: number) =>
        api.post<ApiResponse<void>>(`/lifegraph/merge-suggestions/${judgmentId}/accept`),
    rejectMerge: (judgmentId: number) =>
        api.post<ApiResponse<void>>(`/lifegraph/merge-suggestions/${judgmentId}/reject`),
};

export const notificationApi = {
    getNotifications: (page = 0, size = 20) =>
        api.get<ApiResponse<Page<UserNotification>>>(`/notifications?page=${page}&size=${size}`),
    getNotificationsByType: (type: string) =>
        api.get<ApiResponse<UserNotification[]>>(`/notifications/type/${type}`),
    getUnreadNotifications: () =>
        api.get<ApiResponse<UserNotification[]>>('/notifications/unread'),
    getUnreadCount: () =>
        api.get<ApiResponse<number>>('/notifications/unread/count'),
    markAsRead: (notificationId: number) =>
        api.post<ApiResponse<boolean>>(`/notifications/${notificationId}/read`),
    markAllAsRead: () =>
        api.post<ApiResponse<number>>('/notifications/read-all'),
    deleteNotification: (notificationId: number) =>
        api.delete<ApiResponse<void>>(`/notifications/${notificationId}`),
};
