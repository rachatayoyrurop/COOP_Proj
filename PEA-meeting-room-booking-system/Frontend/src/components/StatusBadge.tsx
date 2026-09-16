import type { BookingStatus } from '../types'

const config: Record<BookingStatus, { label: string; className: string }> = {
  Pending:  { label: 'รออนุมัติ',  className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  Approved: { label: 'อนุมัติแล้ว', className: 'bg-green-100  text-green-800  border border-green-200'  },
  Rejected: { label: 'ปฏิเสธ',    className: 'bg-red-100    text-red-800    border border-red-200'    },
  Canceled: { label: 'ยกเลิก',    className: 'bg-gray-100   text-gray-600   border border-gray-200'   },
}

export default function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
