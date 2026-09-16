import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { login as loginApi, registerUser } from '../api/auth'
import type { User } from '../types'
import peaLogo from '../assets/pea-logo.png'
import sawasdee from '../assets/Sawasdee.png'
import { Camera, User as UserIcon, ArrowLeft } from 'lucide-react'

interface RegisterForm extends User {
  confirm_password?: string
}

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()
  const password = watch('password')

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

  const onSubmit = async (data: RegisterForm) => {
    setError('')
    setLoading(true)
    try {
      // 1. Check if employee ID is already taken locally
      const storedUsers: User[] = JSON.parse(localStorage.getItem('pea_registered_users') || '[]')
      const exists = storedUsers.some(u => u.emp_id.toUpperCase() === data.emp_id.toUpperCase())
      if (exists) {
        throw new Error('รหัสพนักงานนี้ถูกลงทะเบียนเข้าใช้งานระบบแล้ว')
      }

      // 2. Prepare user object
      const newUser: User = {
        emp_id: data.emp_id.toUpperCase(),
        full_name: data.full_name,
        role: 'User', // default new registered user is standard User
        department: data.department,
        email: data.email,
        avatar: avatarPreview || undefined,
        password: data.password,
      }

      // 3. Save to localStorage database
      storedUsers.push(newUser)
      localStorage.setItem('pea_registered_users', JSON.stringify(storedUsers))

      // 4. Synchronize with GORM backend via registration endpoint
      await registerUser(newUser.emp_id, newUser.full_name, newUser.department, newUser.email)

      // 5. Authenticate via background login to get JWT token
      const res = await loginApi(newUser.emp_id, newUser.full_name, newUser.department, newUser.email)
      
      // 6. Automatically log in the user using combined details
      login(res.data.data.token, { ...res.data.data.user, ...newUser })
      
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pea-purple-dark via-pea-purple to-pea-purple-deep flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-300/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-purple-400/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Column: Mascot & Welcome Info */}
        <div className="lg:col-span-5 flex flex-col items-center text-center text-white px-4">
          <img
            src={sawasdee}
            alt="PEA Mascot"
            className="w-40 sm:w-48 md:w-56 lg:w-64 h-auto object-contain animate-float drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-6"
          />
          <h1 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-md text-white mb-2">
            ระบบจองห้องประชุม
          </h1>
          <div className="h-1 w-16 bg-white/40 rounded-full mb-4" />
          <p className="text-purple-100 text-xs sm:text-sm font-medium leading-relaxed drop-shadow max-w-xs">
            ลงทะเบียนพนักงานเพื่อเปิดใช้งานบัญชี <br />
            การไฟฟ้าส่วนภูมิภาคเขต 3
          </p>
        </div>

        {/* Right Column: Register Card */}
        <div className="lg:col-span-7 flex justify-center w-full">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] p-6 sm:p-8 border border-white/20 w-full max-w-lg">
            
            {/* Back to Login Link */}
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-pea-purple hover:underline mb-4 font-semibold">
              <ArrowLeft size={14} /> กลับหน้าเข้าสู่ระบบ
            </Link>

            {/* Header and Logo */}
            <div className="text-center mb-6">
              <img
                src={peaLogo}
                alt="PEA Logo"
                className="h-12 w-auto object-contain mx-auto mb-2"
              />
              <h2 className="text-gray-800 text-xl font-bold tracking-tight">ลงทะเบียนเปิดใช้งานระบบ</h2>
              <p className="text-gray-400 text-xs mt-1">กรอกข้อมูลพนักงานให้ครบถ้วนเพื่อเข้าสู่ระบบ</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Profile Image Picker */}
              <div className="flex flex-col items-center mb-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 bg-purple-50 border border-purple-100 rounded-full flex items-center justify-center cursor-pointer group shadow-inner overflow-hidden"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={32} className="text-pea-purple/40" />
                  )}
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={18} className="text-white" />
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
                  className="text-xs text-pea-purple hover:underline mt-2 font-medium"
                >
                  เลือกรูปโปรไฟล์
                </button>
              </div>

              {/* Grid Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">รหัสพนักงาน *</label>
                  <input
                    {...register('emp_id', { required: 'กรุณากรอกรหัสพนักงาน' })}
                    placeholder="เช่น EMP123"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-xs transition-all"
                  />
                  {errors.emp_id && <p className="mt-1 text-[10px] text-red-500">{errors.emp_id.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อ-นามสกุล *</label>
                  <input
                    {...register('full_name', { required: 'กรุณากรอกชื่อ-นามสกุล' })}
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-xs transition-all"
                  />
                  {errors.full_name && <p className="mt-1 text-[10px] text-red-500">{errors.full_name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">แผนก / กอง *</label>
                  <input
                    {...register('department', { required: 'กรุณากรอกแผนก/กอง' })}
                    placeholder="เช่น กองบัญชีและการเงิน"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-xs transition-all"
                  />
                  {errors.department && <p className="mt-1 text-[10px] text-red-500">{errors.department.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">อีเมลพนักงาน *</label>
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
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-xs transition-all"
                  />
                  {errors.email && <p className="mt-1 text-[10px] text-red-500">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">รหัสผ่าน *</label>
                  <input
                    type="password"
                    {...register('password', { 
                      required: 'กรุณาตั้งรหัสผ่าน',
                      validate: {
                        length: (val) => !val || val.length >= 4 || 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร',
                        chars: (val) => !val || (/[a-zA-Zก-๙]/.test(val) && /[0-9]/.test(val)) || 'รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลข',
                        notSameAsEmpId: (val, formValues) => {
                          if (!val) return true
                          const empId = formValues.emp_id || ''
                          if (val.toLowerCase() === empId.toLowerCase()) {
                            return 'รหัสผ่านต้องไม่ตรงกับรหัสพนักงาน'
                          }
                          return true
                        },
                        notSameAsName: (val, formValues) => {
                          if (!val) return true
                          const name = formValues.full_name || ''
                          if (val.toLowerCase() === name.toLowerCase()) {
                            return 'รหัสผ่านต้องไม่ตรงกับชื่อพนักงาน'
                          }
                          return true
                        }
                      }
                    })}
                    placeholder="รหัสผ่าน"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-xs transition-all"
                  />
                  {errors.password && <p className="mt-1 text-[10px] text-red-500">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ยืนยันรหัสผ่าน *</label>
                  <input
                    type="password"
                    {...register('confirm_password', { 
                      required: 'กรุณายืนยันรหัสผ่าน',
                      validate: value => value === password || 'รหัสผ่านไม่ตรงกัน'
                    })}
                    placeholder="ยืนยันรหัสผ่าน"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-xs transition-all"
                  />
                  {errors.confirm_password && <p className="mt-1 text-[10px] text-red-500">{errors.confirm_password.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pea-purple hover:bg-pea-purple-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 mt-4 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-xs"
              >
                {loading ? 'กำลังดำเนินการลงทะเบียน...' : 'ลงทะเบียนเปิดใช้งาน'}
              </button>
            </form>

            <div className="text-center text-[10px] text-gray-400 mt-5">
              มีบัญชีพนักงานอยู่แล้วใช่ไหม?{' '}
              <Link to="/login" className="text-pea-purple font-semibold hover:underline">
                เข้าสู่ระบบที่นี่
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
