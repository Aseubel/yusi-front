import { create } from 'zustand'

export interface DiaryReference {
  diaryId: string
  title: string
  entryDate: string
  content: string
}

interface ChatStore {
  isOpen: boolean
  initialMessage: string
  initialDiaries: DiaryReference[]
  setIsOpen: (isOpen: boolean) => void
  setInitialMessage: (msg: string) => void
  setInitialDiaries: (diaries: DiaryReference[]) => void
  openChatWithContext: (context: string) => void
  openChatWithDiary: (diary: DiaryReference) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  initialMessage: '',
  initialDiaries: [],
  setIsOpen: (isOpen) => set({ isOpen }),
  setInitialMessage: (initialMessage) => set({ initialMessage }),
  setInitialDiaries: (initialDiaries) => set({ initialDiaries }),
  openChatWithContext: (context) => set({ isOpen: true, initialMessage: context }),
  openChatWithDiary: (diary) => set((state) => ({ 
    isOpen: true, 
    initialDiaries: state.initialDiaries.some(d => d.diaryId === diary.diaryId) 
      ? state.initialDiaries 
      : [...state.initialDiaries, diary] 
  }))
}))
