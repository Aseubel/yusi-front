import { api } from './api'
import type { DiaryAttachmentBinding, DiaryAttachmentDisplayMode } from './diaryAttachments'

export interface Diary {
  diaryId: string
  userId: string
  title: string
  content: string
  visibility: boolean
  entryDate: string
  clientEncrypted?: boolean // true = content encrypted by client
  createTime: string
  updateTime: string
  // Geo-location fields (Epic 5)
  latitude?: number
  longitude?: number
  address?: string
  placeName?: string
  placeId?: string
  images?: string
  imageObjectKeys?: string[]
  audioObjectKey?: string
  attachmentBindings?: DiaryAttachmentBinding[]
  attachmentDisplayMode?: DiaryAttachmentDisplayMode
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
  images?: string
  attachmentBindings?: DiaryAttachmentBinding[]
  attachmentDisplayMode?: DiaryAttachmentDisplayMode
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
  images?: string
  attachmentBindings?: DiaryAttachmentBinding[]
  attachmentDisplayMode?: DiaryAttachmentDisplayMode
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

export interface VoiceDiaryResponse {
  transcript: string
}

export const transcribeVoice = async (file: File): Promise<VoiceDiaryResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/diary/voice/transcribe', formData)
  return data.data
}

export const getDiary = async (diaryId: string): Promise<Diary> => {
  const { data } = await api.get(`/diary/${diaryId}`)
  return data.data
}

export interface PagedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

export const getDiaryList = async (userId: string, pageNum = 1, pageSize = 10): Promise<PagedResponse<Diary>> => {
  const { data } = await api.get(`/diary/list`, {
    params: { userId, pageNum, pageSize }
  })

  // Handle Spring HATEOAS structure
  const pagedModel = data.data as PagedModel<Diary>
  let content: Diary[] = []

  if (pagedModel._embedded?.diaryList) {
    content = pagedModel._embedded.diaryList
  } else if (pagedModel.content) {
    content = pagedModel.content
  }

  return {
    content,
    totalPages: pagedModel.page?.totalPages || 0,
    totalElements: pagedModel.page?.totalElements || 0,
    size: pagedModel.page?.size || pageSize,
    number: pagedModel.page?.number || 0
  }
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
