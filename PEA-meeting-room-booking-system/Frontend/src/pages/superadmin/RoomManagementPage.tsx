import { useEffect, useState, useRef } from 'react'
import { getRooms, createRoom, updateRoom, deleteRoom } from '../../api/rooms'
import type { Room } from '../../types'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2, X, Monitor, Upload, Trash } from 'lucide-react'
import room1Preset from '../../assets/Room1.png'
import room2Preset from '../../assets/Room2.jpg'

interface RoomForm {
  room_name: string
  capacity: number
  mic_count: number
  pc_count: number
  screen_count: number
  building: string
}

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; room?: Room } | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [roomImages, setRoomImages] = useState<string[]>([])
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoomForm>({
    defaultValues: {
      room_name: '',
      capacity: 10,
      mic_count: 0,
      pc_count: 0,
      screen_count: 1,
      building: '',
    }
  })

  const load = () =>
    getRooms(true)
      .then((r) => setRooms(r.data.data))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setRoomImages([])
    setError('')
    reset({ room_name: '', capacity: 10, mic_count: 0, pc_count: 0, screen_count: 1, building: '' })
    setModal({ mode: 'create' })
  }

  const openEdit = (room: Room) => {
    setRoomImages(room.images ?? [])
    setError('')
    reset({
      room_name: room.room_name,
      capacity: room.capacity,
      mic_count: room.mic_count,
      pc_count: room.pc_count,
      screen_count: room.screen_count,
      building: room.building ?? '',
    })
    setModal({ mode: 'edit', room })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.size > 3 * 1024 * 1024) {
          alert('ขนาดไฟล์รูปภาพไม่ควรเกิน 3MB')
          return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
          setRoomImages((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const addPresetImage = (presetPath: string) => {
    if (!roomImages.includes(presetPath)) {
      setRoomImages((prev) => [...prev, presetPath])
    }
  }

  const removeImage = (index: number) => {
    setRoomImages((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: RoomForm) => {
    setError('')
    setSaving(true)
    const payload = {
      room_name: data.room_name,
      capacity: Number(data.capacity),
      mic_count: Number(data.mic_count),
      pc_count: Number(data.pc_count),
      screen_count: Number(data.screen_count),
      building: data.building,
      images: roomImages,
    }
    try {
      if (modal?.mode === 'edit' && modal.room) {
        await updateRoom(modal.room.room_id, payload)
      } else {
        await createRoom(payload)
      }
      setModal(null)
      await load()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบห้องประชุมนี้? (จะเปลี่ยนเป็น Inactive)')) return
    setDeleteId(id)
    try {
      await deleteRoom(id)
      await load()
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการห้องประชุม</h1>
          <p className="text-gray-500 text-sm mt-0.5">เพิ่ม แก้ไข และลบห้องประชุม</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-pea-purple hover:bg-pea-purple-dark text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-purple-500/10 cursor-pointer"
        >
          <Plus size={16} /> เพิ่มห้องใหม่
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">ห้อง</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">อาคาร / สถานที่</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">ความจุ</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">ไมค์</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">PC</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">หน้าจอ</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">สถานะ</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Monitor size={40} className="mx-auto mb-2 opacity-30" />
                    ยังไม่มีห้องประชุม
                  </td>
                </tr>
              ) : rooms.map((room) => (
                <tr key={room.room_id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-medium text-gray-800">{room.room_name}</td>
                  <td className="px-4 py-4 text-left text-gray-600 font-medium">{room.building || '-'}</td>
                  <td className="px-4 py-4 text-center text-gray-600">{room.capacity}</td>
                  <td className="px-4 py-4 text-center text-gray-600">{room.mic_count}</td>
                  <td className="px-4 py-4 text-center text-gray-600">{room.pc_count}</td>
                  <td className="px-4 py-4 text-center text-gray-600">{room.screen_count}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {room.is_active ? 'ใช้งาน' : 'ปิด'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(room)}
                        className="p-2 text-gray-400 hover:text-pea-purple hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(room.room_id)}
                        disabled={deleteId === room.room_id}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800">
                {modal.mode === 'create' ? 'เพิ่มห้องประชุมใหม่' : 'แก้ไขห้องประชุม'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อห้องประชุม *</label>
                <input
                  {...register('room_name', { required: 'กรุณากรอกชื่อห้องประชุม' })}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple ${errors.room_name ? 'border-red-300' : 'border-gray-200'}`}
                />
                {errors.room_name && <p className="mt-1 text-xs text-red-500">{errors.room_name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อาคาร / สถานที่ *</label>
                <input
                  {...register('building', { required: 'กรุณากรอกข้อมูลอาคาร / สถานที่' })}
                  placeholder="เช่น อาคาร LED, อาคาร 1"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple ${errors.building ? 'border-red-300' : 'border-gray-200'}`}
                />
                {errors.building && <p className="mt-1 text-xs text-red-500">{errors.building.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'capacity', label: 'ความจุ (คน) *', min: 1 },
                  { name: 'mic_count', label: 'จำนวนไมค์', min: 0 },
                  { name: 'pc_count', label: 'จำนวน PC', min: 0 },
                  { name: 'screen_count', label: 'จำนวนหน้าจอ', min: 0 },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <input
                      type="number"
                      min={f.min}
                      {...register(f.name as keyof RoomForm, { 
                        required: f.name === 'capacity' ? 'กรุณากรอกความจุ' : false, 
                        min: { value: f.min, message: `ต้องไม่น้อยกว่า ${f.min}` }
                      })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pea-purple"
                    />
                    {errors[f.name as keyof RoomForm] && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors[f.name as keyof RoomForm]?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Local File Uploader */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อัปโหลดรูปภาพห้องประชุม
                </label>
                
                {/* Drag and Drop / Select Zone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-pea-purple rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50 flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload size={24} className="text-gray-400" />
                  <span className="text-xs text-gray-600 font-semibold">คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่อง</span>
                  <span className="text-[10px] text-gray-400">รองรับไฟล์ PNG, JPG (ขนาดไม่เกิน 3MB)</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Quick Presets Buttons */}
                <div className="mt-3">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    รูปภาพตัวเลือกด่วน (สำหรับห้องจำลอง):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => addPresetImage(room1Preset)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-xl text-xs font-semibold text-pea-purple transition-all cursor-pointer"
                    >
                      <img src={room1Preset} className="w-5 h-5 rounded object-cover" />
                      เพิ่มรูป Room1.png
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetImage(room2Preset)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-xl text-xs font-semibold text-pea-purple transition-all cursor-pointer"
                    >
                      <img src={room2Preset} className="w-5 h-5 rounded object-cover" />
                      เพิ่มรูป Room2.jpg
                    </button>
                  </div>
                </div>

                {/* Selected Images Preview Grid */}
                {roomImages.length > 0 && (
                  <div className="mt-4">
                    <span className="text-xs font-semibold text-gray-700 block mb-2">รูปภาพที่เลือก ({roomImages.length})</span>
                    <div className="grid grid-cols-4 gap-2">
                      {roomImages.map((src, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-150 group">
                          <img src={src} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                          >
                            <Trash size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-pea-purple hover:bg-pea-purple-dark disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-purple-500/15 cursor-pointer"
                >
                  {saving ? 'กำลังบันทึก...' : modal.mode === 'create' ? 'เพิ่มห้อง' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
