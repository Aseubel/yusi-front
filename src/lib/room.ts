import { api } from "./api";

export interface Scenario {
  id: string;
  title: string;
  description: string;
}

export interface Room {
  code: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  ownerId?: string;
  scenarioId?: string;
  scenario?: Scenario;
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

export const getScenarios = async (): Promise<Scenario[]> => {
  const { data } = await api.get("/room/scenarios");
  return data.data;
};

export const submitScenario = async (req: SubmitScenarioRequest): Promise<Scenario> => {
  const { data } = await api.post("/room/scenarios/submit", req);
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

