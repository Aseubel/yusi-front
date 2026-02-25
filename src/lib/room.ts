import { api } from "./api";

export interface RoomScenario {
  id: string;
  title: string;
  description: string;
  summary?: string;
}

export interface Room {
  code: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  ownerId?: string;
  scenarioId?: string;
  scenario?: RoomScenario;
  members: string[];
  memberNames?: Record<string, string>;
  submissions: Record<string, string>;
  submissionVisibility?: Record<string, boolean>;
  cancelVotes?: string[];
  createdAt?: string;
}

export interface CreateRoomRequest {
  ownerId: string;
  maxMembers: number;
}

export interface JoinRoomRequest {
  code: string;
  userId: string;
}

export interface StartRoomRequest {
  code: string;
  scenarioId: string;
  ownerId: string;
}

export interface SubmitNarrativeRequest {
  code: string;
  userId: string;
  narrative: string;
  isPublic: boolean;
}

export interface PersonalSketch {
  userId: string;
  sketch: string;
}

export interface PairCompatibility {
  userA: string;
  userB: string;
  score: number;
  reason: string;
}

export interface SituationReport {
  scenarioId: string;
  personal: PersonalSketch[];
  pairs: PairCompatibility[];
  publicSubmissions?: { userId: string; content: string }[];
}

export interface SubmitScenarioRequest {
  title: string;
  description: string;
}

export interface MyScenario {
  id: string;
  title: string;
  description: string;
  submitterId: string;
  status: number;
  rejectReason?: string;
}

export const STATUS_PENDING = 0;
export const STATUS_MANUAL_REJECTED = 1;
export const STATUS_AI_REJECTED = 2;
export const STATUS_AI_APPROVED = 3;
export const STATUS_MANUAL_APPROVED = 4;
export const STATUS_DELETED = -1;

export const getStatusText = (status: number): string => {
  switch (status) {
    case STATUS_PENDING: return "待审核";
    case STATUS_MANUAL_REJECTED: return "已拒绝";
    case STATUS_AI_REJECTED: return "AI审核拒绝";
    case STATUS_AI_APPROVED: return "AI审核通过";
    case STATUS_MANUAL_APPROVED: return "已通过";
    case STATUS_DELETED: return "已删除";
    default: return "未知";
  }
};

export const getStatusColor = (status: number): string => {
  switch (status) {
    case STATUS_PENDING: return "text-amber-500 bg-amber-50 dark:bg-amber-950/20";
    case STATUS_MANUAL_REJECTED:
    case STATUS_AI_REJECTED: return "text-red-500 bg-red-50 dark:bg-red-950/20";
    case STATUS_AI_APPROVED: return "text-blue-500 bg-blue-50 dark:bg-blue-950/20";
    case STATUS_MANUAL_APPROVED: return "text-green-500 bg-green-50 dark:bg-green-950/20";
    default: return "text-muted-foreground bg-muted/50";
  }
};

export const getScenarios = async (): Promise<RoomScenario[]> => {
  const { data } = await api.get("/room/scenarios");
  return data.data;
};

export const submitScenario = async (req: SubmitScenarioRequest): Promise<RoomScenario> => {
  const { data } = await api.post("/room/scenarios/submit", req);
  return data.data;
};

export const getMyScenarios = async (): Promise<MyScenario[]> => {
  const { data } = await api.get("/room/scenarios/my");
  return data.data;
};

export const updateScenario = async (id: string, req: SubmitScenarioRequest): Promise<MyScenario> => {
  const { data } = await api.put(`/room/scenarios/${id}`, req);
  return data.data;
};

export const deleteScenario = async (id: string): Promise<void> => {
  await api.delete(`/room/scenarios/${id}`);
};

export const resubmitScenario = async (id: string): Promise<MyScenario> => {
  const { data } = await api.post(`/room/scenarios/${id}/resubmit`);
  return data.data;
};

export const createRoom = async (req: CreateRoomRequest): Promise<Room> => {
  const { data } = await api.post("/room/create", req);
  return data.data;
};

export const joinRoom = async (req: JoinRoomRequest): Promise<Room> => {
  const { data } = await api.post("/room/join", req);
  return data.data;
};

export const startRoom = async (req: StartRoomRequest): Promise<Room> => {
  const { data } = await api.post("/room/start", req);
  return data.data;
};

export const submitNarrative = async (
  req: SubmitNarrativeRequest
): Promise<Room> => {
  const { data } = await api.post("/room/submit", req);
  return data.data;
};

export const cancelRoom = async (
  code: string,
  userId: string
): Promise<void> => {
  await api.post("/room/cancel", { code, userId });
};

export const voteCancelRoom = async (
  code: string,
  userId: string
): Promise<Room> => {
  const { data } = await api.post("/room/vote-cancel", { code, userId });
  return data.data;
};

export const getReport = async (code: string): Promise<SituationReport> => {
  const { data } = await api.get(`/room/report/${code}`);
  return data.data;
};

export const getHistory = async (): Promise<Room[]> => {
  const { data } = await api.get("/room/history");
  return data.data;
};

export const getRoom = async (code: string): Promise<Room> => {
  const { data } = await api.get(`/room/${code}`);
  return data.data;
};

// ==================== 房间聊天相关 ====================

export interface RoomMessage {
  id: number;
  roomCode: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export const sendRoomMessage = async (roomCode: string, content: string): Promise<RoomMessage> => {
  const { data } = await api.post("/room-chat/send", { roomCode, content });
  return data.data;
};

export const getRoomChatHistory = async (roomCode: string): Promise<RoomMessage[]> => {
  const { data } = await api.get("/room-chat/history", { params: { roomCode } });
  return data.data;
};

export const pollRoomMessages = async (roomCode: string, after?: string): Promise<RoomMessage[]> => {
  const { data } = await api.get("/room-chat/poll", {
    params: { roomCode, after }
  });
  return data.data;
};

