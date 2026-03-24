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

// ===================== Graph 3D Types =====================

export interface GraphNode {
    id: number;
    displayName: string;
    type: string;
    mentionCount: number;
    summary: string | null;
    props: string | null;
    version: number;
    // 3D position (set by force-graph)
    x?: number;
    y?: number;
    z?: number;
    fx?: number;
    fy?: number;
    fz?: number;
}

export interface GraphLink {
    id: number;
    sourceId: number;
    targetId: number;
    type: string;
    confidence: number;
    weight: number;
    version: number;
    // force-graph uses source/target
    source?: number | GraphNode;
    target?: number | GraphNode;
}

export interface GraphSnapshot {
    nodes: GraphNode[];
    links: GraphLink[];
    totalNodeCount: number;
}

// ===================== API methods =====================

export const lifegraphApi = {
    getMergeSuggestions: (limit = 10) =>
        api.get<ApiResponse<MergeSuggestion[]>>(`/lifegraph/merge-suggestions?limit=${limit}`),
    acceptMerge: (judgmentId: number) =>
        api.post<ApiResponse<void>>(`/lifegraph/merge-suggestions/${judgmentId}/accept`),
    rejectMerge: (judgmentId: number) =>
        api.post<ApiResponse<void>>(`/lifegraph/merge-suggestions/${judgmentId}/reject`),

    // Graph data
    getGraphData: (page = 0, size = 200) =>
        api.get<ApiResponse<GraphSnapshot>>(`/lifegraph/graph?page=${page}&size=${size}`),
    getGraphBfs: (centerId: number, depth = 2, maxNodes = 500) =>
        api.get<ApiResponse<GraphSnapshot>>(`/lifegraph/graph/bfs?centerId=${centerId}&depth=${depth}&maxNodes=${maxNodes}`),

    // Entity CRUD
    createEntity: (data: { displayName: string; type: string; summary?: string; props?: string }) =>
        api.post<ApiResponse<GraphNode>>('/lifegraph/entities', data),
    updateEntity: (id: number, data: { displayName?: string; summary?: string; props?: string; version: number }) =>
        api.put<ApiResponse<GraphNode>>(`/lifegraph/entities/${id}`, data),
    deleteEntity: (id: number) =>
        api.delete<ApiResponse<void>>(`/lifegraph/entities/${id}`),

    // Relation CRUD
    createRelation: (data: { sourceId: number; targetId: number; type: string; confidence?: number; weight?: number }) =>
        api.post<ApiResponse<GraphLink>>('/lifegraph/relations', data),
    updateRelation: (id: number, data: { type?: string; confidence?: number; weight?: number; version: number }) =>
        api.put<ApiResponse<GraphLink>>(`/lifegraph/relations/${id}`, data),
    deleteRelation: (id: number) =>
        api.delete<ApiResponse<void>>(`/lifegraph/relations/${id}`),
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
