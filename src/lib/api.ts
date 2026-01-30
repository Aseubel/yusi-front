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

        const { refreshToken, setToken, logout } = useAuthStore.getState();

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
              },
            }
          );

          if (data.code === 200) {
            const { accessToken, refreshToken: newRefreshToken } = data.data;
            setToken(accessToken, newRefreshToken);
            originalRequest.headers["Authorization"] = "Bearer " + accessToken;
            processQueue(null, accessToken);
            return api(originalRequest);
          } else {
            throw new Error(data.msg || "Refresh failed");
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
};

export const matchApi = {
  updateSettings: (data: { enabled: boolean; intent?: string }) =>
    api.post("/match/settings", data),
  getRecommendations: () => api.get("/match/recommendations"),
  handleAction: (matchId: number, action: 1 | 2) =>
    api.post(`/match/${matchId}/action`, { action }),
};

export const soulChatApi = {
  sendMessage: (data: { matchId: number; content: string }) =>
    api.post("/soul-chat/send", data),
  getHistory: (matchId: number) =>
    api.get(`/soul-chat/history?matchId=${matchId}`),
  markAsRead: (matchId: number) => api.post("/soul-chat/read", { matchId }),
  getUnreadCount: () => api.get("/soul-chat/unread/count"),
};
