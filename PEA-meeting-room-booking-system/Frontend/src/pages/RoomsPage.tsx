import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRooms } from '../api/rooms'
import type { Room } from '../types'
import { useAuth } from '../context/AuthContext'
import { Users, Mic, Monitor, Tv, ImageOff, Search, SlidersHorizontal } from 'lucide-react'

type SizeCategory = 'all' | 'small' | 'medium' | 'large'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sizeFilter, setSizeFilter] = useState<SizeCategory>('all')
  const [buildingFilter, setBuildingFilter] = useState<string>('all')
  const [showWelcome, setShowWelcome] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Segregate Roles: Standard Admins go to /admin dashboard, cannot see standard User pages.
  useEffect(() => {
    if (user && user.role === 'Admin') {
      navigate('/admin')
    }
  }, [user, navigate])

  useEffect(() => {
    getRooms()
      .then((r) => setRooms(r.data.data))
      .finally(() => setLoading(false))

    // Show temporary welcome toast once per session
    const hasShown = sessionStorage.getItem('pea_welcome_shown')
    if (!hasShown) {
      setShowWelcome(true)
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true)
      }, 4500)
      const hideTimer = setTimeout(() => {
        setShowWelcome(false)
        sessionStorage.setItem('pea_welcome_shown', 'true')
      }, 5200)
      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [])

  // Dynamic buildings list from rooms
  const uniqueBuildings = Array.from(
    new Set(
      rooms
        .filter((r) => r.is_active && r.building)
        .map((r) => r.building as string)
    )
  ).sort()

  // Filter logic based on search, capacity range, and building selection
  const filtered = rooms.filter((r) => {
    if (!r.is_active) return false
    
    const matchesSearch = r.room_name.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    
    // Capacity Range Category
    if (sizeFilter === 'small') {
      if (!(r.capacity >= 1 && r.capacity <= 10)) return false
    } else if (sizeFilter === 'medium') {
      if (!(r.capacity >= 11 && r.capacity <= 30)) return false
    } else if (sizeFilter === 'large') {
      if (!(r.capacity >= 31)) return false
    }

    // Building Selector Filter
    if (buildingFilter !== 'all') {
      if (r.building !== buildingFilter) return false
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-3xl shadow-sm border border-purple-50/40 overflow-hidden animate-pulse">
            <div className="h-56 bg-gray-200" />
            <div className="p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-150 rounded w-1/2" />
              <div className="h-12 bg-gray-150 rounded w-full mt-6" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Dynamic Animated Welcome Toast */}
      {showWelcome && (
        <div 
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90%] max-w-sm sm:max-w-md ${
            isFadingOut ? 'animate-toast-out' : 'animate-toast-in'
          }`}
        >
          <div className="bg-gradient-to-r from-[#8E24AA] via-[#ab47bc] to-[#7b1fa2] text-white px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(142,36,170,0.35)] border border-white/20 flex flex-col items-center text-center gap-1.5 animate-bounce-subtle">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-200">ระบบจองห้องประชุมออนไลน์</p>
            <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight">ยินดีต้อนรับสู่ การไฟฟ้าส่วนภูมิภาค</h4>
          </div>
        </div>
      )}

      {/* Title Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">
            ห้องประชุม
          </h1>
          <p className="text-gray-400 text-sm font-semibold mt-1">เลือกห้องประชุมที่เหมาะสมกับความต้องการของคุณ</p>
        </div>
        
        {/* Search and Advanced Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อห้อง หรือสถานที่..."
              className="pl-10 pr-4 py-2.5 w-full border border-purple-50/50 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8E24AA] bg-white shadow-sm transition-all placeholder-gray-400 font-bold"
            />
          </div>

          {/* Building Selector Dropdown */}
          <div className="relative shrink-0">
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="pl-3 pr-9 py-2.5 border border-purple-50/50 rounded-xl text-xs sm:text-sm font-extrabold text-gray-600 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E24AA] appearance-none cursor-pointer transition-all"
            >
              <option value="all">อาคาร: ทั้งหมด</option>
              {uniqueBuildings.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
            <SlidersHorizontal size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-450 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filter Chips - capacity range based on mockup */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { key: 'all', label: 'ทั้งหมด' },
          { key: 'small', label: 'ขนาดเล็ก (1-10 ที่นั่ง)' },
          { key: 'medium', label: 'ขนาดกลาง (11-30 ที่นั่ง)' },
          { key: 'large', label: 'ขนาดใหญ่ (31+ ที่นั่ง)' }
        ].map((chip) => (
          <button
            key={chip.key}
            onClick={() => setSizeFilter(chip.key as SizeCategory)}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-sm transition-all border cursor-pointer ${
              sizeFilter === chip.key
                ? 'bg-[#8E24AA] text-white border-[#8E24AA] shadow-purple-500/15 scale-[1.01]'
                : 'bg-white border-purple-50/40 text-gray-500 hover:text-gray-700 hover:bg-purple-50/20'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Rooms Grid - 2 columns for Hotel-Style spacious presentation */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-purple-50/20 py-20 text-center text-gray-400 shadow-sm">
          <Monitor size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-sm">ไม่พบห้องประชุมที่ตรงกับเงื่อนไข</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filtered.map((room) => (
            <RoomCard
              key={room.room_id}
              room={room}
              onDetail={() => navigate(`/rooms/${room.room_id}`)}
              onBook={() => navigate(`/book/${room.room_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CardProps {
  room: Room
  onDetail: () => void
  onBook: () => void
}

function RoomCard({ room, onDetail, onBook }: CardProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const images = room.images && room.images.length > 0 ? room.images : []

  useEffect(() => {
    if (!isHovered || images.length <= 1) {
      setCurrentIdx(0)
      return
    }

    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length)
    }, 1800)

    return () => clearInterval(interval)
  }, [isHovered, images])

  // Get status badge colors
  const getStatusDisplay = () => {
    switch (room.status) {
      case 'In Use':
        return {
          label: 'กำลังใช้งาน',
          className: 'bg-rose-600/90 text-white backdrop-blur-sm shadow-sm',
          dotClass: 'bg-rose-400'
        }
      case 'Reserved':
        return {
          label: 'จองแล้ววันนี้',
          className: 'bg-amber-500/90 text-white backdrop-blur-sm shadow-sm',
          dotClass: 'bg-amber-300'
        }
      case 'Available':
      default:
        return {
          label: 'ว่าง',
          className: 'bg-emerald-600/90 text-white backdrop-blur-sm shadow-sm',
          dotClass: 'bg-emerald-300'
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-3xl shadow-sm border border-purple-50/20 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
    >
      {/* Image Block */}
      <div className="relative h-56 bg-gray-50 overflow-hidden shrink-0" onClick={onDetail}>
        {images.length > 0 ? (
          <div className="w-full h-full relative">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${room.room_name} - ${idx}`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                  idx === currentIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x300?text=PEA+Room' }}
              />
            ))}
            
            {/* Indicators */}
            {images.length > 1 && isHovered && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/5">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1 h-1 rounded-full transition-all duration-300 ${
                      idx === currentIdx ? 'bg-white w-2' : 'bg-white/45'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <ImageOff size={44} className="opacity-30" />
          </div>
        )}

        {/* Floating Occupancy Badge */}
        <div className={`absolute top-3.5 right-3.5 flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${statusDisplay.className}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDisplay.dotClass}`} />
          {statusDisplay.label}
        </div>
      </div>

      {/* Info Block */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          {/* Room Name */}
          <h3 className="text-lg font-black text-gray-800 group-hover:text-[#8E24AA] transition-colors truncate" onClick={onDetail}>
            {room.room_name}
          </h3>

          {/* Simplified Equipment Specs Display ONLY: Capacity, Monitor, PC, Mic */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-purple-50/20 text-xs text-gray-400 font-bold uppercase tracking-wider">
            {/* Capacity */}
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-gray-350" />
              <span>ความจุ: <strong className="text-gray-700 font-black">{room.capacity}</strong> ที่นั่ง</span>
            </div>

            {/* Screen */}
            <EquipIcon icon={<Monitor size={14} />} count={room.screen_count} label="จอภาพ" />
            
            {/* PC */}
            <EquipIcon icon={<Tv size={14} />} count={room.pc_count} label="คอมพิวเตอร์" />
            
            {/* Mic */}
            <EquipIcon icon={<Mic size={14} />} count={room.mic_count} label="ไมโครโฟน" />
          </div>
        </div>

        {/* Card Footer Actions side-by-side buttons based on Mockup */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onDetail() }}
            className="flex-1 py-2.5 border border-purple-50/50 hover:bg-purple-50/20 text-[#8E24AA] text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer bg-white shadow-sm"
          >
            ดูรายละเอียด
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBook() }}
            className="flex-1 py-2.5 bg-[#8E24AA] hover:bg-[#7b1fa2] text-white text-xs sm:text-sm font-black rounded-xl transition-all shadow-md shadow-purple-500/10 cursor-pointer text-center"
          >
            จองห้องประชุม
          </button>
        </div>
      </div>
    </div>
  )
}

function EquipIcon({ icon, count, label }: { icon: React.ReactNode; count: number; label: string }) {
  if (count <= 0) return null
  return (
    <div className="flex items-center gap-1.5 text-gray-400">
      <span className="text-gray-350">{icon}</span>
      <span>{label}: <strong className="text-gray-700 font-black">{count}</strong></span>
    </div>
  )
}
