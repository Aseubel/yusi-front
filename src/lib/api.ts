import axios from "axios";
import { toast } from "sonner";
import { API_BASE } from "../utils";
import { useAuthStore } from "../stores/authStore";
import { jwtDecode } from "jwt-decode";
import i18n from "../i18n";

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

export interface ChatHistoryMessage {
  role: string;
  content: string;
  images?: string[];
  createdAt?: string;
}

export interface MatchRecommendation {
  matchId: number;
  connectionId?: number | null;
  connectionStatus?: string | null;
  counterpartUserId: string;
  counterpartUserName?: string | null;
  recommendationLetter: string;
  counterpartLetter?: string | null;
  reason?: string | null;
  timingReason?: string | null;
  iceBreaker?: string | null;
  score?: number | null;
  myStatus: number;
  counterpartStatus: number;
  matched: boolean;
  iceBreakers?: string[];
  suggestedScenario?: string | null;
  createTime: string;
  updateTime?: string | null;
}

export interface MatchStatus {
  enabled: boolean;
  intent: string;
  diaryCount: number;
  pendingMatches: number;
  completedMatches: number;
  nextMatchTime: string;
  canEnable: boolean;
  enableHint: string | null;
}

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];
const recentErrorToasts = new Map<string, number>();

const showErrorToast = (message: string, id?: string) => {
  const now = Date.now();
  const key = id || message;
  const lastShown = recentErrorToasts.get(key);

  if (lastShown && now - lastShown < 2500) {
    return;
  }

  recentErrorToasts.set(key, now);
  toast.error(message, id ? { id } : undefined);
};

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

// Check if token is expired or about to expire (within 60 seconds)
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    const currentTime = Date.now() / 1000;
    return (decoded.exp ?? 0) < currentTime + 60;
  } catch {
    return true;
  }
};

const refreshAuthToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

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
      processQueue(null, accessToken);
      return accessToken;
    } else {
      throw new Error(data.info || "Refresh failed");
    }
  } catch (err) {
    processQueue(err, null);
    logout();
    localStorage.removeItem('yusi-user-id');
    showErrorToast(i18n.t('api.authExpired'), "auth-expired");
    throw err;
  } finally {
    isRefreshing = false;
  }
};

api.interceptors.request.use(async (config) => {
  let { token } = useAuthStore.getState();
  
  if (token) {
    if (isTokenExpired(token)) {
      try {
        token = await refreshAuthToken();
      } catch (error) {
        return Promise.reject(error);
      }
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    const data = res.data;
    // Check for business logic errors where HTTP status is 200 but backend 'code' is not 200
    if (data && typeof data.code === "number" && data.code !== 200) {
        const msg = data.info || i18n.t('common.tryAgain');
      showErrorToast(msg);
      return Promise.reject(new Error(msg));
    }
    return res;
  },
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      const code = err.response?.data?.code;

      if (code === ErrorCode.TOKEN_EXPIRED) {
        originalRequest._retry = true;
        try {
          const newToken = await refreshAuthToken();
          originalRequest.headers["Authorization"] = "Bearer " + newToken;
          return api(originalRequest);
        } catch (refreshErr) {
          return Promise.reject(refreshErr);
        }
      } else if (code === ErrorCode.TOKEN_INVALID || code === ErrorCode.TOKEN_MISSING) {
        useAuthStore.getState().logout();
        localStorage.removeItem('yusi-user-id');
        showErrorToast(i18n.t('api.authInvalid'), "auth-invalid");
        return Promise.reject(err);
      }
    }

    const msg = err.response?.data?.info || err.message;
    showErrorToast(msg);
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
  code: string;
}

export interface ResetPasswordRequest {
  userName: string;
  code: string;
  newPassword: string;
}

export const authApi = {
  login: (data: LoginRequest) => api.post("/user/login", data),
  register: (data: RegisterRequest) => api.post("/user/register", data),
  sendRegisterCode: (email: string) => api.post("/user/register/send-code", { email }),
  updateUser: (data: { userName?: string; email?: string }) =>
    api.post<ApiResponse<User>>("/user/update", data).then((res) => res.data.data),
  sendForgotPasswordCode: (userName: string) => api.post<string>("/user/forgot-password/send-code", { userName }).then((res) => res.data),
  resetPassword: (data: ResetPasswordRequest) => api.post("/user/forgot-password/reset", data),
  logout: () => api.post("/user/logout"),
};

export const matchApi = {
  updateSettings: (data: { enabled: boolean; intent?: string }) =>
    api.post<ApiResponse<User>>("/match/settings", data),
  getRecommendations: () => api.get<ApiResponse<MatchRecommendation[]>>("/match/recommendations"),
  handleAction: (matchId: number, action: 1 | 2) =>
    api.post<ApiResponse<MatchRecommendation>>(`/match/${matchId}/action`, { action }),
  submitFeedback: (matchId: number, category: "LIKE" | "DEEP_INTERACTION" | "DO_NOT_CONTINUE") =>
    api.post<ApiResponse<MatchRecommendation>>(`/match/${matchId}/feedback`, { category }),
  endConnection: (matchId: number, reasonCategory?: string) =>
    api.post<ApiResponse<MatchRecommendation>>(`/match/${matchId}/end`, { reasonCategory }),
  reportConnection: (matchId: number, reasonCategory = "UNSAFE") =>
    api.post<ApiResponse<MatchRecommendation>>(`/match/${matchId}/report`, { reasonCategory }),
  blockConnection: (matchId: number, reasonCategory = "USER_BLOCKED") =>
    api.post<ApiResponse<MatchRecommendation>>(`/match/${matchId}/block`, { reasonCategory }),
  getStatus: () => api.get<ApiResponse<MatchStatus>>("/match/status"),
};

export const soulChatApi = {
  sendMessage: (data: { matchId: number; content: string }) =>
    api.post("/soul-chat/send", data),
  getHistory: (matchId: number) =>
    api.get(`/soul-chat/history?matchId=${matchId}`),
  markAsRead: (matchId: number) => api.post("/soul-chat/read", { matchId }),
  getUnreadCount: () => api.get("/soul-chat/unread/count"),
};

export const chatApi = {
  getHistory: () => api.get<ApiResponse<ChatHistoryMessage[]>>("/ai/chat/history"),
  injectGreeting: (notificationId: number) =>
    api.post<ApiResponse<void>>("/ai/chat/inject-greeting", null, { params: { notificationId } }),
};

export interface AdminStats {
  totalUsers: number;
  totalDiaries: number;
  pendingScenarios: number;
  totalRooms: number;
  pendingSuggestions: number;
  activeUsersToday: number;
  activeUsers7d: number;
  activeUsers30d: number;
}

export interface User {
  userId: string;
  userName: string;
  email?: string;
  isMatchEnabled: boolean;
  matchIntent?: string;
  keyMode?: string;
  hasCloudBackup?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export interface AdminUser extends User {
  id: number;
  permissionLevel: number;
}

export interface AdminPermission {
  permissionLevel: number;
}

export type AnnouncementAudience = "ALL";

export interface AdminAnnouncement {
  announcementId: string;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  status: "PUBLISHED";
  publishedBy: string;
  publishedAt: string;
  createdAt: string;
  recipientCount?: number | null;
}

export interface SecurityAuditEvent {
  eventId: string;
  action: string;
  actionKey: string;
  actorType: "USER" | "ADMIN" | "SYSTEM";
  actorUserId?: string | null;
  subjectUserId?: string | null;
  resourceType: string;
  resourceId?: string | null;
  outcome: "SUCCESS" | "DENIED" | "FAILURE";
  reasonCode?: string | null;
  details: Record<string, string>;
  occurredAt: string;
}

export interface SecurityAuditQuery {
  page?: number;
  size?: number;
  action?: string;
  outcome?: SecurityAuditEvent["outcome"];
  resourceType?: string;
  userId?: string;
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
  getCurrentPermission: () => api.get<ApiResponse<AdminPermission>>("/admin/me"),
  getUsers: (page = 0, size = 10, search = "") => api.get<ApiResponse<Page<AdminUser>>>(`/admin/users?page=${page}&size=${size}&search=${search}`),
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
  deregisterUser: (userId: string) => api.post<ApiResponse<void>>(`/admin/users/${userId}/deregister`),
  getAnnouncements: (page = 0, size = 10) =>
    api.get<ApiResponse<Page<AdminAnnouncement>>>(`/admin/announcements?page=${page}&size=${size}`),
  publishAnnouncement: (data: { title: string; content: string; audience: AnnouncementAudience }) =>
    api.post<ApiResponse<AdminAnnouncement>>('/admin/announcements', data),
  getAudit: (query: SecurityAuditQuery = {}) => {
    const params = new URLSearchParams({
      page: String(query.page ?? 0),
      size: String(query.size ?? 20),
    });
    if (query.action) params.set('action', query.action);
    if (query.outcome) params.set('outcome', query.outcome);
    if (query.resourceType) params.set('resourceType', query.resourceType);
    if (query.userId?.trim()) params.set('userId', query.userId.trim());
    return api.get<ApiResponse<Page<SecurityAuditEvent>>>(`/admin/audit?${params.toString()}`);
  },
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

export type ModelSelectionStrategy = "ROUND_ROBIN" | "LEAST_LATENCY" | "WEIGHTED_RANDOM" | "FAIL_OVER";

export type ModelCapability = "CHAT" | "STREAMING_CHAT" | "VLM" | "EMBEDDING" | "STREAMING_SPEECH_TO_TEXT";

export type ModelProtocol = "CHAT_COMPLETIONS" | "RESPONSES" | "ANTHROPIC_MESSAGES";

export interface ModelDefinition {
  id: string;
  provider: "openai" | "openai-compatible" | "deepseek" | "dashscope" | "anthropic";
  protocol?: ModelProtocol;
  baseurl: string;
  apikey: string;
  model: string;
  capabilities?: ModelCapability[];
  weight: number;
  priority: number;
  scenes: string[];
  enabled: boolean;
  customParameters?: Record<string, unknown>;
}

export interface ModelRuntimeState {
  instanceId: string;
  modelName: string;
  available: boolean;
  healthScore: number;
  qps: number;
  avgLatencyMs: number;
  errorRate: number;
  totalRequests: number;
  successRequests: number;
  failureRequests: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastUpdatedAt: number;
  nextProbeAt: number;
  phase: string;
  lastError?: string;
}

export interface ModelRoutePolicy {
  id: string;
  scene: string;
  riskLevel?: string;
  primaryTier: string;
  fallbackTiers?: string[];
  maxInputTokens?: number | null;
  maxOutputTokens?: number | null;
  temperature?: number | null;
  topP?: number | null;
  maxCompletionTokens?: number | null;
  customParameters?: Record<string, unknown>;
  enabled: boolean;
  priority: number;
}

export interface ModelGovernanceModel {
  id: string;
  displayName?: string | null;
  provider?: string | null;
  protocol: ModelProtocol;
  baseUrl?: string | null;
  endpointHost?: string | null;
  realModelId?: string | null;
  apiKeyConfigured: boolean;
  capabilities: ModelCapability[];
  timeoutSeconds?: number | null;
  contextWindowTokens?: number | null;
  inputPricePerMillion?: number | null;
  outputPricePerMillion?: number | null;
  priceVersion?: string | null;
  weight: number;
  priority: number;
  scenes: string[];
  enabled: boolean;
}

export interface ModelGovernanceTier {
  id: string;
  displayName?: string | null;
  description?: string | null;
  members: string[];
  strategy?: ModelSelectionStrategy | null;
  enabled: boolean;
  capabilities: ModelCapability[];
  healthyMemberCount: number;
  degradedMemberCount: number;
  downMemberCount: number;
}

export interface ModelMetricSummary {
  routeCount: number;
  fallbackCount: number;
  fallbackRate: number;
  successRate: number;
  averageLatencyMs: number;
  p95LatencyMs?: number | null;
  rateLimitedCount: number;
  errorCount: number;
  inputTokens: number;
  outputTokens: number;
  knownCost?: number | null;
  unknownCostCount: number;
}

export interface ModelGovernanceSnapshot {
  version: number;
  schemaVersion: number;
  defaultScene?: string | null;
  defaultTier?: string | null;
  models: ModelGovernanceModel[];
  tiers: ModelGovernanceTier[];
  routes: ModelRoutePolicy[];
  defaultRoute?: ModelRoutePolicy | null;
  runtimeStates: ModelRuntimeState[];
  summary: ModelMetricSummary;
}

export interface ModelGovernanceModelUpdate {
  id: string;
  displayName?: string;
  provider?: string;
  protocol?: ModelProtocol;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  capabilities?: ModelCapability[];
  weight?: number;
  priority?: number;
  scenes?: string[];
  enabled?: boolean;
  timeoutSeconds?: number;
  contextWindowTokens?: number | null;
  pricing?: {
    inputPerMillion?: number | null;
    outputPerMillion?: number | null;
    priceVersion?: string | null;
  };
}

export interface ModelGovernanceTierUpdate {
  displayName?: string;
  description?: string;
  members: string[];
  strategy: ModelSelectionStrategy;
  enabled: boolean;
  capabilities?: ModelCapability[];
}

export interface ModelGovernanceUpdateRequest {
  expectedVersion: number;
  schemaVersion: number;
  defaultScene?: string;
  defaultTier?: string;
  models: ModelGovernanceModelUpdate[];
  tiers: Record<string, ModelGovernanceTierUpdate>;
  routes: ModelRoutePolicy[];
  defaultRoute?: ModelRoutePolicy | null;
}

export interface ModelRoutePreviewRequest {
  scene: string;
  riskLevel?: string;
  estimatedInputTokens?: number;
  reservedOutputTokens?: number;
}

export interface ModelRoutePreview {
  policyId: string;
  primaryTier: string;
  candidates: Array<{
    tierId: string;
    modelId: string;
    provider?: string | null;
    modelName?: string | null;
    available: boolean;
    excludedReason?: string | null;
  }>;
  routeReason: string;
  warnings: string[];
}

export interface ModelCallTraceItem {
  createdAt: string;
  requestId: string;
  attemptId: string;
  userId?: string | null;
  scene: string;
  policyId?: string | null;
  routeReason?: string | null;
  primaryTier?: string | null;
  selectedTier?: string | null;
  modelId?: string | null;
  provider?: string | null;
  modelName?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cachedTokens?: number | null;
  cost?: number | null;
  latencyMs?: number | null;
  ttftMs?: number | null;
  retryIndex: number;
  fallbackUsed: boolean;
  status: string;
  errorCode?: string | null;
  finishReason?: string | null;
}

export interface ModelMetricQuery {
  from?: string;
  to?: string;
  scene?: string;
  userId?: string;
  modelTier?: string;
  provider?: string;
  model?: string;
  fallbackUsed?: boolean;
  status?: string;
}

export interface ModelAttemptQuery extends ModelMetricQuery {
  page?: number;
  size?: number;
}

export const modelApi = {
  states: () => api.get<ApiResponse<ModelRuntimeState[]>>("/model/states"),
  getConsole: () => api.get<ApiResponse<ModelGovernanceSnapshot>>("/model/console"),
  updateConsole: (data: ModelGovernanceUpdateRequest) =>
    api.put<ApiResponse<{ version: number; status: "updated" }>>("/model/console", data),
  previewRoute: (data: ModelRoutePreviewRequest) =>
    api.post<ApiResponse<ModelRoutePreview>>("/model/routes/preview", data),
  getMetrics: (params?: ModelMetricQuery) =>
    api.get<ApiResponse<ModelMetricSummary>>("/model/metrics", { params }),
  getAttempts: (params?: ModelAttemptQuery) =>
    api.get<ApiResponse<Page<ModelCallTraceItem>>>("/model/attempts", { params }),
};

export interface DeveloperConfigVO {
  apiKey: string;
  scopes: string[];
  active: boolean;
}

export const developerApi = {
  getConfig: () => api.get<ApiResponse<DeveloperConfigVO>>("/developer/config").then((res) => res.data),
  rotateApiKey: () => api.post<ApiResponse<DeveloperConfigVO>>("/developer/config/api-key").then((res) => res.data),
  updateScopes: (scopes: string[]) => api.put<ApiResponse<DeveloperConfigVO>>("/developer/config/api-key/scopes", { scopes }).then((res) => res.data),
  revokeApiKey: () => api.delete<ApiResponse<void>>("/developer/config/api-key"),
};

export interface ImageUploadResponse {
  objectKey: string;
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface ImageUploadCheckResponse {
  skip: boolean;
  objectKey?: string;
  url?: string;
  fileMd5: string;
}

export interface ChunkUploadResponse {
  uploadId: string;
  chunkIndex: number;
  uploaded: boolean;
  uploadedChunks: number;
  totalChunks: number;
}

export interface ChunkProgressResponse {
  uploadedChunks: number;
}

// ──────────────── Agent 人格配置 (v4.0 F8.1) ────────────────

export interface AgentPersonaConfig {
  id?: number;
  userId?: string;
  personalityStyle: 'gentle' | 'lively' | 'calm' | 'rational';
  proactiveFrequency: 'off' | 'low' | 'normal';
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  anniversaryReminderEnabled: boolean;
  weeklyReportEnabled: boolean;
}

export const agentApi = {
  getPersonaConfig: () => api.get<ApiResponse<AgentPersonaConfig>>('/ai/persona-config'),
  updatePersonaConfig: (data: Partial<AgentPersonaConfig>) =>
    api.put<ApiResponse<AgentPersonaConfig>>('/ai/persona-config', data),
};

// ──────────────── 灵魂周报 (v4.0 F8.3) ────────────────

export interface SoulReport {
  id: number;
  userId: string;
  reportType: 'WEEKLY' | 'MONTHLY';
  title: string;
  content: string;
  periodStart: string;
  periodEnd: string;
  notified: boolean;
  createdAt: string;
}

export const soulReportApi = {
  getLatest: () => api.get<ApiResponse<SoulReport>>('/ai/soul-report/latest'),
  getHistory: (page = 0, size = 10) =>
    api.get<ApiResponse<SoulReport[]>>(`/ai/soul-report/history?page=${page}&size=${size}`),
};

// ──────────────── 跨源记忆融合 (v4.0 F11.4) ────────────────

export const fusionApi = {
  run: () => api.post<ApiResponse<number>>('/ai/memory-fusion/run'),
};

// ──────────────── 记忆透明度与生命周期（Phase 1）────────────────

export interface MemoryCenterItem {
  id: number;
  summary: string;
  importance: number;
  confidence: number;
  sourceType: string;
  sourceId?: string | null;
  sourceTitle?: string | null;
  createdAt: string;
  updatedAt: string;
  validUntil?: string | null;
  mergedIntoId?: number | null;
  matchAllowed: boolean;
  hidden: boolean;
  lifecycleStatus: 'ACTIVE' | 'HIDDEN' | 'EXPIRED' | 'MERGED';
}

export interface MemoryCenterResponse {
  memories: MemoryCenterItem[];
  activeCount: number;
  hiddenCount: number;
  expiredCount: number;
  matchableCount: number;
}

export interface UpdateMemoryRequest {
  summary?: string;
  confidence?: number;
  matchAllowed?: boolean;
  hidden?: boolean;
  validUntil?: string;
  clearValidUntil?: boolean;
}

export interface PersonaMemoryItem {
  id?: number | null;
  preferredName?: string | null;
  location?: string | null;
  interests?: string | null;
  tone?: string | null;
  customInstructions?: string | null;
  sourceType: string;
  sourceId?: string | null;
  confidence: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  validUntil?: string | null;
  matchAllowed: boolean;
  hidden: boolean;
  lifecycleStatus: 'ACTIVE' | 'HIDDEN' | 'EXPIRED' | 'EMPTY';
}

export interface UpdatePersonaMemoryRequest {
  preferredName?: string;
  location?: string;
  interests?: string;
  tone?: string;
  customInstructions?: string;
  confidence?: number;
  matchAllowed?: boolean;
  hidden?: boolean;
  validUntil?: string;
  clearValidUntil?: boolean;
  clearFields?: string[];
}

export interface LifeGraphSourceItem {
  sourceId: string;
  sourceType: string;
  sourceTitle?: string | null;
  entryDate?: string | null;
  createdAt?: string | null;
}

export interface LifeGraphMemoryItem {
  id: number;
  type: string;
  displayName: string;
  summary?: string | null;
  mentionCount: number;
  relationCount: number;
  confidence: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  validUntil?: string | null;
  matchAllowed: boolean;
  hidden: boolean;
  lifecycleStatus: 'ACTIVE' | 'HIDDEN' | 'EXPIRED';
  sources: LifeGraphSourceItem[];
}

export interface LifeGraphMemoryResponse {
  entities: LifeGraphMemoryItem[];
  activeCount: number;
  hiddenCount: number;
  expiredCount: number;
  matchableCount: number;
}

export interface UpdateLifeGraphMemoryRequest {
  confidence?: number;
  matchAllowed?: boolean;
  hidden?: boolean;
  validUntil?: string;
  clearValidUntil?: boolean;
}

export const memoryCenterApi = {
  get: (limit = 50) => api.get<ApiResponse<MemoryCenterResponse>>(`/memory/center?limit=${limit}`),
  update: (id: number, data: UpdateMemoryRequest) =>
    api.patch<ApiResponse<MemoryCenterItem>>(`/memory/center/${id}`, data),
  remove: (id: number) => api.delete<ApiResponse<void>>(`/memory/center/${id}`),
};

export const personaMemoryApi = {
  get: () => api.get<ApiResponse<PersonaMemoryItem>>('/memory/persona'),
  update: (data: UpdatePersonaMemoryRequest) =>
    api.patch<ApiResponse<PersonaMemoryItem>>('/memory/persona', data),
  remove: () => api.delete<ApiResponse<void>>('/memory/persona'),
};

export const lifeGraphMemoryApi = {
  get: (limit = 50) => api.get<ApiResponse<LifeGraphMemoryResponse>>(`/memory/life-graph?limit=${limit}`),
  update: (id: number, data: UpdateLifeGraphMemoryRequest) =>
    api.patch<ApiResponse<LifeGraphMemoryItem>>(`/memory/life-graph/${id}`, data),
  remove: (id: number) => api.delete<ApiResponse<void>>(`/memory/life-graph/${id}`),
};

// ──────────────── 认知冲突检测 (v4.0 F11.3) ────────────────

export interface CognitiveConflict {
  id: number;
  userId: string;
  description: string;
  existingBelief?: string | null;
  newObservation?: string | null;
  source: string;
  resolved: boolean;
  createdAt: string;
}

export const conflictApi = {
  getUnresolved: () => api.get<ApiResponse<CognitiveConflict[]>>('/ai/cognitive-conflicts'),
  resolve: (id: number) => api.post<ApiResponse<void>>(`/ai/cognitive-conflicts/${id}/resolve`),
};

// ──────────────── Agent 成长可见化 (v4.0 F8.5) ────────────────

export interface AgentGrowth {
  understandingIndex: number;
  lifeGraphEntityCount: number;
  lifeGraphBreakdown: Record<string, number>;
  personaCompleteness: number;
  midMemoryInsightCount: number;
  diaryCount: number;
  chatTurnCount: number;
  companionDays: number;
  description: string;
}

export const agentGrowthApi = {
  get: () => api.get<ApiResponse<AgentGrowth>>('/ai/agent-growth'),
};

// ──────────────── 共鸣信号 (v4.0 F9.2) ────────────────

export interface ResonanceSignal {
  id: number;
  fromUserId: string;
  toUserId: string;
  cardId?: number | null;
  message?: string | null;
  isRead: boolean;
  isMutual: boolean;
  createdAt: string;
}

export const resonanceSignalApi = {
  send: (data: { toUserId: string; cardId?: number; message?: string }) =>
    api.post<ApiResponse<ResonanceSignal>>('/plaza/signal', data),
  getReceived: (page = 0, size = 20) =>
    api.get<ApiResponse<ResonanceSignal[]>>(`/plaza/signals/received?page=${page}&size=${size}`),
  getUnreadCount: () => api.get<ApiResponse<number>>('/plaza/signals/unread-count'),
  markAsRead: (signalId: number) => api.post<ApiResponse<void>>(`/plaza/signals/${signalId}/read`),
};

export const imageApi = {
  upload: (file: File, userId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    return api.post<ApiResponse<ImageUploadResponse>>("/image/upload", formData).then((res) => res.data);
  },
  uploadBatch: (files: File[], userId: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("userId", userId);
    return api.post<ApiResponse<ImageUploadResponse[]>>("/image/upload/batch", formData).then((res) => res.data);
  },
  checkSkipUpload: (fileMd5: string) =>
    api.get<ApiResponse<ImageUploadCheckResponse>>(`/image/check?fileMd5=${encodeURIComponent(fileMd5)}`).then((res) => res.data),
  uploadChunk: (
    chunk: Blob,
    fileMd5: string,
    chunkIndex: number,
    totalChunks: number,
    userId: string
  ) => {
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("fileMd5", fileMd5);
    formData.append("chunkIndex", String(chunkIndex));
    formData.append("totalChunks", String(totalChunks));
    formData.append("userId", userId);
    return api.post<ApiResponse<ChunkUploadResponse>>("/image/chunk/upload", formData).then((res) => res.data);
  },
  mergeChunks: (request: {
    fileMd5: string;
    totalChunks: number;
    userId: string;
    fileName: string;
    totalSize: number;
  }) =>
    api.post<ApiResponse<ImageUploadResponse>>("/image/chunk/merge", request).then((res) => res.data),
  getChunkProgress: (fileMd5: string) =>
    api.get<ApiResponse<ChunkProgressResponse>>(`/image/chunk/progress?fileMd5=${encodeURIComponent(fileMd5)}`).then((res) => res.data),
  getUrl: (objectKey: string) => api.get<ApiResponse<string>>(`/image/url?objectKey=${encodeURIComponent(objectKey)}`).then((res) => res.data),
  getUrls: (objectKeys: string[]) => api.post<ApiResponse<string[]>>("/image/urls", objectKeys).then((res) => res.data),
  delete: (objectKey: string) => api.delete<ApiResponse<void>>(`/image?objectKey=${encodeURIComponent(objectKey)}`),
  deleteBatch: (objectKeys: string[]) => api.delete<ApiResponse<void>>("/image/batch", { data: objectKeys }),
};
