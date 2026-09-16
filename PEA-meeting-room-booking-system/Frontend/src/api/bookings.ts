import client from './client'
import type { Booking } from '../types'

export interface CreateBookingPayload {
  room_id: number
  title: string
  ref_note?: string
  objective?: string
  start_date: string
  end_date: string
  snack_price: number
  participant_count: number
}

export const createBooking = (data: CreateBookingPayload) =>
  client.post<{ success: boolean; data: Booking }>('/bookings', data)

export const getMyBookings = () =>
  client.get<{ success: boolean; data: Booking[] }>('/bookings/my')

export const getBookingById = (id: number) =>
  client.get<{ success: boolean; data: Booking }>(`/bookings/${id}`)

export const cancelBooking = (id: number) =>
  client.put(`/bookings/${id}/cancel`)

export const getCalendar = (params: { room_id?: number; year: number; month: number }) =>
  client.get<{ success: boolean; data: Booking[] }>('/bookings/calendar', { params })
