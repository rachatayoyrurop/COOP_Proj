import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, CalendarDays, Home, BookOpen, Settings, Shield, Bell, ChevronDown, User, Menu, X } from 'lucide-react'
import peaLogo from '../assets/pea-logo.png'
import { getNotifications, type NotificationItem } from '../api/notifications'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const prevNotifIdsRef = useRef<Set<number>>(new Set())

  // Per-user localStorage key for seen notification IDs
  const getSeenKey = () => `pea_notif_seen_${user?.emp_id || 'anon'}`

  const getSeenIds = (): Set<number> => {
    try {
      const raw = localStorage.getItem(getSeenKey())
      if (!raw) return new Set()
      return new Set(JSON.parse(raw) as number[])
    } catch {
      return new Set()
    }
  }

  const saveSeenIds = (ids: Set<number>) => {
    localStorage.setItem(getSeenKey(), JSON.stringify([...ids]))
  }

  const loadNotifications = () => {
    if (!user) return
    getNotifications()
      .then((res) => {
        const items = res.data.data ?? []
        setNotifications(items)

        const seenIds = getSeenIds()
        // Count only items whose ID is NOT in the seen set (and ID > 0 to skip fallback)
        const newCount = items.filter(n => n.id > 0 && !seenIds.has(n.id)).length
        setUnreadCount(newCount)

        // Remember current IDs for detecting truly new arrivals
        prevNotifIdsRef.current = new Set(items.map(n => n.id))
      })
      .catch(err => console.error('Failed to load notifications:', err))
  }

  // Load notifications periodically
  useEffect(() => {
    loadNotifications()
    const timer = setInterval(loadNotifications, 4000)
    return () => clearInterval(timer)
  }, [user])

  // Click Outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.dropdown-container') && !target.closest('.notifications-container')) {
        setShowUserDropdown(false)
        setShowNotifications(false)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [])

  const handleNotificationsToggle = () => {
    const nextVal = !showNotifications
    setShowNotifications(nextVal)
    if (nextVal) {
      // Mark all current notifications as "seen" for this user
      const allIds = new Set(notifications.map(n => n.id))
      const seenIds = getSeenIds()
      // Merge existing seen with current
      allIds.forEach(id => seenIds.add(id))
      saveSeenIds(seenIds)
      setUnreadCount(0)
    }
  }

  const handleLogout = () => {
    logout()
    setShowLogoutConfirm(false)
    setShowUserDropdown(false)
    setShowNotifications(false)
    navigate('/login')
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const getLinkStyle = (path: string) =>
    isActive(path)
      ? 'text-yellow-300 bg-white/10 px-4 py-2 rounded-xl text-sm font-black transition-all border-b-2 border-yellow-300 shadow-sm'
      : 'text-purple-100 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-sm font-semibold transition-all'

  return (
    <nav className="bg-[#8E24AA] sticky top-0 z-40 shadow-lg text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo with "PEA การไฟฟ้าส่วนภูมิภาค" */}
          <Link to={user?.role === 'Admin' ? '/admin' : '/'} className="flex items-center gap-3 py-2 shrink-0">
            <img
              src={peaLogo}
              alt="PEA Logo"
              className="h-12 w-auto object-contain bg-white/10 p-1 rounded-xl border border-white/10 shadow-inner"
            />
            <div className="border-l border-white/20 pl-3 hidden sm:block">
              <p className="text-white font-black text-base sm:text-lg leading-tight tracking-wide">
                PEA การไฟฟ้าส่วนภูมิภาค
              </p>
              <p className="text-purple-200 text-[9px] font-bold uppercase tracking-wider">
                PROVINCIAL ELECTRICITY AUTHORITY
              </p>
            </div>
          </Link>

          {/* Nav Links based on Role */}
          <div className="hidden md:flex items-center gap-1.5 h-full">
            {/* If standard User or SuperAdmin, they can see standard user links */}
            {user?.role !== 'Admin' && (
              <>
                <Link to="/" className={getLinkStyle('/')}>
                  ห้องประชุม
                </Link>
                <Link to="/calendar" className={getLinkStyle('/calendar')}>
                  ปฏิทินการจอง
                </Link>
                {user && (
                  <Link to="/my-bookings" className={getLinkStyle('/my-bookings')}>
                    การจองของฉัน
                  </Link>
                )}
              </>
            )}

            {/* If SuperAdmin, they see the Admin link labeled "Admin" */}
            {user && user.role === 'SuperAdmin' && (
              <>
                <span className="text-purple-300 font-light px-1">|</span>
                <Link to="/admin" className={getLinkStyle('/admin')}>
                  Admin
                </Link>
              </>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-4">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2.5 text-purple-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              aria-label={showMobileMenu ? 'ปิดเมนู' : 'เปิดเมนู'}
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
            {/* Notification Bell with interactive popover */}
            {user && (
              <div className="relative notifications-container">
                <button
                  onClick={handleNotificationsToggle}
                  className="relative p-2.5 text-purple-100 hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-[#8E24AA] flex items-center justify-center text-[9px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white text-slate-800 rounded-2xl shadow-2xl border border-purple-50/50 py-3 z-50 animate-slide-down">
                    <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-800">การแจ้งเตือน</h4>
                      {unreadCount > 0 && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                          ใหม่ {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400 text-xs font-bold">
                          ไม่มีการแจ้งเตือนในขณะนี้
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const isUnseen = notif.id > 0 && !getSeenIds().has(notif.id)
                          return (
                            <div key={notif.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors flex gap-2.5 items-start ${isUnseen ? 'bg-purple-50/20' : ''}`}>
                              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isUnseen ? 'bg-purple-600' : 'bg-gray-300'}`} />
                              <div className="flex-1">
                                <p className={`text-xs leading-normal ${isUnseen ? 'font-black text-slate-800' : 'font-medium text-slate-600'}`}>
                                  {notif.text}
                                </p>
                                <span className="text-[10px] text-gray-400 font-bold block mt-1">{notif.time}</span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative dropdown-container">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all border border-transparent hover:border-white/15"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-white/10 shadow-sm">
                      {user.full_name?.charAt(0) ?? 'U'}
                    </div>
                  )}
                  <div className="hidden sm:block text-left shrink-0">
                    <p className="text-[10px] text-purple-200 font-bold leading-tight uppercase">สวัสดี,</p>
                    <p className="text-white text-sm font-extrabold leading-tight">{user.full_name}</p>
                  </div>
                  <ChevronDown size={14} className={`text-purple-100 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-3 w-52 bg-white text-slate-800 rounded-2xl shadow-2xl border border-purple-50/50 py-2 z-50 animate-slide-down">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">สิทธิ์ผู้ใช้งาน</p>
                      <p className="text-sm font-black text-[#8E24AA]">
                        {user.role === 'SuperAdmin' ? 'Super Admin' : user.role === 'Admin' ? 'ผู้อนุมัติ (Admin)' : 'พนักงานทั่วไป'}
                      </p>
                    </div>
                    {user.role !== 'Admin' && (
                      <Link
                        to="/profile"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-650 hover:bg-gray-50 transition-colors font-bold"
                      >
                        <User size={15} /> โปรไฟล์ของฉัน
                      </Link>
                    )}
                    {user.role === 'SuperAdmin' && (
                      <Link
                        to="/superadmin/rooms"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-650 hover:bg-gray-50 transition-colors font-bold"
                      >
                        <Settings size={15} /> จัดการหลังบ้าน
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setShowUserDropdown(false)
                        setShowLogoutConfirm(true)
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-black border-t border-gray-50 mt-1"
                    >
                      <LogOut size={15} /> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="bg-white hover:bg-purple-50 text-[#8E24AA] font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-md">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
        {/* เพิ่ม Mobile Menu ตรงนี้ */}
        {showMobileMenu && (
          <div className="md:hidden pb-4 border-t border-white/10">
            <div className="flex flex-col pt-3 gap-1">

              <Link
                to="/"
                onClick={() => setShowMobileMenu(false)}
                className="px-4 py-3 rounded-xl text-sm font-bold text-purple-100 hover:text-white hover:bg-white/10"
              >
                ห้องประชุม
              </Link>

              <Link
                to="/calendar"
                onClick={() => setShowMobileMenu(false)}
                className="px-4 py-3 rounded-xl text-sm font-bold text-purple-100 hover:text-white hover:bg-white/10"
              >
                ปฏิทินการจอง
              </Link>

              <Link
                to="/my-bookings"
                onClick={() => setShowMobileMenu(false)}
                className="px-4 py-3 rounded-xl text-sm font-bold text-purple-100 hover:text-white hover:bg-white/10"
              >
                การจองของฉัน
              </Link>

            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-purple-50/20 text-slate-800">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">คุณต้องการออกจากระบบใช่ไหม?</h3>
            <p className="text-gray-400 text-xs mb-6">เมื่อออกจากระบบคุณจะต้องยืนยันตัวตนใหม่อีกครั้งสำหรับการทำรายการจอง</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-rose-500/15 cursor-pointer"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
