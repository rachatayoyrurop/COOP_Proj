import client from './client'

export interface NotificationItem {
  id: number
  text: string
  time: string
  unread: boolean
  created_at: string
}

export const getNotifications = () =>
  client.get<{ success: boolean; data: NotificationItem[] }>('/notifications')
