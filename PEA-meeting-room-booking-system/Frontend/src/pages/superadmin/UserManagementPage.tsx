import { useEffect, useState } from 'react'
import { getAllUsers, updateUserRole, deleteUser } from '../../api/admin'
import type { User } from '../../types'
import { Shield, User as UserIcon, Trash2 } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  User: 'พนักงาน',
  Admin: 'ผู้อนุมัติ',
  SuperAdmin: 'Super Admin',
}

const ROLE_COLORS: Record<string, string> = {
  User: 'bg-gray-100 text-gray-600',
  Admin: 'bg-blue-100 text-blue-700',
  SuperAdmin: 'bg-purple-100 text-purple-700',
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [localUsers, setLocalUsers] = useState<User[]>([])

  const load = () => {
    const local: User[] = JSON.parse(localStorage.getItem('pea_registered_users') || '[]')
    setLocalUsers(local)
    
    getAllUsers()
      .then((r) => {
        const apiUsers = r.data.data || []
        
        // Strictly display ONLY users that are present in the GORM database (apiUsers)
        // Enrich them with avatar, email, and password from localStorage if matching.
        const combined = apiUsers.map((au) => {
          const matchedLocal = local.find((lu) => lu.emp_id.toUpperCase() === au.emp_id.toUpperCase())
          if (matchedLocal) {
            return {
              ...matchedLocal,
              ...au,
              avatar: au.avatar || matchedLocal.avatar,
              email: au.email || matchedLocal.email,
            }
          }
          return au
        })
        
        // Also update local registered users in localStorage with any role changes from the database,
        // and completely clean/remove any entries that have been deleted in GORM database!
        const updatedLocal = local
          .filter(lu => apiUsers.some(au => au.emp_id.toUpperCase() === lu.emp_id.toUpperCase()))
          .map(lu => {
            const matched = apiUsers.find(au => au.emp_id.toUpperCase() === lu.emp_id.toUpperCase())
            if (matched) {
              return { ...lu, role: matched.role }
            }
            return lu
          })
        localStorage.setItem('pea_registered_users', JSON.stringify(updatedLocal))
        setLocalUsers(updatedLocal)
        
        setUsers(combined)
      })
      .catch((err) => {
        console.error('Failed to load users from DB, falling back to local users:', err)
        setUsers(local) // fallback
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRoleChange = async (empId: string, newRole: string) => {
    setUpdatingId(empId)
    try {
      // 1. Try updating in GORM backend database
      await updateUserRole(empId, newRole)
    } catch (err) {
      console.warn("Failed to update user role in DB (possibly user hasn't logged in yet):", err)
    }

    // 2. Always update in localStorage pea_registered_users
    try {
      const local: User[] = JSON.parse(localStorage.getItem('pea_registered_users') || '[]')
      const updatedLocal = local.map(lu => {
        if (lu.emp_id.toUpperCase() === empId.toUpperCase()) {
          return { ...lu, role: newRole as any }
        }
        return lu
      })
      localStorage.setItem('pea_registered_users', JSON.stringify(updatedLocal))
    } catch (err) {
      console.error(err)
    }

    await load()
    setUpdatingId(null)
  }

  const handleDelete = async (empId: string) => {
    if (!confirm(`ยืนยันการลบข้อมูลผู้ใช้งานรหัส ${empId}?`)) return
    setUpdatingId(empId)
    try {
      // 1. Delete in GORM database
      await deleteUser(empId)
    } catch (err) {
      console.warn("Failed to delete user in GORM database:", err)
    }

    // 2. Delete from localStorage registered users
    try {
      const local: User[] = JSON.parse(localStorage.getItem('pea_registered_users') || '[]')
      const updatedLocal = local.filter(lu => lu.emp_id.toUpperCase() !== empId.toUpperCase())
      localStorage.setItem('pea_registered_users', JSON.stringify(updatedLocal))
    } catch (err) {
      console.error(err)
    }

    await load()
    setUpdatingId(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการสิทธิ์ผู้ใช้งาน</h1>
        <p className="text-gray-500 text-sm mt-0.5">เปลี่ยนระดับสิทธิ์ของพนักงาน</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">พนักงาน</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">แผนก</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">สิทธิ์ปัจจุบัน</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">เปลี่ยนสิทธิ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <UserIcon size={40} className="mx-auto mb-2 opacity-30" />
                    ไม่มีข้อมูลผู้ใช้งาน
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.emp_id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const matched = localUsers.find(u => u.emp_id.toUpperCase() === user.emp_id.toUpperCase())
                        return matched?.avatar ? (
                          <img
                            src={matched.avatar}
                            alt={user.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-pea-purple/10 rounded-full flex items-center justify-center text-pea-purple font-bold text-sm">
                            {user.full_name.charAt(0)}
                          </div>
                        )
                      })()}
                      <div>
                        <p className="font-medium text-gray-800">{user.full_name}</p>
                        <p className="text-xs text-gray-400">{user.emp_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{user.department || '–'}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${ROLE_COLORS[user.role]}`}>
                      {user.role === 'SuperAdmin' && <Shield size={11} />}
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <select
                        value={user.role}
                        disabled={updatingId === user.emp_id}
                        onChange={(e) => handleRoleChange(user.emp_id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pea-purple disabled:opacity-50 bg-white font-semibold text-gray-700 cursor-pointer"
                      >
                        <option value="User">พนักงาน</option>
                        <option value="Admin">ผู้อนุมัติ</option>
                        <option value="SuperAdmin">Super Admin</option>
                      </select>
                      
                      <button
                        onClick={() => handleDelete(user.emp_id)}
                        disabled={updatingId === user.emp_id || user.emp_id === 'EMP999'}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer disabled:opacity-30 shrink-0"
                        title={user.emp_id === 'EMP999' ? 'ไม่สามารถลบ SuperAdmin ได้' : 'ลบผู้ใช้งาน'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
