import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { User } from '../types'
import peaLogo from '../assets/pea-logo.png'
import sawasdee from '../assets/Sawasdee.png'
import { ArrowLeft, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react'

interface ForgotPasswordForm {
  emp_id: string
  email: string
  password?: string
  confirm_password?: string
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ForgotPasswordForm>()
  const password = watch('password')

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError('')
    setLoading(true)
    
    // Simulate minor delay for premium feel
    await new Promise((resolve) => setTimeout(resolve, 800))

    try {
      const empIdUpper = data.emp_id.toUpperCase()
      const emailLower = data.email.toLowerCase()

      // 1. Load users from localStorage
      const storedUsers: User[] = JSON.parse(localStorage.getItem('pea_registered_users') || '[]')
      const userIndex = storedUsers.findIndex(
        (u) => u.emp_id.toUpperCase() === empIdUpper
      )

      if (userIndex === -1) {
        throw new Error('ไม่พบข้อมูลรหัสพนักงานนี้ในระบบ')
      }

      const matchedUser = storedUsers[userIndex]

      // 2. Validate email match (case-insensitive)
      if (!matchedUser.email || matchedUser.email.toLowerCase() !== emailLower) {
        throw new Error('อีเมลพนักงานไม่ตรงกับข้อมูลในระบบ')
      }

      // Validate name identical
      if (data.password?.toLowerCase() === matchedUser.full_name.toLowerCase()) {
        throw new Error('รหัสผ่านต้องไม่ตรงกับชื่อพนักงาน')
      }

      // 3. Update password in the localStorage array
      storedUsers[userIndex] = {
        ...matchedUser,
        password: data.password,
      }
      localStorage.setItem('pea_registered_users', JSON.stringify(storedUsers))

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการกู้คืนรหัสผ่าน')
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
            กู้คืนบัญชีและตั้งรหัสผ่านใหม่ <br />
            การไฟฟ้าส่วนภูมิภาคเขต 3
          </p>
        </div>

        {/* Right Column: Forgot Password Card */}
        <div className="lg:col-span-7 flex justify-center w-full">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] p-6 sm:p-8 border border-white/20 w-full max-w-lg min-h-[460px] flex flex-col justify-center">
            
            {!success ? (
              <>
                {/* Back to Login Link */}
                <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-pea-purple hover:underline mb-4 font-semibold w-fit">
                  <ArrowLeft size={14} /> กลับหน้าเข้าสู่ระบบ
                </Link>

                {/* Header and Logo */}
                <div className="text-center mb-6">
                  <img
                    src={peaLogo}
                    alt="PEA Logo"
                    className="h-12 w-auto object-contain mx-auto mb-2"
                  />
                  <h2 className="text-gray-800 text-xl font-bold tracking-tight flex items-center justify-center gap-1.5">
                    <KeyRound size={20} className="text-pea-purple" />
                    ลืมรหัสผ่านใช่ไหม?
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">ยืนยันข้อมูลพนักงานเพื่อกำหนดรหัสผ่านใหม่ของคุณ</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">รหัสพนักงาน *</label>
                      <input
                        {...register('emp_id', { required: 'กรุณากรอกรหัสพนักงาน' })}
                        placeholder="เช่น EMP001"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple text-sm transition-all uppercase text-gray-700"
                      />
                      {errors.emp_id && <p className="mt-1 text-[10px] text-red-500">{errors.emp_id.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">อีเมลพนักงาน *</label>
                      <input
                        type="email"
                        {...register('email', { 
                          required: 'กรุณากรอกอีเมล',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@gmail\.com$/i,
                            message: 'ต้องใช้บัญชีอีเมลของ @gmail.com เท่านั้น'
                          }
                        })}
                        placeholder="เช่น example@gmail.com"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple text-sm transition-all text-gray-700"
                      />
                      {errors.email && <p className="mt-1 text-[10px] text-red-500">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">ตั้งรหัสผ่านใหม่ *</label>
                      <input
                        type="password"
                        {...register('password', { 
                          required: 'กรุณากรอกรหัสผ่านใหม่',
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
                            }
                          }
                        })}
                        placeholder="รหัสผ่านใหม่"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple text-sm transition-all text-gray-700"
                      />
                      {errors.password && <p className="mt-1 text-[10px] text-red-500">{errors.password.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">ยืนยันรหัสผ่านใหม่ *</label>
                      <input
                        type="password"
                        {...register('confirm_password', { 
                          required: 'กรุณายืนยันรหัสผ่านใหม่',
                          validate: (val) => val === password || 'รหัสผ่านไม่ตรงกัน'
                        })}
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple text-sm transition-all text-gray-700"
                      />
                      {errors.confirm_password && <p className="mt-1 text-[10px] text-red-500">{errors.confirm_password.message}</p>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-pea-purple hover:bg-pea-purple-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 mt-4 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? 'กำลังตั้งค่ารหัสผ่านใหม่...' : 'รีเซ็ทรหัสผ่านใหม่'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6 animate-fade-in space-y-5">
                <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-md">
                  <CheckCircle2 size={44} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-gray-800 text-2xl font-black tracking-tight">รีเซ็ทรหัสผ่านเรียบร้อยแล้ว!</h2>
                  <p className="text-gray-500 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                    คุณได้กำหนดรหัสผ่านใหม่สำหรับรหัสพนักงานของคุณเรียบร้อยแล้ว สามารถใช้รหัสผ่านใหม่เพื่อเข้าใช้งานระบบได้ทันที
                  </p>
                </div>

                <div className="pt-4 max-w-xs mx-auto">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-pea-purple hover:bg-pea-purple-dark text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 text-sm"
                  >
                    <ShieldCheck size={18} />
                    เข้าสู่ระบบด้วยรหัสผ่านใหม่
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
