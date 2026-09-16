import client from './client'
import type { BookingLog } from '../types'

export const getBookingLogs = () =>
  client.get<{ success: boolean; data: BookingLog[] }>('/superadmin/booking-logs')
