import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
  updateUser: (updatedUser: User) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  // Pre-seed default registered accounts for standard roles
  useEffect(() => {
    const existing = localStorage.getItem('pea_registered_users')
    if (!existing) {
      const defaultUsers: User[] = [
        {
          emp_id: 'EMP001',
          full_name: 'ผู้ดูแลระบบ (Admin)',
          department: 'กองคอมพิวเตอร์',
          email: 'admin@pea.co.th',
          password: 'PEA123',
          role: 'Admin',
        },
        {
          emp_id: 'EMP999',
          full_name: 'ผู้ดูแลระบบสูงสุด (SuperAdmin)',
          department: 'กองระบบสารสนเทศ',
          email: 'superadmin@pea.co.th',
          password: 'PEA123',
          role: 'SuperAdmin',
        },
        {
          emp_id: 'EMP123',
          full_name: 'สมชาย ใจดี',
          department: 'กองบัญชีและการเงิน',
          email: 'somchai@pea.co.th',
          password: '123',
          role: 'User',
        }
      ]
      localStorage.setItem('pea_registered_users', JSON.stringify(defaultUsers))
    }
  }, [])

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  const login = (t: string, u: User) => {
    setToken(t)
    setUser(u)
    sessionStorage.removeItem('pea_welcome_shown')
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    sessionStorage.removeItem('pea_welcome_shown')
  }

  const updateUser = (u: User) => {
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
