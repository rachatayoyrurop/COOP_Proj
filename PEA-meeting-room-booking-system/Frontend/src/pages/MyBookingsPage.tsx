import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getMyBookings, cancelBooking } from '../api/bookings'
import type { Booking } from '../types'
import StatusBadge from '../components/StatusBadge'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { CalendarDays, Clock, Users, XCircle, CheckCircle, Eye } from 'lucide-react'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState<number | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const location = useLocation()
  const newBooking = (location.state as { newBooking?: Booking })?.newBooking

  const load = () =>
    getMyBookings()
      .then((r) => setBookings(r.data.data))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCancel = async (id: number) => {
    if (!confirm('ยืนยันการยกเลิกการจองนี้?')) return
    setCanceling(id)
    try {
      await cancelBooking(id)
      await load()
    } finally {
      setCanceling(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">การจองของฉัน</h1>
          <p className="text-gray-500 text-sm mt-0.5">ประวัติการจองห้องประชุมทั้งหมด</p>
        </div>
      </div>

      {newBooking && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-green-800 text-sm">ส่งคำขอจองสำเร็จ!</p>
            <p className="text-green-700 text-sm mt-0.5">
              รหัสการจอง: <strong>{newBooking.booking_code}</strong> · กรุณารอการอนุมัติจากผู้ดูแล
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CalendarDays size={48} className="mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีประวัติการจอง</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.booking_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {b.booking_code}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                  <h3 className="font-bold text-gray-800 text-base truncate">{b.title}</h3>
                  {b.room && (
                    <p className="text-pea-purple text-sm font-medium mt-0.5">{b.room.room_name}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      {format(new Date(b.start_date), 'd MMM yyyy', { locale: th })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {format(new Date(b.start_date), 'HH:mm')} – {format(new Date(b.end_date), 'HH:mm น.')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {b.participant_count} คน
                    </span>
                  </div>

                  {b.reject_reason && (
                    <p className="mt-2 text-xs text-red-500 font-bold">เหตุผลปฏิเสธ: {b.reject_reason}</p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="flex items-center gap-1 bg-white hover:bg-purple-50 text-pea-purple border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:shadow-sm cursor-pointer"
                  >
                    <Eye size={13} />
                    ดูรายละเอียด
                  </button>
                  {(b.status === 'Pending' || b.status === 'Approved') && (
                    <button
                      onClick={() => handleCancel(b.booking_id)}
                      disabled={canceling === b.booking_id}
                      className="flex items-center gap-1 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle size={13} />
                      {canceling === b.booking_id ? 'กำลังยกเลิก...' : 'ยกเลิก'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-purple-100/30 flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-pea-purple to-pea-purple-dark text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-wider bg-white/20 px-2.5 py-1 rounded-xl uppercase">
                  {selectedBooking.booking_code}
                </span>
                <h2 className="text-base font-black mt-2 truncate max-w-[320px] text-white">
                  {selectedBooking.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 divide-y divide-gray-50 text-slate-700 text-xs sm:text-sm">
              
              {/* Meeting Room */}
              <div className="flex gap-3 pt-0">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-pea-purple border border-purple-100 shrink-0">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">ห้องประชุม</span>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">
                    {selectedBooking.room?.room_name || 'ไม่ระบุห้องประชุม'}
                  </p>
                  {selectedBooking.room?.building && (
                    <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                      อาคาร: {selectedBooking.room.building}
                    </span>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex gap-3 pt-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-pea-purple border border-purple-100 shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">วัน-เวลา</span>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">
                    {format(new Date(selectedBooking.start_date), 'EEEEที่ d MMMM yyyy', { locale: th })}
                  </p>
                  <p className="text-xs text-pea-purple font-black mt-0.5">
                    เวลา {format(new Date(selectedBooking.start_date), 'HH:mm')} – {format(new Date(selectedBooking.end_date), 'HH:mm น.')}
                  </p>
                </div>
              </div>

              {/* Meeting Specifications */}
              <div className="grid grid-cols-2 gap-4 pt-3">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">จำนวนผู้ร่วมประชุม</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedBooking.participant_count} คน</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">อาหารว่าง / เบรค</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {selectedBooking.snack_price === 0 
                      ? 'ไม่มีอาหารว่าง' 
                      : `เบรค ${selectedBooking.snack_price} บาท / คน`}
                  </p>
                </div>
              </div>

              {/* Coordinator Metadata */}
              <div className="pt-3 space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">ผู้ประสานงาน & หน่วยงาน</span>
                <p className="text-xs font-semibold text-gray-700 leading-relaxed bg-purple-50/20 border border-purple-100/20 rounded-xl p-3">
                  {selectedBooking.objective || '—'}
                </p>
              </div>

              {/* Additional Requests (ref_note) */}
              {selectedBooking.ref_note && (
                <div className="pt-3 space-y-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">ความต้องการเพิ่มเติม / หมายเหตุ</span>
                  <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3 leading-relaxed">
                    {selectedBooking.ref_note}
                  </p>
                </div>
              )}

              {/* Status Section */}
              <div className="pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">สถานะการอนุมัติ</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedBooking.status} />
                  </div>
                </div>
                {selectedBooking.reject_reason && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">สาเหตุการปฏิเสธ</span>
                    <span className="text-xs font-bold text-rose-600 block mt-0.5">{selectedBooking.reject_reason}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
