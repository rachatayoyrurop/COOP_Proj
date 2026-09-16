import { useEffect, useState } from 'react'
import { getBookingLogs } from '../../api/logs'
import type { BookingLog } from '../../types'
import { History, Search, FileText, ArrowRight, UserCheck, Calendar, HelpCircle, XCircle } from 'lucide-react'

export default function BookingLogsPage() {
  const [logs, setLogs] = useState<BookingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    getBookingLogs()
      .then((res) => {
        setLogs(res.data.data)
      })
      .catch((err) => console.error('Failed to fetch booking logs:', err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter((log) => {
    const bookingCode = log.booking?.booking_code || ''
    const matchSearch =
      bookingCode.toLowerCase().includes(search.toLowerCase()) ||
      log.changed_by.toLowerCase().includes(search.toLowerCase()) ||
      (log.booking?.title || '').toLowerCase().includes(search.toLowerCase())

    const matchAction = actionFilter === 'all' || log.action === actionFilter
    return matchSearch && matchAction
  })

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-50/30 border border-indigo-100/30 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            สร้างการจอง
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50/30 border border-emerald-100/30 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            อนุมัติการจอง
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50/30 border border-rose-100/30 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            ปฏิเสธการจอง
          </span>
        )
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50/30 border border-amber-100/30 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ยกเลิกการจอง
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-gray-55/20 border border-gray-100/20 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {action}
          </span>
        )
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return <span className="- text-gray-300">—</span>
    switch (status) {
      case 'Pending':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
            รอดำเนินการ
          </span>
        )
      case 'Approved':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
            อนุมัติ
          </span>
        )
      case 'Rejected':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
            ปฏิเสธ
          </span>
        )
      case 'Canceled':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
            ยกเลิก
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-100">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <History className="text-pea-purple" size={24} />
            ประวัติการจองและแก้ไขระบบ (Audit Trail)
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            บันทึกการดำเนินการของพนักงานและผู้ดูแลระบบทั้งหมด สำหรับการตรวจสอบย้อนหลัง
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80 shrink-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วย รหัสจอง, รหัสพนักงาน, ชื่อการจอง..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple bg-gray-50/50 hover:bg-gray-50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 hidden lg:inline">
            กรองการดำเนินการ:
          </span>
          {[
            { value: 'all', label: 'ทั้งหมด' },
            { value: 'created', label: 'สร้างการจอง' },
            { value: 'approved', label: 'อนุมัติ' },
            { value: 'rejected', label: 'ปฏิเสธ' },
            { value: 'canceled', label: 'ยกเลิก' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setActionFilter(f.value)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                actionFilter === f.value
                  ? 'bg-pea-purple border-pea-purple text-white shadow-md shadow-purple-500/10'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main logs display */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 font-bold text-gray-500">รหัสจอง / ข้อมูลการจอง</th>
                  <th className="px-4 py-4 font-bold text-gray-500">ผู้ดำเนินการ (Actor)</th>
                  <th className="px-4 py-4 font-bold text-gray-500">การดำเนินการ</th>
                  <th className="px-4 py-4 font-bold text-gray-500 text-center">การเปลี่ยนสถานะ</th>
                  <th className="px-5 py-4 font-bold text-gray-500">วัน-เวลาดำเนินงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-400">
                      <HelpCircle size={44} className="mx-auto mb-3 opacity-30 text-pea-purple" />
                      <p className="font-semibold text-gray-700 text-base">ไม่พบประวัติการดำเนินการระบบ</p>
                      <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองด้านบน</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.log_id} className="hover:bg-gray-55/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-purple-50 p-2 rounded-xl text-pea-purple shrink-0 mt-0.5 border border-purple-100">
                            <FileText size={16} />
                          </div>
                          <div>
                            <span className="font-black text-pea-purple block text-xs tracking-wider uppercase">
                              {log.booking?.booking_code || `ID: #${log.booking_id}`}
                            </span>
                            <span className="font-bold text-gray-800 text-sm mt-0.5 line-clamp-1">
                              {log.booking?.title || 'รายการถูกลบออกไปแล้ว'}
                            </span>
                            <span className="text-[11px] text-gray-400 block mt-0.5">
                              ห้อง: {log.booking?.room?.room_name || '—'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-750">
                        <div>
                          <span className="text-sm font-bold text-gray-700 block">{log.changed_by}</span>
                          <span className="text-[10px] font-semibold text-gray-400 block">
                            {log.operator?.role === 'SuperAdmin' ? 'Super Admin' : log.operator?.role === 'Admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">{getActionBadge(log.action)}</td>
                      <td className="px-4 py-4 text-center">
                        {log.old_status || log.new_status ? (
                          <div className="inline-flex items-center gap-2 bg-purple-50/5 px-3 py-1.5 rounded-xl border border-purple-100/10">
                            {getStatusBadge(log.old_status)}
                            <ArrowRight size={12} className="text-gray-400 shrink-0" />
                            {getStatusBadge(log.new_status)}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                        {log.remark && (
                          <div className="mt-2 text-left max-w-xs mx-auto text-xs bg-red-50/50 border border-red-100 rounded-lg p-2 text-rose-700 font-medium">
                            <span className="font-bold block text-[10px] text-rose-500 uppercase tracking-wide">เหตุผล/หมายเหตุ:</span>
                            {log.remark}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400 shrink-0" />
                          <div className="text-xs font-semibold">
                            <span className="text-gray-700 block">
                              {new Date(log.created_at).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                year: '2-digit',
                              })}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {new Date(log.created_at).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })} น.
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
