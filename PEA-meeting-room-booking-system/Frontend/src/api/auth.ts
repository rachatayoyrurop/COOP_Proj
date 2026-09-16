import client from './client'
import type { User } from '../types'

export const login = (empId: string, fullName: string, department: string, email?: string) =>
  client.post<{ success: boolean; data: { token: string; user: User } }>('/auth/login', {
    emp_id: empId,
    full_name: fullName,
    department,
    email,
  })

export const getMe = () =>
  client.get<{ success: boolean; data: { emp_id: string; role: string } }>('/auth/me')

export const registerUser = (empId: string, fullName: string, department: string, email?: string) =>
  client.post<{ success: boolean; data: { user: User } }>('/auth/register', {
    emp_id: empId,
    full_name: fullName,
    department,
    email,
  })
