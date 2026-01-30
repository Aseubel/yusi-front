import { api } from './api'

export interface Diary {
  diaryId: string
  userId: string
  title: string
  content: string
  visibility: boolean
  entryDate: string
  aiResponse?: string
  status?: number // 1 = Analyzed
  clientEncrypted?: boolean // true = content encrypted by client
  createTime: string
  updateTime: string
  // Geo-location fields (Epic 5)
  latitude?: number
  longitude?: number
  address?: string
  placeName?: string
  placeId?: string
}

export interface WriteDiaryRequest {
  userId: string
  title: string
  content: string
  entryDate: string
  visibility?: boolean
  clientEncrypted?: boolean
  /** 明文内容，用于 RAG 向量化（当允许 RAG 时发送） */
  plainContent?: string
  // Geo-location fields (Epic 5)
  latitude?: number
  longitude?: number
  address?: string
  placeName?: string
  placeId?: string
}

export interface EditDiaryRequest {
  userId: string
  diaryId: string
  title: string
  content: string
  entryDate: string
  visibility?: boolean
  clientEncrypted?: boolean
  /** 明文内容，用于 RAG 向量化（当允许 RAG 时发送） */
  plainContent?: string
  // Geo-location fields (Epic 5)
  latitude?: number
  longitude?: number
  address?: string
  placeName?: string
  placeId?: string
}

export interface PagedModel<T> {
  _embedded?: {
    diaryList: T[]
  }
  content?: T[] // Fallback if HATEOAS is not fully strictly used or configured differently
  page: {
    size: number
    totalElements: number
    totalPages: number
    number: number
  }
}

export const writeDiary = async (req: WriteDiaryRequest): Promise<void> => {
  await api.post('/diary', req)
}

export const editDiary = async (req: EditDiaryRequest): Promise<void> => {
  await api.put('/diary', req)
}

export const getDiaryList = async (userId: string, pageNum = 1, pageSize = 10): Promise<Diary[]> => {
  const { data } = await api.get(`/diary/list`, {
    params: { userId, pageNum, pageSize }
  })

  // Handle Spring HATEOAS structure
  const pagedModel = data.data as PagedModel<Diary>

  if (pagedModel._embedded?.diaryList) {
    return pagedModel._embedded.diaryList
  }

  // Fallback for standard PageImpl serialization
  if (pagedModel.content) {
    return pagedModel.content
  }

  return []
}

export const generateAiResponse = async (diaryId: string): Promise<void> => {
  await api.post(`/diary/generate-response/${diaryId}`)
}

// F5.3 足迹地图
export interface DiaryFootprint {
  diaryId: string
  latitude: number
  longitude: number
  placeName?: string
  address?: string
  createTime: string
  emotion?: string
}

export const getFootprints = async (userId: string): Promise<DiaryFootprint[]> => {
  const { data } = await api.get('/diary/footprints', { params: { userId } })
  return data.data || []
}

