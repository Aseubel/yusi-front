import { api } from './api'

export interface SoulCard {
    id: number
    content: string
    originId: string
    userId: string
    type: 'DIARY' | 'SITUATION'
    emotion: string
    resonanceCount: number
    createdAt: string
}

export const getFeed = async (page: number = 1, emotion?: string): Promise<any> => {
    const url = emotion && emotion !== 'All' 
        ? `/plaza/feed?page=${page}&emotion=${emotion}`
        : `/plaza/feed?page=${page}`
    const res = await api.get<any>(url)
    return res.data?.data
}

export const submitToPlaza = async (content: string, originId: string, type: 'DIARY' | 'SITUATION'): Promise<SoulCard> => {
    const res = await api.post<any>('/plaza/submit', { content, originId, type })
    return res.data?.data
}

export const resonate = async (cardId: number, type: 'EMPATHY' | 'HUG' | 'SAME_HERE'): Promise<any> => {
    const res = await api.post<any>(`/plaza/${cardId}/resonate`, { type })
    return res.data?.data
}
