export interface Room {
  room_id: number
  room_name: string
  capacity: number
  mic_count: number
  pc_count: number
  screen_count: number
  images: string[]
  is_active: boolean
  building?: string
  status?: 'Available' | 'Reserved' | 'In Use' // Occupancy status
  created_at: string
  updated_at: string
}

export interface BookingLog {
  log_id: number
  booking_id: number
  booking?: Booking
  changed_by: string
  operator?: User
  action: string
  old_status?: string
  new_status?: string
  remark?: string
  created_at: string
}

export interface User {
  emp_id: string
  full_name: string
  role: 'User' | 'Admin' | 'SuperAdmin'
  department: string
  created_at?: string
  updated_at?: string
  email?: string
  avatar?: string // Base64 or local URL
  password?: string // Saved locally
}

export type BookingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Canceled'

export interface Booking {
  booking_id: number
  booking_code: string
  room_id: number
  room?: Room
  emp_id: string
  user?: User
  title: string
  ref_note: string
  objective: string
  start_date: string
  end_date: string
  snack_price: number
  participant_count: number
  status: BookingStatus
  approved_by?: string
  reject_reason?: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
