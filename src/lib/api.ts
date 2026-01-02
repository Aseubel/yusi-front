import axios from "axios";
import { toast } from "sonner";
import { API_BASE } from "../utils";
import { useAuthStore } from "../store/authStore";

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
          const newToken = data.data.accessToken;
          setToken(newToken);
          originalRequest.headers["Authorization"] = "Bearer " + newToken;
          processQueue(null, newToken);
          return api(originalRequest);
        } else {
          throw new Error(data.msg || "Refresh failed");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
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
