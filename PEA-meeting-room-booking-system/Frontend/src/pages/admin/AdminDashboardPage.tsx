import { useEffect, useState } from 'react'
import { getAllBookings, getPendingBookings, approveBooking, rejectBooking, searchByCode } from '../../api/admin'
import type { Booking, BookingStatus } from '../../types'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Clock, 
  CalendarDays, 
  Users, 
  Layers, 
  LogOut, 
  ShieldAlert,
  Calendar,
  Grid,
  FileText,
  Settings,
  Download,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import peaLogo from '../../assets/pea-logo.png'

const STATUS_CONFIG: Record<BookingStatus, { bg: string; text: string; label: string }> = {
  Approved: {
    bg: 'bg-emerald-50/30 border border-emerald-100/40',
    text: 'text-emerald-700',
    label: 'อนุมัติแล้ว'
  },
  Pending: {
    bg: 'bg-amber-50/30 border border-amber-100/40',
    text: 'text-amber-700',
    label: 'รออนุมัติ'
  },
  Rejected: {
    bg: 'bg-rose-50/30 border border-rose-100/40',
    text: 'text-rose-700',
    label: 'ไม่อนุมัติ'
  },
  Canceled: {
    bg: 'bg-gray-50/30 border border-gray-100/40',
    text: 'text-gray-500',
    label: 'ยกเลิก'
  }
}

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState<{ id: number; code: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [searchCode, setSearchCode] = useState('')
  const [searchResult, setSearchResult] = useState<Booking | null>(null)
  const [searchError, setSearchError] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 10

  const { logout, user } = useAuth()
  const navigate = useNavigate()

  // Guard: if standard User role, block direct dashboard access and redirect
  useEffect(() => {
    if (user && user.role === 'User') {
      navigate('/')
    }
  }, [user, navigate])

  const load = async () => {
    setLoading(true)
    try {
      const res = await getAllBookings()
      setBookings(res.data.data ?? [])
    } catch (e) {
      console.error('Failed to load bookings:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (id: number) => {
    setActionLoading(id)
    try {
      await approveBooking(id)
      await load()
      if (searchResult?.booking_id === id) {
        // Update search result if active
        setSearchResult({ ...searchResult, status: 'Approved' })
      }
    } catch (e) {
      console.error('Approve failed:', e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return
    setActionLoading(rejectModal.id)
    try {
      await rejectBooking(rejectModal.id, rejectReason)
      setRejectModal(null)
      setRejectReason('')
      await load()
      if (searchResult?.booking_id === rejectModal.id) {
        // Update search result if active
        setSearchResult({ ...searchResult, status: 'Rejected', reject_reason: rejectReason })
      }
    } catch (e) {
      console.error('Reject failed:', e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSearch = async () => {
    setSearchError('')
    setSearchResult(null)
    if (!searchCode.trim()) return
    try {
      const res = await searchByCode(searchCode.trim())
      setSearchResult(res.data.data)
    } catch {
      setSearchError('ไม่พบรหัสอ้างอิงการจองนี้ในระบบ')
    }
  }

  // Calculate Metrics dynamically
  const totalCount = bookings.length
  const approvedCount = bookings.filter(b => b.status === 'Approved').length
  const pendingCount = bookings.filter(b => b.status === 'Pending').length
  const rejectedCount = bookings.filter(b => b.status === 'Rejected' || b.status === 'Canceled').length

  // Filter Bookings dynamically based on Status, Search Bar, and Date
  const filteredBookings = bookings.filter((b) => {
    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'Pending' && b.status !== 'Pending') return false
      if (statusFilter === 'Approved' && b.status !== 'Approved') return false
      if (statusFilter === 'Rejected' && b.status !== 'Rejected' && b.status !== 'Canceled') return false
    }

    // Date Filter
    if (dateFilter) {
      const bDate = format(new Date(b.start_date), 'yyyy-MM-dd')
      if (bDate !== dateFilter) return false
    }

    // Search Query Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      const titleMatch = b.title?.toLowerCase().includes(q)
      const codeMatch = b.booking_code?.toLowerCase().includes(q)
      const userMatch = b.user?.full_name?.toLowerCase().includes(q) || b.emp_id?.toLowerCase().includes(q)
      const deptMatch = b.user?.department?.toLowerCase().includes(q)
      const roomMatch = b.room?.room_name?.toLowerCase().includes(q)
      return titleMatch || codeMatch || userMatch || deptMatch || roomMatch
    }

    return true
  })

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery, dateFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredBookings.length)
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage)

  // Real CSV Export Functionality
  const exportToCSV = () => {
    // Header columns
    const headers = ['ลำดับ', 'รหัสการจอง', 'หัวเรื่องการประชุม', 'ห้องประชุม', 'วันที่', 'เวลาเริ่ม', 'เวลาสิ้นสุด', 'ผู้ประสานงาน', 'หน่วยงาน', 'จำนวนผู้เข้าร่วม', 'สถานะ']
    
    // Rows
    const rows = filteredBookings.map((b, idx) => {
      const dateStr = format(new Date(b.start_date), 'dd/MM/yyyy')
      const startStr = format(new Date(b.start_date), 'HH:mm')
      const endStr = format(new Date(b.end_date), 'HH:mm')
      
      let coordinator = b.user?.full_name ?? `ID: ${b.emp_id}`
      let dept = b.user?.department ?? ''
      if (b.objective && b.objective.includes('ผู้ประสานงาน:')) {
        const parts = b.objective.split(' | ')
        coordinator = parts[0]?.replace('ผู้ประสานงาน: ', '') || coordinator
        dept = parts[1]?.replace('หน่วยงาน: ', '') || dept
      }

      const statusLabel = STATUS_CONFIG[b.status]?.label ?? b.status

      return [
        idx + 1,
        b.booking_code,
        `"${b.title.replace(/"/g, '""')}"`,
        `"${b.room?.room_name.replace(/"/g, '""')}"`,
        dateStr,
        startStr,
        endStr,
        `"${coordinator.replace(/"/g, '""')}"`,
        `"${dept.replace(/"/g, '""')}"`,
        b.participant_count,
        statusLabel
      ]
    })

    // Combine headers and rows
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'PEA_Booking_Report.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Format Helper for Thai Date Picker range (Mockup Text)
  const todayStr = format(new Date(), 'dd/MM/yyyy', { locale: th })

  return (
    <div className="max-w-[1400px] mx-auto p-1 sm:p-2">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left Side: Mockup PEA Corporate Purple Sidebar */}
        <div className="w-full lg:w-64 shrink-0 bg-[#8E24AA] text-white rounded-3xl p-5 shadow-xl flex flex-col justify-between min-h-[680px] border border-white/10">
          <div className="space-y-6">
            {/* Sidebar Logo */}
            <div className="flex items-center gap-3 px-2 pb-4 border-b border-white/20">
              <img
                src={peaLogo}
                alt="PEA Logo"
                className="h-10 w-auto object-contain bg-white/10 p-1 rounded-xl border border-white/10"
              />
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-white">PEA</h3>
                <p className="text-[11px] text-purple-200 font-bold tracking-wide">ผู้ดูแลระบบ</p>
              </div>
            </div>

            {/* Navigation List */}
            <nav className="space-y-1">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer text-left ${
                  statusFilter === 'all' && searchQuery === ''
                    ? 'bg-white/20 text-white shadow-inner font-extrabold border border-white/5' 
                    : 'text-purple-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Grid size={16} />
                <span>ภาพรวมการจอง</span>
              </button>
              
              <button 
                onClick={() => { setStatusFilter('Pending'); setSearchQuery('') }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  statusFilter === 'Pending' 
                    ? 'bg-white/20 text-white shadow-inner font-extrabold border border-white/5' 
                    : 'text-purple-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock size={16} />
                  <span>คำขอรออนุมัติ</span>
                </div>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => navigate('/calendar')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-purple-100 hover:bg-white/10 hover:text-white text-xs font-black transition-all text-left cursor-pointer"
              >
                <Calendar size={16} />
                <span>ปฏิทินการจอง</span>
              </button>

              {/* SuperAdmin features only */}
              {user?.role === 'SuperAdmin' && (
                <>
                  <button 
                    onClick={() => navigate('/superadmin/rooms')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-purple-100 hover:bg-white/10 hover:text-white text-xs font-black transition-all text-left cursor-pointer"
                  >
                    <Layers size={16} />
                    <span>ห้องประชุม (CRUD)</span>
                  </button>

                  <button 
                    onClick={() => navigate('/superadmin/users')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-purple-100 hover:bg-white/10 hover:text-white text-xs font-black transition-all text-left cursor-pointer"
                  >
                    <Users size={16} />
                    <span>ผู้ใช้งาน</span>
                  </button>

                  <button 
                    onClick={() => navigate('/superadmin/booking-logs')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-purple-100 hover:bg-white/10 hover:text-white text-xs font-black transition-all text-left cursor-pointer"
                  >
                    <FileText size={16} />
                    <span>รายงาน (Audit Log)</span>
                  </button>
                </>
              )}

              {/* Logout inside list */}
              <button 
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 hover:text-white text-xs font-black transition-all text-left cursor-pointer border border-transparent"
              >
                <LogOut size={16} className="text-white" />
                <span>ออกจากระบบ</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Right Side: Main Dashboard Console */}
        <div className="flex-1 space-y-6 w-full">
          
          {/* Header row */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">คำขอจองห้องประชุม</h1>
            <p className="text-gray-400 text-sm font-semibold mt-1">อนุมัติ ปฏิเสธ หรือตรวจสอบบันทึกการจองอย่างละเอียด</p>
          </div>

          {/* Dynamic Metric Cards Row (EXACT MOCKUP STYLE) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: Total */}
            <div className="bg-purple-50/10 rounded-2xl border border-purple-100/30 p-5 shadow-sm space-y-2">
              <span className="text-purple-700/80 text-xs font-bold block uppercase tracking-wider">คำขอทั้งหมด</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800">{totalCount} <span className="text-xs sm:text-sm font-bold text-gray-400">รายการ</span></h2>
            </div>

            {/* Card 2: Approved */}
            <div className="bg-emerald-50/10 rounded-2xl border border-emerald-100 p-5 shadow-sm space-y-2">
              <span className="text-emerald-700 text-xs font-bold block uppercase tracking-wider">อนุมัติแล้ว</span>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-700">{approvedCount} <span className="text-xs sm:text-sm font-bold text-emerald-500">รายการ</span></h2>
            </div>

            {/* Card 3: Pending */}
            <div className="bg-amber-50/10 rounded-2xl border border-amber-100 p-5 shadow-sm space-y-2">
              <span className="text-amber-700 text-xs font-bold block uppercase tracking-wider">รออนุมัติ</span>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-700">{pendingCount} <span className="text-xs sm:text-sm font-bold text-amber-500">รายการ</span></h2>
            </div>

            {/* Card 4: Rejected */}
            <div className="bg-rose-50/10 rounded-2xl border border-rose-100 p-5 shadow-sm space-y-2">
              <span className="text-rose-700 text-xs font-bold block uppercase tracking-wider">ไม่อนุมัติ</span>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-700">{rejectedCount} <span className="text-xs sm:text-sm font-bold text-rose-500">รายการ</span></h2>
            </div>
          </div>

          {/* Filtering Row Panel (EXACT MOCKUP LAYOUT) */}
          <div className="bg-white rounded-3xl border border-purple-100/40 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Status Dropdown */}
              <div className="w-full sm:w-40">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-pea-purple"
                >
                  <option value="all">สถานะ: ทั้งหมด</option>
                  <option value="Pending">รออนุมัติ</option>
                  <option value="Approved">อนุมัติแล้ว</option>
                  <option value="Rejected">ไม่อนุมัติ</option>
                </select>
              </div>

              {/* Active Datepicker Picker */}
              <div className="w-full sm:w-48 relative">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-750 bg-white focus:outline-none focus:ring-2 focus:ring-pea-purple"
                />
                {dateFilter && (
                  <button 
                    onClick={() => setDateFilter('')}
                    className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[10px] font-bold"
                  >
                    ล้าง
                  </button>
                )}
              </div>

              {/* Search text */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหารหัสการจอง, ผู้จอง, หรือหัวข้อประชุม..."
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pea-purple font-medium"
                />
              </div>
            </div>

            {/* Export data button */}
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-1.5 bg-[#8E24AA] hover:bg-[#7b1fa2] text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Download size={14} />
              <span>ส่งออกข้อมูล</span>
            </button>
          </div>

          {/* Requests Tabular Table Grid */}
          <div className="bg-white rounded-3xl border border-purple-100/40 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#8E24AA] text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-4 w-[50px] text-center rounded-tl-3xl">ลำดับ</th>
                    <th className="p-4 w-[220px]">หัวข้อการประชุม / รหัส</th>
                    <th className="p-4 w-[140px]">ห้องประชุม</th>
                    <th className="p-4 w-[110px]">วันที่จอง</th>
                    <th className="p-4 w-[110px]">เวลา</th>
                    <th className="p-4 w-[130px]">ผู้จอง / แผนก</th>
                    <th className="p-4 w-[120px] text-center">สถานะ</th>
                    <th className="p-4 w-[120px] text-center rounded-tr-3xl">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400 font-semibold text-sm">
                        <Clock className="animate-spin text-pea-purple mx-auto mb-2" size={24} />
                        กำลังดึงข้อมูลรายการคำขอ...
                      </td>
                    </tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-16 text-center text-gray-400 font-semibold text-sm">
                        <ShieldAlert className="opacity-20 mx-auto mb-3" size={40} />
                        ไม่พบคำขอจองห้องประชุมตามเงื่อนไขตัวกรอง
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map((b, idx) => {
                      const c = STATUS_CONFIG[b.status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: b.status }
                      const startStr = format(new Date(b.start_date), 'HH:mm')
                      const endStr = format(new Date(b.end_date), 'HH:mm')
                      const dateStr = format(new Date(b.start_date), 'dd/MM/yyyy')
                      
                      // Pull coordinator/dept from objective if structured, else fallback
                      let coordinator = b.user?.full_name ?? `พนักงาน: ${b.emp_id}`
                      let dept = b.user?.department ?? 'กองแผนงาน'
                      if (b.objective && b.objective.includes('ผู้ประสานงาน:')) {
                        const parts = b.objective.split(' | ')
                        coordinator = parts[0]?.replace('ผู้ประสานงาน: ', '') || coordinator
                        dept = parts[1]?.replace('หน่วยงาน: ', '') || dept
                      }

                      return (
                        <tr key={b.booking_id} className="border-b border-slate-100 last:border-b-0 hover:bg-gray-50/50 transition-colors text-xs">
                          {/* No. */}
                          <td className="p-4 text-center text-gray-400 font-bold">{startIndex + idx + 1}</td>
                          
                          {/* Title / Code */}
                          <td className="p-4 font-extrabold text-gray-800 leading-snug">
                            <div>{b.title}</div>
                            <span className="inline-block text-[9px] font-mono text-gray-400 mt-1 uppercase tracking-wide">
                              รหัส: {b.booking_code}
                            </span>
                          </td>

                          {/* Room Name */}
                          <td className="p-4 text-pea-purple font-black">{b.room?.room_name}</td>

                          {/* Date */}
                          <td className="p-4 font-bold text-gray-600">{dateStr}</td>

                          {/* Time */}
                          <td className="p-4 font-bold text-gray-800">{startStr} - {endStr} น.</td>

                          {/* Booker Info */}
                          <td className="p-4">
                            <div className="font-extrabold text-gray-800">{coordinator}</div>
                            <div className="text-[10px] text-gray-400 font-bold mt-0.5">{dept}</div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2.5 py-1 text-[10px] font-black rounded-lg ${c.bg} ${c.text}`}>
                              {c.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center align-middle">
                            {b.status === 'Pending' ? (
                              <div className="flex justify-center items-center gap-1.5">
                                <button
                                  onClick={() => handleApprove(b.booking_id)}
                                  disabled={actionLoading === b.booking_id}
                                  className="px-2 py-1 text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-1"
                                  title="อนุมัติการจอง"
                                >
                                  <span>อนุมัติ</span>
                                </button>
                                <button
                                  onClick={() => setRejectModal({ id: b.booking_id, code: b.booking_code })}
                                  className="px-2 py-1 text-[10px] font-black text-rose-600 border border-rose-250 hover:bg-rose-50 rounded-md transition-all cursor-pointer bg-white shrink-0 flex items-center gap-1"
                                  title="ปฏิเสธคำขอ"
                                >
                                  <span>ไม่อนุมัติ</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-bold tracking-wide italic">
                                ตรวจสอบแล้ว
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-gray-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-gray-400">
              <span>แสดง {filteredBookings.length > 0 ? startIndex + 1 : 0} ถึง {endIndex} จาก {filteredBookings.length} รายการ</span>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-2.5 py-1.5 border border-gray-250 bg-white hover:bg-gray-50 disabled:opacity-50 rounded-lg text-gray-500 font-black cursor-pointer shadow-sm disabled:cursor-not-allowed"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3.5 py-1.5 rounded-lg font-black shadow-sm cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-[#8E24AA] text-white'
                            : 'border border-gray-255 bg-white hover:bg-gray-50 text-gray-500'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-2.5 py-1.5 border border-gray-250 bg-white hover:bg-gray-50 disabled:opacity-50 rounded-lg text-gray-500 font-black cursor-pointer shadow-sm disabled:cursor-not-allowed"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Reject Reason input modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-purple-100/40 animate-scale-up">
            <h3 className="font-extrabold text-gray-800 text-lg mb-1 flex items-center gap-2">
              <span>🚫</span> ปฏิเสธคำขอจองห้องประชุม
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              รหัสจอง: {rejectModal.code}
            </p>
            
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase block">ระบุเหตุผลการไม่อนุมัติคำขอ *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น ห้องไม่ว่างในวันดังกล่าว หรือ ข้อมูลไม่ครบถ้วน..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            <div className="flex gap-3 mt-5 pt-3 border-t border-gray-100">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="flex-1 py-2.5 text-center text-xs font-black border border-gray-250 hover:bg-gray-50 text-gray-500 hover:text-gray-700 rounded-xl transition-all cursor-pointer bg-white"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading !== null}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-rose-500/10 cursor-pointer text-center"
              >
                ยืนยันการปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

