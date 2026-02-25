import axios from "axios";
import { toast } from "sonner";
import { API_BASE } from "../utils";
import { useAuthStore } from "../store/authStore";

export const ErrorCode = {
  SUCCESS: 200,
  SYSTEM_ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,

  TOKEN_EXPIRED: 40101,
  TOKEN_INVALID: 40102,
  TOKEN_MISSING: 40103,
  DEVICE_LIMIT_EXCEEDED: 40104,

  PARAM_ERROR: 400,
  RESOURCE_NOT_FOUND: 404,

  // AI errors
  AI_REQUEST_IN_PROGRESS: 42901,
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export interface ApiResponse<T = unknown> {
  code: number;
  info: string;
  data: T;
}

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      if (token) {
        prom.resolve(token);
      }
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => {
    const data = res.data;
    // Check for business logic errors where HTTP status is 200 but backend 'code' is not 200
    if (data && typeof data.code === "number" && data.code !== 200) {
      const msg = data.info || "系统繁忙，请稍后再试";
      toast.error(msg);
      return Promise.reject(new Error(msg));
    }
    return res;
  },
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      const code = err.response?.data?.code;

      if (code === ErrorCode.TOKEN_EXPIRED) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers["Authorization"] = "Bearer " + token;
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const { refreshToken, token, setToken, logout } = useAuthStore.getState();

        try {
          if (!refreshToken) {
            throw new Error("No refresh token");
          }

          const { data } = await axios.post(
            API_BASE + "/user/refresh",
            {},
            {
              headers: {
                "X-Refresh-Token": refreshToken,
                "X-Old-Access-Token": token || "",
              },
            }
          );

          if (data.code === 200) {
            const { accessToken, refreshToken: newRefreshToken } = data.data;
            setToken(accessToken, newRefreshToken);
            originalRequest.headers["Authorization"] = "Bearer " + accessToken;
            processQueue(null, accessToken);
            console.log("Token refreshed:", accessToken);
            return api(originalRequest);
          } else {
            console.log("Refresh failed:", data);
            throw new Error(data.info || "Refresh failed");
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          logout();
          localStorage.removeItem('yusi-user-id');
          toast.error("登录已过期，请重新登录");
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      } else if (code === ErrorCode.TOKEN_INVALID || code === ErrorCode.TOKEN_MISSING) {
        useAuthStore.getState().logout();
        localStorage.removeItem('yusi-user-id');
        toast.error("登录已失效，请重新登录");
        return Promise.reject(err);
      }
    }

    const msg = err.response?.data?.info || err.message;
    toast.error(msg);
    return Promise.reject(err);
  }
);

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  password: string;
  email: string;
}

export const authApi = {
  login: (data: LoginRequest) => api.post("/user/login", data),
  register: (data: RegisterRequest) => api.post("/user/register", data),
  updateUser: (data: { userName?: string; email?: string }) =>
    api.post<User>("/user/update", data).then((res) => res.data),
};

export const matchApi = {
  updateSettings: (data: { enabled: boolean; intent?: string }) =>
    api.post("/match/settings", data),
  getRecommendations: () => api.get("/match/recommendations"),
  handleAction: (matchId: number, action: 1 | 2) =>
    api.post(`/match/${matchId}/action`, { action }),
  getStatus: () => api.get("/match/status"),
};

export const soulChatApi = {
  sendMessage: (data: { matchId: number; content: string }) =>
    api.post("/soul-chat/send", data),
  getHistory: (matchId: number) =>
    api.get(`/soul-chat/history?matchId=${matchId}`),
  markAsRead: (matchId: number) => api.post("/soul-chat/read", { matchId }),
  getUnreadCount: () => api.get("/soul-chat/unread/count"),
};

export interface AdminStats {
  totalUsers: number;
  totalDiaries: number;
  pendingScenarios: number;
  totalRooms: number;
}

export interface User {
  id: number;
  userId: string;
  userName: string;
  email?: string;
  isMatchEnabled: boolean;
  matchIntent?: string;
  permissionLevel: number;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  submitterId: string;
  status: number;
  rejectReason?: string;
  createTime?: string;
  updateTime?: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const adminApi = {
  getStats: () => api.get<ApiResponse<AdminStats>>("/admin/stats"),
  getUsers: (page = 0, size = 10, search = "") => api.get<ApiResponse<Page<User>>>(`/admin/users?page=${page}&size=${size}&search=${search}`),
  updateUserPermission: (userId: string, level: number) => api.post(`/admin/users/${userId}/permission`, { level }),
  getPendingScenarios: (page = 0, size = 10) => api.get<ApiResponse<Page<Scenario>>>(`/admin/scenarios/pending?page=${page}&size=${size}`),
  getAllScenarios: (page = 0, size = 10, status?: number) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status !== undefined) params.append('status', String(status));
    return api.get<ApiResponse<Page<Scenario>>>(`/admin/scenarios?${params.toString()}`);
  },
  auditScenario: (scenarioId: string, approved: boolean, rejectReason?: string) =>
    api.post(`/admin/scenarios/${scenarioId}/audit`, { approved, rejectReason }),
  fullSyncEmbeddings: () => api.post<ApiResponse<number>>("/admin/embeddings/full-sync"),
};

export interface PromptTemplate {
  id: number;
  name: string;
  template: string;
  version: string;
  active: boolean;
  scope: string;
  locale: string;
  description?: string;
  tags?: string;
  isDefault: boolean;
  priority: number;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const promptApi = {
  getPrompt: (name: string, locale = "zh-CN") => api.get<ApiResponse<string>>(`/prompt/${name}?locale=${locale}`),
  search: (params: { name?: string; scope?: string; locale?: string; active?: boolean; page?: number; size?: number }) =>
    api.get<ApiResponse<Page<PromptTemplate>>>(`/prompt/search`, { params }),
  create: (data: Partial<PromptTemplate>) => api.post<ApiResponse<PromptTemplate>>(`/prompt/save`, data),
  update: (id: number, data: Partial<PromptTemplate>) => api.put<ApiResponse<PromptTemplate>>(`/prompt/${id}`, data),
  activate: (id: number) => api.post<ApiResponse<void>>(`/prompt/${id}/activate`),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/prompt/${id}`),
};

export interface DeveloperConfigVO {
  apiKey: string;
}

export const developerApi = {
  getConfig: () => api.get<ApiResponse<DeveloperConfigVO>>("/developer/config").then((res) => res.data),
  rotateApiKey: () => api.post<ApiResponse<DeveloperConfigVO>>("/developer/config/api-key").then((res) => res.data),
};
