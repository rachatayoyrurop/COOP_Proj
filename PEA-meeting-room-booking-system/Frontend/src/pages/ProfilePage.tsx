import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../api/auth'
import type { User } from '../types'
import { useForm } from 'react-hook-form'
import { Camera, User as UserIcon, Save, ArrowLeft, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ProfileForm extends User {}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>()

  useEffect(() => {
    if (user) {
      reset({
        emp_id: user.emp_id,
        full_name: user.full_name,
        department: user.department,
        email: user.email || '',
        password: user.password || '',
      })
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
    }
  }, [user, reset])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('ขนาดไฟล์รูปภาพไม่ควรเกิน 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        setError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const storedUsers: User[] = JSON.parse(localStorage.getItem('pea_registered_users') || '[]')
      const userIndex = storedUsers.findIndex(u => u.emp_id.toUpperCase() === user.emp_id.toUpperCase())

      const updatedUser: User = {
        ...user,
        full_name: data.full_name,
        department: data.department,
        email: data.email,
        avatar: avatarPreview || user.avatar,
        password: data.password || user.password,
      }

      // 1. Update localStorage database
      if (userIndex !== -1) {
        storedUsers[userIndex] = updatedUser
      } else {
        storedUsers.push(updatedUser)
      }
      localStorage.setItem('pea_registered_users', JSON.stringify(storedUsers))

      // 2. Synchronize with Go backend (Upsert)
      await loginApi(updatedUser.emp_id, updatedUser.full_name, updatedUser.department)

      // 3. Update Auth Context state so all headers & elements update instantly
      updateUser(updatedUser)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-gray-500 font-semibold">
        กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานหน้านี้
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1.5 text-xs text-pea-purple hover:text-pea-purple-dark transition-colors mb-6 font-semibold cursor-pointer group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> ย้อนกลับ
      </button>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Avatar & Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden text-center flex flex-col items-center relative group">
          {/* Banner strip */}
          <div className="w-full h-24 bg-gradient-to-r from-pea-purple to-pea-purple-dark relative" />
          
          <div className="px-6 pb-8 relative flex flex-col items-center -mt-12 w-full">
            {/* Avatar Circle */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-28 h-28 bg-purple-50 border-4 border-white rounded-full flex items-center justify-center cursor-pointer group/avatar shadow-lg overflow-hidden mb-4"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={44} className="text-pea-purple/40" />
              )}
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />

            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-pea-purple hover:underline mb-4 font-semibold"
            >
              เปลี่ยนรูปโปรไฟล์
            </button>

            <h2 className="text-lg font-bold text-gray-800 tracking-tight leading-snug">{user.full_name}</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-3 font-semibold">รหัสพนักงาน: {user.emp_id}</p>

            {/* Role Badge */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full ${
              user.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
              user.role === 'Admin' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
              'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              สิทธิ์ระบบ: {user.role === 'SuperAdmin' ? 'Super Admin' : user.role === 'Admin' ? 'ผู้อนุมัติ' : 'พนักงาน'}
            </span>

            <div className="w-full border-t border-gray-100 mt-6 pt-6 text-left space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-semibold">แผนก / กอง</span>
                <span className="text-gray-700 font-bold">{user.department}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-semibold">อีเมลติดต่อ</span>
                <span className="text-gray-700 font-bold truncate max-w-[150px]" title={user.email}>{user.email || '–'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form Inputs Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8 relative overflow-hidden">
          
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">แก้ไขข้อมูลส่วนตัว</h1>
            <p className="text-gray-400 text-xs mt-0.5">อัปเดตข้อมูลพนักงานของคุณในระบบจำลองและฐานข้อมูล</p>
          </div>

          <hr className="border-gray-100 mb-6" />

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-xs flex items-center gap-2 font-semibold shadow-sm animate-fade-in">
              <CheckCircle size={16} />
              <span>บันทึกการแก้ไขข้อมูลส่วนตัวพนักงานเสร็จสิ้น!</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">รหัสพนักงาน (ไม่สามารถแก้ไขได้)</label>
                <input
                  {...register('emp_id')}
                  disabled
                  className="w-full px-4 py-3 border border-gray-150 bg-gray-50 rounded-xl text-gray-400 text-sm focus:outline-none cursor-not-allowed font-medium shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ชื่อ-นามสกุล *</label>
                <input
                  {...register('full_name', { required: 'กรุณากรอกชื่อ-นามสกุล' })}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-sm transition-all text-gray-700 font-medium"
                />
                {errors.full_name && <p className="mt-1 text-[10px] text-red-500">{errors.full_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">แผนก / กอง *</label>
                <input
                  {...register('department', { required: 'กรุณากรอกแผนก/กอง' })}
                  placeholder="กรอกแผนก/กอง"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-sm transition-all text-gray-700 font-medium"
                />
                {errors.department && <p className="mt-1 text-[10px] text-red-500">{errors.department.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">อีเมลพนักงาน *</label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'กรุณากรอกอีเมล',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@gmail\.com$/i,
                      message: 'ต้องใช้บัญชีอีเมลของ @gmail.com เท่านั้น'
                    }
                  })}
                  placeholder="เช่น user@gmail.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-sm transition-all text-gray-700 font-medium"
                />
                {errors.email && <p className="mt-1 text-[10px] text-red-500">{errors.email.message}</p>}
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-gray-50">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-pea-purple hover:bg-pea-purple-dark disabled:opacity-60 text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 text-xs"
              >
                <Save size={15} />
                {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขข้อมูล'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
