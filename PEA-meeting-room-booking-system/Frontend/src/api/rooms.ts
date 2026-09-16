import client from './client'
import type { Room } from '../types'

export const getRooms = (includeInactive = false) =>
  client.get<{ success: boolean; data: Room[] }>(`/rooms${includeInactive ? '?include_inactive=true' : ''}`)

export const getRoom = (id: number) =>
  client.get<{ success: boolean; data: Room }>(`/rooms/${id}`)

export const createRoom = (data: Partial<Room>) =>
  client.post<{ success: boolean; data: Room }>('/superadmin/rooms', data)

export const updateRoom = (id: number, data: Partial<Room>) =>
  client.put<{ success: boolean; data: Room }>(`/superadmin/rooms/${id}`, data)

export const deleteRoom = (id: number) =>
  client.delete(`/superadmin/rooms/${id}`)
