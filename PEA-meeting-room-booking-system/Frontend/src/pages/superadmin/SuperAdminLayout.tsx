import { NavLink, Outlet } from 'react-router-dom'
import { Monitor, Users, History } from 'lucide-react'

export default function SuperAdminLayout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive ? 'bg-pea-purple text-white shadow-lg shadow-purple-500/10' : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-52 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sticky top-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mb-1">Super Admin</p>
          <nav className="space-y-1">
            <NavLink to="/superadmin/rooms" className={linkClass}>
              <Monitor size={16} /> ห้องประชุม
            </NavLink>
            <NavLink to="/superadmin/users" className={linkClass}>
              <Users size={16} /> ผู้ใช้งาน
            </NavLink>
            <NavLink to="/superadmin/booking-logs" className={linkClass}>
              <History size={16} /> ประวัติระบบ (Audit Trail)
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
