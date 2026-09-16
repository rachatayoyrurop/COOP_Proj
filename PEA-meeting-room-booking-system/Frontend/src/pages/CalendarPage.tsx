import { useEffect, useState } from 'react'
import { startOfWeek, addDays, isSameDay, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns'
import { th } from 'date-fns/locale'
import { getCalendar } from '../api/bookings'
import { getRooms } from '../api/rooms'
import type { Booking, Room, BookingStatus } from '../types'
import { ChevronLeft, ChevronRight, Filter, RefreshCw, Layers, Tag, Building, Users, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const STATUS_COLOR: Record<BookingStatus, { bg: string; border: string; text: string; dot: string; label: string }> = {
  Approved: {
    bg: 'bg-[#E8F5E9]/80 hover:bg-[#E8F5E9]',
    border: 'border-l-4 border-l-[#2E7D32] border-[#C8E6C9]',
    text: 'text-[#2E7D32]',
    dot: 'bg-[#2E7D32]',
    label: 'อนุมัติแล้ว'
  },
  Pending: {
    bg: 'bg-[#FFFDE7]/80 hover:bg-[#FFFDE7]',
    border: 'border-l-4 border-l-[#F9A825] border-[#FFF9C4]',
    text: 'text-[#F57F17]',
    dot: 'bg-[#F9A825]',
    label: 'รออนุมัติ'
  },
  Rejected: {
    bg: 'bg-[#FFEBEE]/80 hover:bg-[#FFEBEE]',
    border: 'border-l-4 border-l-[#C62828] border-[#FFCDD2]',
    text: 'text-[#C62828]',
    dot: 'bg-[#C62828]',
    label: 'ไม่อนุมัติ'
  },
  Canceled: {
    bg: 'bg-gray-50 hover:bg-gray-100',
    border: 'border-l-4 border-l-gray-400 border-gray-200',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
    label: 'ยกเลิก'
  }
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export default function CalendarPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  // Filters State
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all')
  const [statusFilters, setStatusFilters] = useState<Record<BookingStatus, boolean>>({
    Approved: true,
    Pending: true,
    Rejected: false,
    Canceled: false
  })

  // View Mode: 'month' | 'week' | 'day' (Mockup shows default Weekly Room Grid)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week')



  // Fetch Rooms
  useEffect(() => {
    getRooms().then((res) => {
      setRooms(res.data.data.filter((rm) => rm.is_active))
    })
  }, [])

  // Load Bookings with multi-month loading to avoid blank spaces in cross-month weeks
  const loadBookings = async (date: Date) => {
    setLoading(true)
    try {
      const monday = startOfWeek(date, { weekStartsOn: 1 })
      const sunday = addDays(monday, 6)

      const monYear = monday.getFullYear()
      const monMonth = monday.getMonth() + 1

      const sunYear = sunday.getFullYear()
      const sunMonth = sunday.getMonth() + 1

      // Load current month
      const res1 = await getCalendar({ year: monYear, month: monMonth })
      let merged = res1.data.data ?? []

      // Load adjacent month if week spans
      if (monYear !== sunYear || monMonth !== sunMonth) {
        const res2 = await getCalendar({ year: sunYear, month: sunMonth })
        const data2 = res2.data.data ?? []
        const existingIds = new Set(merged.map(b => b.booking_id))
        data2.forEach(b => {
          if (!existingIds.has(b.booking_id)) {
            merged.push(b)
          }
        })
      }

      setBookings(merged)
    } catch (e) {
      console.error('Failed to load bookings:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings(currentDate)
  }, [currentDate])

  // Navigation Logic
  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => addDays(prev, -7))
    } else if (viewMode === 'month') {
      const prevMonthDate = new Date(currentDate)
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
      setCurrentDate(prevMonthDate)
    } else {
      setCurrentDate((prev) => addDays(prev, -1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => addDays(prev, 7))
    } else if (viewMode === 'month') {
      const nextMonthDate = new Date(currentDate)
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
      setCurrentDate(nextMonthDate)
    } else {
      setCurrentDate((prev) => addDays(prev, 1))
    }
  }

  const clearFilters = () => {
    setSelectedRoomFilter('all')
    setStatusFilters({
      Approved: false,
      Pending: false,
      Rejected: false,
      Canceled: false
    })
  }

  // Get active week workdays (Mon-Sun)
  const monday = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = [
    addDays(monday, 5), // sat
    addDays(monday, 0), // mon
    addDays(monday, 1), // tue
    addDays(monday, 2), // wed
    addDays(monday, 3), // thu
    addDays(monday, 4), // fri
    addDays(monday, 6), // sun
  ]

  // Filter logic on bookings
  const filteredBookings = bookings.filter((b) => {
    if (b.status !== 'Approved' && b.status !== 'Pending') {
      return false
    }
    // Room Filter
    if (selectedRoomFilter !== 'all' && b.room_id !== Number(selectedRoomFilter)) {
      return false
    }
    // Status Filter
    return statusFilters[b.status]
  })

  // Format header dates
  const formatHeaderThai = (date: Date) => {
    const dayName = THAI_DAYS[date.getDay()]
    const displayDayName = dayName.replace('วัน', '')
    return `${displayDayName} ${date.getDate()} ${THAI_MONTHS_SHORT[date.getMonth()]}`
  }

  return (
    <div className="max-w-[1400px] mx-auto p-1 sm:p-2">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">ปฏิทินการจองห้องประชุม</h1>
        <p className="text-gray-400 text-sm font-semibold mt-1">ติดตามและเช็คตารางจองห้องประชุมทั้งหมดแบบเรียลไทม์</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Mockup Filter Box */}
        <div className="bg-white rounded-2xl border border-purple-100/30 p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
            <Filter size={16} className="text-pea-purple" />
            <h3 className="font-extrabold text-gray-800 text-sm">ตัวกรอง</h3>
          </div>

          {/* Room Filter Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ห้องประชุม</label>
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="w-full border border-purple-100/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple bg-white text-gray-700 font-bold transition-all shadow-sm"
            >
              <option value="all">ทั้งหมด</option>
              {rooms.map((r) => (
                <option key={r.room_id} value={r.room_id}>
                  {r.room_name} ({r.capacity} ที่นั่ง)
                </option>
              ))}
            </select>
          </div>

          {/* Booking Status Checkboxes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">สถานะการจอง</label>
            <div className="space-y-2.5">
              {(['Approved', 'Pending'] as BookingStatus[]).map((status) => {
                const conf = STATUS_COLOR[status]
                return (
                  <label key={status} className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={statusFilters[status]}
                      onChange={(e) => setStatusFilters({ ...statusFilters, [status]: e.target.checked })}
                      className="w-4.5 h-4.5 rounded text-pea-purple border-purple-100/30 focus:ring-pea-purple cursor-pointer accent-pea-purple transition-all"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${conf.dot}`} />
                      <span>{conf.label}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="w-full py-2.5 text-center text-xs font-extrabold border border-purple-100/30 hover:bg-gray-50 text-gray-500 hover:text-gray-700 rounded-xl transition-all shadow-sm cursor-pointer mt-4 flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={12} />
            ล้างตัวกรอง
          </button>
        </div>

        {/* Right Side: Main Schedule Board */}
        <div className="lg:col-span-3 space-y-5">
          {/* Controls Header */}
          <div className="bg-white rounded-2xl border border-purple-100/30 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* Date Navigator */}
            <div className="flex items-center justify-between md:justify-start gap-2.5">
              <button
                onClick={handlePrev}
                className="p-2 border border-slate-50 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              <h2 className="font-extrabold text-gray-800 text-sm sm:text-base w-40 sm:w-48 text-center tracking-tight">
                {viewMode === 'week' ? (
                  <>
                    {THAI_MONTHS[weekDays[0].getMonth()]} {weekDays[0].getFullYear() + 543}
                  </>
                ) : (
                  <>
                    {THAI_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                  </>
                )}
              </h2>
              <button
                onClick={handleNext}
                className="p-2 border border-purple-100/30 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>

            {/* View Select Toggles */}
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 p-1 rounded-xl flex gap-1 shadow-inner border border-purple-100/10">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${viewMode === 'month'
                    ? 'bg-white text-pea-purple shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  เดือน
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${viewMode === 'week'
                    ? 'bg-white text-pea-purple shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  สัปดาห์
                </button>
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${viewMode === 'day'
                    ? 'bg-white text-pea-purple shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  วัน
                </button>
              </div>

              {/* Small Action Icons */}
              <button
                onClick={() => loadBookings(currentDate)}
                className="p-2 border border-purple-100/30 hover:bg-gray-50 rounded-xl text-gray-500 transition-colors shadow-sm cursor-pointer"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Calendar Area */}
          <div className="bg-white rounded-2xl border border-purple-100/30 shadow-sm overflow-hidden min-h-[480px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[480px] text-gray-400 gap-3">
                <RefreshCw size={36} className="animate-spin text-pea-purple" />
                <p className="font-semibold text-sm">กำลังโหลดข้อมูลปฏิทิน...</p>
              </div>
            ) : viewMode === 'week' ? (
              // STUNNING Row-based Weekly Room Schedule Timeline Grid (MOCKUP EXACT STYLE)
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
                  <colgroup>
                    <col className="w-[16%]" />

                    {weekDays.map((day) => (
                      <col
                        key={day.toISOString()}
                        className="w-[12%]"
                      />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-50 border-b border-purple-100/30">
                      {/* Empty Corner */}
                      <th className="px-2 py-4  text-xs font-bold text-gray-400 uppercase tracking-wider w-[220px] border-r border-purple-100/30 bg-gray-50">
                        ห้องประชุม
                      </th>
                      {/* Mon - Fri headers */}
                      {weekDays.map((day) => {
                        const activeToday = isToday(day)
                        return (
                          <th
                            key={day.toISOString()}
                            className={`px-2 py-4  text-center text-xs font-extrabold border-r border-purple-100/30 last:border-r-0 ${activeToday ? 'bg-purple-50 text-pea-purple' : 'text-gray-500'
                              }`}
                          >
                            <span className="block">{formatHeaderThai(day)}</span>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 font-semibold text-sm">
                          ไม่พบข้อมูลห้องประชุม
                        </td>
                      </tr>
                    ) : (
                      rooms
                        .filter((r) => selectedRoomFilter === 'all' || r.room_id === Number(selectedRoomFilter))
                        .map((room) => (
                          <tr key={room.room_id} className="border-b border-purple-100/30 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                            {/* Room Row Header */}
                            <td className="p-4 border-r border-purple-100/30 font-bold bg-white/50 align-top">
                              <h4 className="text-gray-800 text-sm leading-snug">{room.room_name}</h4>
                              <span className="inline-block text-[11px] font-black text-gray-400 mt-1 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                                {room.capacity} ที่นั่ง
                              </span>
                            </td>

                            {/* Booking Cells for days Mon-Fri */}
                            {weekDays.map((day) => {
                              // Filter bookings for this room on this day
                              const dayBookings = filteredBookings.filter((b) => {
                                return b.room_id === room.room_id && isSameDay(new Date(b.start_date), day)
                              })

                              // Sort day bookings chronologically
                              dayBookings.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

                              return (
                                <td
                                  key={`${room.room_id}-${day.toISOString()}`}
                                  className={`p-3 border-r border-purple-100/30 last:border-r-0 align-top w-[18%] ${isToday(day) ? 'bg-purple-50/15' : ''
                                    }`}
                                >
                                  {dayBookings.length === 0 ? (
                                    <div className="h-16 flex items-center justify-center text-gray-300 text-[10px] font-semibold italic">
                                      ไม่มีการจอง
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {dayBookings.map((b) => {
                                        const c = STATUS_COLOR[b.status]
                                        const startStr = format(new Date(b.start_date), 'HH:mm')
                                        const endStr = format(new Date(b.end_date), 'HH:mm')

                                        return (
                                          <div
                                            key={b.booking_id}
                                            className={`p-2.5 rounded-xl border text-[11px] transition-all cursor-pointer ${c.bg} ${c.border} ${c.text} hover:shadow-md hover:scale-[1.01]`}
                                            title={`${b.title}\nผู้จอง: ${b.user?.full_name ?? b.emp_id}\nสถานะ: ${c.label}`}
                                          >
                                            {/* Time range */}
                                            <div className="font-extrabold text-[10px] tracking-wide flex items-center gap-1">
                                              <Clock size={11} className="shrink-0" />
                                              <span>{startStr} - {endStr} น.</span>
                                            </div>
                                            {/* Meeting title */}
                                            <div className="font-extrabold text-gray-800 mt-1 leading-snug break-words">
                                              {b.title}
                                            </div>
                                            {/* Booker Dept or user info */}
                                            <div className="text-[10px] text-gray-400 font-bold mt-1.5 tracking-tight truncate">
                                              {b.user?.department ? `${b.user.department}` : b.user?.full_name ?? `ID: ${b.emp_id}`}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : viewMode === 'month' ? (
              // STUNNING Grid Monthly View
              <div>
                {/* Day Grid Header */}
                <div className="grid grid-cols-7 border-b border-purple-100/30 bg-gray-50 text-center font-extrabold text-xs text-gray-500 py-3 uppercase tracking-wider">
                  {THAI_DAYS_SHORT.map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                {/* Day Grid Cells */}
                <div className="grid grid-cols-7 divide-x divide-y divide-purple-100/20 border-t border-purple-100/20">
                  {(() => {
                    const firstDay = startOfMonth(currentDate)
                    const lastDay = endOfMonth(currentDate)
                    const monthDays = eachDayOfInterval({ start: firstDay, end: lastDay })

                    const startPad = getDay(firstDay) // 0 for Sun
                    const pads = Array.from({ length: startPad })

                    return (
                      <>
                        {/* Empty Padding Cells */}
                        {pads.map((_, idx) => (
                          <div key={`pad-${idx}`} className="h-28 bg-gray-50/50 border-r border-b border-purple-100/20" />
                        ))}

                        {/* Actual Day Cells */}
                        {monthDays.map((day) => {
                          const isDayToday = isToday(day)
                          const dayBookings = filteredBookings.filter((b) => isSameDay(new Date(b.start_date), day))
                          dayBookings.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

                          return (
                            <div
                              key={day.toISOString()}
                              className={`h-28 p-2 border-r border-b border-purple-100/20 flex flex-col justify-between align-top overflow-hidden hover:bg-gray-50 transition-colors group cursor-pointer`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`w-6 h-6 inline-flex items-center justify-center text-xs font-extrabold rounded-full ${isDayToday
                                    ? 'bg-pea-purple text-white shadow-sm shadow-purple-500/20'
                                    : 'text-gray-700 group-hover:text-pea-purple'
                                    }`}
                                >
                                  {day.getDate()}
                                </span>
                                {dayBookings.length > 0 && (
                                  <span className="text-[9px] font-bold text-gray-400">
                                    {dayBookings.length} รายการ
                                  </span>
                                )}
                              </div>

                              <div className="flex-1 mt-1.5 space-y-1 overflow-y-auto scrollbar-thin">
                                {dayBookings.slice(0, 3).map((b) => {
                                  const c = STATUS_COLOR[b.status]
                                  return (
                                    <div
                                      key={b.booking_id}
                                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border truncate flex items-center gap-1 ${c.bg} ${c.border} ${c.text}`}
                                      title={`${b.title} (${format(new Date(b.start_date), 'HH:mm')} - ${format(new Date(b.end_date), 'HH:mm')})`}
                                    >
                                      <span className={`w-1 h-1 rounded-full shrink-0 ${c.dot}`} />
                                      <span className="truncate">{b.title}</span>
                                    </div>
                                  )
                                })}
                                {dayBookings.length > 3 && (
                                  <div className="text-[9px] text-gray-400 font-extrabold pl-1">
                                    +{dayBookings.length - 3} เพิ่มเติม
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* STUNNING Single Day view list */}
                <div className="flex items-center justify-between pb-4 border-b border-purple-100/30">
                  <h3 className="font-extrabold text-gray-800 text-base">
                    รายการจองประจำวันที่ {format(currentDate, 'd MMMM yyyy', { locale: th })}
                  </h3>
                  <span className="text-xs font-bold text-gray-400">
                    มีทั้งหมด {filteredBookings.filter(b => isSameDay(new Date(b.start_date), currentDate)).length} การจอง
                  </span>
                </div>

                <div className="space-y-4">
                  {filteredBookings.filter(b => isSameDay(new Date(b.start_date), currentDate)).length === 0 ? (
                    <div className="text-center py-20 text-gray-450">
                      <p className="font-bold text-sm">ไม่มีการจองในวันนี้</p>
                      <p className="text-xs text-gray-400 mt-1">คลิกปุ่ม "จองห้องประชุม" เพื่อสร้างการจองใหม่</p>
                    </div>
                  ) : (
                    filteredBookings
                      .filter(b => isSameDay(new Date(b.start_date), currentDate))
                      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                      .map((b) => {
                        const c = STATUS_COLOR[b.status]
                        return (
                          <div
                            key={b.booking_id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-md ${c.bg} ${c.border}`}
                          >
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
                                <Tag size={11} className="shrink-0" />
                                <span>Code: {b.booking_code}</span>
                              </span>
                              <h4 className="font-extrabold text-gray-800 text-sm sm:text-base leading-snug">
                                {b.title}
                              </h4>
                              {b.objective && (
                                <p className="text-xs text-gray-500 font-medium italic mt-1 bg-white/40 px-2.5 py-1 rounded-lg inline-block">
                                  วัตถุประสงค์: {b.objective}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 sm:mt-0 text-left sm:text-right shrink-0">
                              <span className="text-xs font-black text-pea-purple flex items-center sm:justify-end gap-1 tracking-wide">
                                <Clock size={12} className="shrink-0" /> {format(new Date(b.start_date), 'HH:mm')} - {format(new Date(b.end_date), 'HH:mm น.')}
                              </span>
                              <div className="flex items-center sm:justify-end gap-1.5 mt-2">
                                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                                <span className={`text-xs font-extrabold ${c.text}`}>{c.label}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            )}

            {/* Bottom Color Legends Panel */}
            <div className="bg-gray-50 px-6 py-4 border-t border-purple-100/30 flex flex-wrap gap-4 items-center justify-center sm:justify-start">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
                <Layers size={12} className="text-gray-400" />
                คำอธิบายสถานะ:
              </span>
              {(['Approved', 'Pending'] as BookingStatus[]).map((status) => {
                const conf = STATUS_COLOR[status]
                return (
                  <div key={status} className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                    <span className={`w-3.5 h-3.5 rounded-md ${conf.dot} opacity-90 inline-block`} />
                    <span>{conf.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

