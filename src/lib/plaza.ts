import { api, type ApiResponse } from "./api";

export interface SoulCard {
  id: number;
  content: string;
  originId: string;
  userId: string;
  type: "DIARY" | "SITUATION";
  emotion: string;
  resonanceCount: number;
  createdAt: string;
  isResonated?: boolean;
}

export interface SoulResonance {
  id: number;
  cardId: number;
  userId: string;
  type: "EMPATHY" | "HUG" | "SAME_HERE";
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const getFeed = async (
  page: number = 1,
  emotion?: string,
): Promise<Page<SoulCard>> => {
  const url =
    emotion && emotion !== "All"
      ? `/plaza/feed?page=${page}&emotion=${emotion}`
      : `/plaza/feed?page=${page}`;
  const res = await api.get<ApiResponse<Page<SoulCard>>>(url);
  return res.data?.data;
};

export const submitToPlaza = async (
  content: string,
  originId: string,
  type: "DIARY" | "SITUATION",
): Promise<SoulCard> => {
  const res = await api.post<ApiResponse<SoulCard>>("/plaza/submit", {
    content,
    originId,
    type,
  });
  return res.data?.data;
};

export const resonate = async (
  cardId: number,
  type: "EMPATHY" | "HUG" | "SAME_HERE",
): Promise<SoulResonance> => {
  const res = await api.post<ApiResponse<SoulResonance>>(
    `/plaza/${cardId}/resonate`,
    { type },
  );
  return res.data?.data;
};
