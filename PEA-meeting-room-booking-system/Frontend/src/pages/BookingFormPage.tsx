import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { getRoom, getRooms } from '../api/rooms'
import { createBooking } from '../api/bookings'
import { useAuth } from '../context/AuthContext'
import type { Room } from '../types'
import { ArrowLeft, Monitor, Tv, Mic, Wifi, Video, ChevronLeft, ChevronRight, Users, ImageOff, AlertTriangle } from 'lucide-react'

interface FormData {
  room_id: number
  title: string
  booking_date: string
  start_time: string
  end_time: string
  snack_price: number
  participant_count: number
  coordinator: string
  department: string
  notes: string
}

export default function BookingFormPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [room, setRoom] = useState<Room | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [activeImgIdx, setActiveImgIdx] = useState(0)

  const { user } = useAuth()
  const navigate = useNavigate()

  const now = new Date()

  const todayStr =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const timeOptions = Array.from({ length: 48 }).map((_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0')
    const minute = (i % 2 === 0 ? '00' : '30')
    return `${hour}:${minute}`
  })
  if (!timeOptions.includes('23:59')) {
    timeOptions.push('23:59')
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      room_id: Number(roomId),
      booking_date: todayStr,
      start_time: '',
      end_time: '',
      snack_price: 15,
      participant_count: 10,
      coordinator: user?.full_name ?? '',
      department: user?.department ?? '',
      notes: ''
    }
  })

  const watchStartTime = watch('start_time')
  const watchBookingDate = watch('booking_date')
  const watchEndTime = watch('end_time')

  useEffect(() => {
    if (
      watchStartTime &&
      watchEndTime &&
      watchEndTime <= watchStartTime
    ) {
      setValue('end_time', '')
    }
  }, [watchStartTime, watchEndTime, setValue])

  // Fetch Rooms for dropdown & Segregate Admin Role
  useEffect(() => {
    if (user && user.role === 'Admin') {
      navigate('/admin')
      return
    }
    getRooms().then((res) => {
      setRooms(res.data.data.filter(r => r.is_active))
    })
  }, [user, navigate])

  // Fetch current selected room details
  useEffect(() => {
    if (user && user.role === 'Admin') return
    if (roomId) {
      getRoom(Number(roomId)).then((res) => {
        setRoom(res.data.data)
        setValue('room_id', Number(roomId))
      })
    }
  }, [roomId, setValue, user])

  const onSubmit = async (data: FormData) => {
    setError('')
    setSubmitting(true)
    try {
      const startDate = new Date(`${data.booking_date}T${data.start_time}`)
      const endDate = new Date(`${data.booking_date}T${data.end_time}`)
      const now = new Date()

      // ห้ามจองเวลาที่ผ่านมาแล้ว
      if (startDate <= now) {
        alert('ไม่สามารถจองห้องประชุมในเวลาที่ผ่านมาแล้วได้')
        return
      }

      // เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม
      if (endDate <= startDate) {
        alert('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น')
        return
      }

      // หลังจากตรวจผ่านแล้ว ค่อยแปลงเป็น ISO
      const startIso = startDate.toISOString()
      const endIso = endDate.toISOString()

      const res = await createBooking({
        room_id: Number(data.room_id),
        title: data.title,
        ref_note: data.notes, // Map custom notes to ref_note
        objective: `ผู้ประสานงาน: ${data.coordinator} | หน่วยงาน: ${data.department}`, // Combine metadata
        start_date: startIso,
        end_date: endIso,
        snack_price: Number(data.snack_price),
        participant_count: Number(data.participant_count),
      })

      navigate(`/my-bookings`, { state: { newBooking: res.data.data } })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'เกิดข้อผิดพลาดในการจองห้องประชุม กรุณาเลือกเวลาใหม่อีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRoomId = Number(e.target.value)
    navigate(`/book/${nextRoomId}`)
  }

  const roomImages = room?.images && room.images.length > 0 ? room.images : []

  const nextImg = () => {
    if (roomImages.length > 0) {
      setActiveImgIdx((prev) => (prev + 1) % roomImages.length)
    }
  }

  const prevImg = () => {
    if (roomImages.length > 0) {
      setActiveImgIdx((prev) => (prev - 1 + roomImages.length) % roomImages.length)
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto p-1 sm:p-2">
      {/* Back Link */}
      <button
        onClick={() => navigate('/rooms')}
        className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-gray-500 hover:text-pea-purple mb-5 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> กลับไปหน้าห้องประชุม
      </button>

      {/* Main Title Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">จองห้องประชุม</h1>
        <p className="text-gray-400 text-sm font-semibold mt-1">กรอกรายละเอียดเพื่อจองสิทธิ์เข้าใช้งานห้องประชุม</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl border border-purple-100/30 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-gray-800 font-extrabold text-lg border-b border-gray-100 pb-3 flex items-center">
              ข้อมูลการจอง
            </h3>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm font-semibold animate-shake flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Room Selection Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">ห้องประชุม</label>
              <select
                value={roomId}
                onChange={handleRoomChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent bg-white text-gray-700 font-bold transition-all shadow-sm"
              >
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id}>
                    {r.room_name} ({r.capacity} ที่นั่ง)
                  </option>
                ))}
              </select>
            </div>

            {/* Meeting Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">หัวเรื่องการประชุม *</label>
              <input
                {...register('title', { required: 'กรุณากรอกหัวเรื่องการประชุม' })}
                placeholder="ระบุหัวเรื่อง เช่น ประชุมสัมมนาความคืบหน้าโครงการ"
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple transition-all font-semibold ${errors.title ? 'border-rose-300 bg-rose-50/30' : 'border-gray-200 focus:border-transparent'
                  }`}
              />
              {errors.title && (
                <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} className="shrink-0" /> {errors.title.message}
                </p>
              )}
            </div>

            {/* Split Date & Time Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">วันที่ *</label>
                <input
                  type="date"
                  min={todayStr}
                  {...register('booking_date', { required: 'กรุณาเลือกวันที่ต้องการจอง' })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent transition-all font-bold text-gray-700 bg-white"
                />
                {errors.booking_date && (
                  <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} className="shrink-0" /> {errors.booking_date.message}
                  </p>
                )}
              </div>

              {/* Start Time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">เวลาเริ่ม *</label>
                <select
                  {...register('start_time', { required: 'กรุณาเลือกเวลาเริ่มต้น' })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent transition-all font-bold text-gray-700 bg-white shadow-sm"
                >
                  <option value="" disabled>
                    เลือกเวลาเริ่มต้น
                  </option>

                  {timeOptions
                    .filter((t) => {
                      const optionDateTime = new Date(`${watchBookingDate}T${t}`)

                      if (watchBookingDate !== todayStr) {
                        return true
                      }

                      return optionDateTime > new Date()
                    })
                    .map((t) => (
                      <option key={t} value={t}>
                        {t} น.
                      </option>
                    ))}
                </select>
                {errors.start_time && (
                  <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} className="shrink-0" /> {errors.start_time.message}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">เวลาสิ้นสุด *</label>
                <select
                  {...register('end_time', {
                    required: 'กรุณาเลือกเวลาสิ้นสุด',
                    validate: (val) => {
                      if (!watchStartTime) return true
                      return val > watchStartTime || 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple transition-all font-bold text-gray-700 bg-white shadow-sm ${errors.end_time ? 'border-rose-300 bg-rose-50/30' : 'border-gray-200 focus:border-transparent'
                    }`}

                > <option value="" disabled>
                    เลือกเวลาสิ้นสุด
                  </option>

                  {timeOptions
                    .filter((t) => {
                      if (!watchStartTime) return true
                      return t > watchStartTime
                    })
                    .map((t) => (
                      <option key={t} value={t}>
                        {t} น.
                      </option>
                    ))}
                </select>
                {errors.end_time && (
                  <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} className="shrink-0" /> {errors.end_time.message}
                  </p>
                )}
              </div>
            </div>

            {/* Snack, Participants, Booker Dept block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Participant Count */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">จำนวนผู้เข้าร่วม (โดยประมาณ) *</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    {...register('participant_count', {
                      required: 'กรุณาระบุจำนวนผู้เข้าร่วม',
                      min: { value: 1, message: 'ผู้เข้าร่วมอย่างน้อย 1 คน' },
                      validate: (val) => {
                        if (!room) return true
                        return val <= room.capacity || `จำนวนคนเกินความจุของห้อง (${room.capacity} ที่นั่ง)`
                      }
                    })}
                    placeholder="เช่น 15"
                    className={`w-full pl-4 pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple transition-all font-bold text-gray-700 ${errors.participant_count ? 'border-rose-300 bg-rose-50/30' : 'border-gray-200 focus:border-transparent'
                      }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">คน</span>
                </div>
                {errors.participant_count && (
                  <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} className="shrink-0" /> {errors.participant_count.message}
                  </p>
                )}
              </div>

              {/* Snack Option dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">อาหารว่าง / เบรค</label>
                <select
                  {...register('snack_price')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent bg-white text-gray-750 font-bold transition-all shadow-sm"
                >
                  <option value={0}>ไม่มีอาหารว่าง</option>
                  <option value={15}>เบรค 15 บาท / คน</option>
                  <option value={25}>เบรค 25 บาท / คน</option>
                  <option value={35}>เบรค 35 บาท / คน</option>
                </select>
              </div>
            </div>

            {/* Coordinator & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Coordinator */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">ผู้ประสานงาน</label>
                <input
                  {...register('coordinator', { required: 'กรุณากรอกชื่อผู้ประสานงาน' })}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent bg-gray-50 text-gray-600 font-bold transition-all"
                />
                {errors.coordinator && <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1"><AlertTriangle size={12} className="shrink-0" /> {errors.coordinator.message}</p>}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">หน่วยงาน</label>
                <input
                  {...register('department', { required: 'กรุณาระบุหน่วยงาน' })}
                  placeholder="กอง / แผนก"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent bg-gray-50 text-gray-600 font-bold transition-all"
                />
                {errors.department && (
                  <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} className="shrink-0" /> {errors.department.message}
                  </p>
                )}
              </div>
            </div>

            {/* Notes / Special Requests */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">หมายเหตุ / ความต้องการเพิ่มเติม</label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="ระบุคำขอเพิ่มเติม เช่น เตรียมจัดโต๊ะเป็นตัวยู, ไมโครโฟนเสริม ฯลฯ"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent transition-all font-medium text-gray-700 resize-none"
              />
            </div>

            {/* Actions Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-100 relative z-10">
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="w-full sm:flex-1 min-h-[48px] py-3 text-center text-sm font-bold border border-gray-200/85 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl transition-all cursor-pointer bg-white"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:flex-1 min-h-[48px] py-3 bg-pea-purple hover:bg-pea-purple-dark text-white text-sm font-black rounded-xl transition-all shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-60 text-center"
              >
                {submitting ? 'กำลังจองห้อง...' : 'ยืนยันการจอง'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Room specifications card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-purple-100/30 p-6 shadow-sm space-y-6">
            <h3 className="text-gray-800 font-extrabold text-base border-b border-gray-100 pb-3">
              รายละเอียดห้องประชุม
            </h3>

            {/* Room Image Carousel */}
            {roomImages.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-50 group shadow-sm">
                <img
                  src={roomImages[activeImgIdx]}
                  alt={room?.room_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x300?text=PEA+Room' }}
                />

                {/* Left/Right Buttons */}
                {roomImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImg}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white p-1 rounded-full border border-white/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={nextImg}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white p-1 rounded-full border border-white/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={16} />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full">
                      {roomImages.map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeImgIdx ? 'bg-white w-3.5' : 'bg-white/45'
                            }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-44 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                <ImageOff size={32} className="text-gray-300/80 mb-1" />
                <span className="text-xs font-bold mt-1 text-gray-400">ไม่มีรูปภาพ</span>
              </div>
            )}

            {/* Room Name and Capacity */}
            {room && (
              <div>
                <h4 className="font-extrabold text-gray-800 text-lg leading-snug">{room.room_name}</h4>
                <div className="flex items-center gap-1.5 text-gray-500 font-bold text-xs mt-1.5 uppercase">
                  <span>👥 ความจุ:</span>
                  <span className="text-gray-800 font-extrabold bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {room.capacity} ที่นั่ง
                  </span>
                </div>
              </div>
            )}

            {/* Equipment checklist layout displaying ONLY screen, pc, mic, and capacity */}
            {room && (
              <div className="space-y-3.5 border-t border-purple-50/20 pt-4 text-slate-700">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">ข้อมูลสิ่งอำนวยความสะดวก</h5>

                <div className="grid grid-cols-1 gap-2.5 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-[#8E24AA] shrink-0" />
                    <span>ความจุ: <strong className="text-slate-800 font-extrabold">{room.capacity}</strong> ที่นั่ง</span>
                  </div>
                  {room.screen_count > 0 && (
                    <div className="flex items-center gap-2">
                      <Monitor size={15} className="text-[#8E24AA] shrink-0" />
                      <span>จอภาพ: <strong className="text-slate-800 font-extrabold">{room.screen_count}</strong> จอ</span>
                    </div>
                  )}
                  {room.pc_count > 0 && (
                    <div className="flex items-center gap-2">
                      <Tv size={15} className="text-[#8E24AA] shrink-0" />
                      <span>คอมพิวเตอร์: <strong className="text-slate-800 font-extrabold">{room.pc_count}</strong> เครื่อง</span>
                    </div>
                  )}
                  {room.mic_count > 0 && (
                    <div className="flex items-center gap-2">
                      <Mic size={15} className="text-[#8E24AA] shrink-0" />
                      <span>ไมโครโฟน: <strong className="text-slate-800 font-extrabold">{room.mic_count}</strong> ตัว</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

