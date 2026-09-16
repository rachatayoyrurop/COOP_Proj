import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoom } from '../api/rooms'
import type { Room } from '../types'
import { useAuth } from '../context/AuthContext'
import ImageCarousel from '../components/ImageCarousel'
import { Users, Mic, Monitor, Tv, CalendarPlus, ArrowLeft } from 'lucide-react'

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    getRoom(Number(id))
      .then((r) => setRoom(r.data.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-72 bg-gray-200 rounded-2xl animate-pulse mb-6" />
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>ไม่พบห้องประชุม</p>
        <button onClick={() => navigate('/')} className="mt-3 text-pea-purple text-sm hover:underline">
          กลับไปหน้าหลัก
        </button>
      </div>
    )
  }

  const specs = [
    { icon: <Users size={18} />, label: 'ความจุ', value: `${room.capacity} คน` },
    { icon: <Mic size={18} />, label: 'ไมโครโฟน', value: `${room.mic_count} ตัว` },
    { icon: <Monitor size={18} />, label: 'คอมพิวเตอร์', value: `${room.pc_count} เครื่อง` },
    { icon: <Tv size={18} />, label: 'หน้าจอ', value: `${room.screen_count} จอ` },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-pea-purple mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        ย้อนกลับ
      </button>

      {/* Carousel */}
      <ImageCarousel images={room.images ?? []} roomName={room.room_name} />

      {/* Title & Status */}
      <div className="mt-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{room.room_name}</h1>
          <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {room.is_active ? '● พร้อมใช้งาน' : '● ปิดใช้งาน'}
          </span>
        </div>
        {isAuthenticated && room.is_active && (
          <button
            onClick={() => navigate(`/book/${room.room_id}`)}
            className="flex items-center gap-2 bg-pea-purple hover:bg-pea-purple-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-purple-500/10"
          >
            <CalendarPlus size={18} />
            จองห้องนี้
          </button>
        )}
        {!isAuthenticated && (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-pea-purple hover:bg-pea-purple-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-purple-500/10"
          >
            เข้าสู่ระบบเพื่อจอง
          </button>
        )}
      </div>

      {/* Equipment Table */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-700">รายละเอียดอุปกรณ์</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {specs.map((spec) => (
            <div key={spec.label} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3 text-gray-600">
                <span className="text-pea-purple">{spec.icon}</span>
                <span className="text-sm">{spec.label}</span>
              </div>
              <span className="font-semibold text-gray-800 text-sm">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-700 text-center">
          กรุณา <button onClick={() => navigate('/login')} className="font-semibold underline">เข้าสู่ระบบ</button> เพื่อทำการจองห้องประชุม
        </div>
      )}
    </div>
  )
}
