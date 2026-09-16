import client from './client'
import type { Booking, User } from '../types'

export const getAllBookings = () =>
  client.get<{ success: boolean; data: Booking[] }>('/admin/bookings')

export const getPendingBookings = () =>
  client.get<{ success: boolean; data: Booking[] }>('/admin/bookings/pending')

export const searchByCode = (code: string) =>
  client.get<{ success: boolean; data: Booking }>('/admin/bookings/search', { params: { code } })

export const approveBooking = (id: number) =>
  client.put(`/admin/bookings/${id}/approve`)

export const rejectBooking = (id: number, reason: string) =>
  client.put(`/admin/bookings/${id}/reject`, { reason })

export const getAllUsers = () =>
  client.get<{ success: boolean; data: User[] }>('/superadmin/users')

export const updateUserRole = (empId: string, role: string) =>
  client.put(`/superadmin/users/${empId}/role`, { role })

export const deleteUser = (empId: string) =>
  client.delete(`/superadmin/users/${empId}`)
