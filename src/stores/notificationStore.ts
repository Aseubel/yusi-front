import { create } from 'zustand'
import { notificationApi } from '../lib/lifegraph'

interface NotificationState {
  unreadCount: number
  fetchUnreadCount: () => Promise<void>
  setUnreadCount: (count: number) => void
  decrementUnreadCount: (amount?: number) => void
  incrementUnreadCount: (amount?: number) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  fetchUnreadCount: async () => {
    try {
      const response = await notificationApi.getUnreadCount()
      if (response.data?.data !== undefined) {
        set({ unreadCount: response.data.data })
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications count', error)
    }
  },
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnreadCount: (amount = 1) => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - amount) })),
  incrementUnreadCount: (amount = 1) => set((state) => ({ unreadCount: state.unreadCount + amount })),
}))
