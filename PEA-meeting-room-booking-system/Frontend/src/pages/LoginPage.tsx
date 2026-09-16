import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../api/auth'
import type { User } from '../types'
import peaLogo from '../assets/pea-logo.png'
import sawasdee from '../assets/Sawasdee.png'

interface LoginForm {
  emp_id: string
  password?: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setError('')
    setLoading(true)
    try {
      const empIdUpper = data.emp_id.toUpperCase()
      // 1. Find user in the local registered users list
      const storedUsers: User[] = JSON.parse(localStorage.getItem('pea_registered_users') || '[]')
      const matchedUser = storedUsers.find(u => u.emp_id.toUpperCase() === empIdUpper)

      if (!matchedUser) {
        throw new Error('ไม่พบรหัสพนักงานนี้ในระบบ หรือข้อมูลการเข้าสู่ระบบไม่ถูกต้อง')
      }

      // 2. Validate password
      if (matchedUser.password !== data.password) {
        throw new Error('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง')
      }

      // 3. Check if password is weak (matches ID/Name or is weak default)
      const lowerPass = (data.password || '').toLowerCase()
      if (
        lowerPass === matchedUser.emp_id.toLowerCase() ||
        lowerPass === matchedUser.full_name.toLowerCase() ||
        lowerPass === '123'
      ) {
        throw new Error('บัญชีของคุณใช้รหัสผ่านเริ่มต้น หรือรหัสผ่านตรงกับรหัส/ชื่อพนักงาน กรุณาคลิกที่ลิงก์ "ลืมรหัสผ่าน" ด้านล่างเพื่อเปลี่ยนรหัสผ่านใหม่เพื่อความปลอดภัย (ต้องมีตัวอักษรและตัวเลขร่วมกัน 4 ตัวขึ้นไป)')
      }

      // 3. Authenticate with backend API in the background (using user info from registration)
      const res = await loginApi(matchedUser.emp_id, matchedUser.full_name, matchedUser.department, matchedUser.email)

      // 4. Merge GORM database response (source of truth for name, department, role) with local custom fields
      const dbUser = res.data.data.user
      const mergedUser: User = {
        ...matchedUser,
        ...dbUser,
      }

      // 5. Sync the updated GORM roles/details back to the local users list in localStorage
      const updatedLocal = storedUsers.map(lu => {
        if (lu.emp_id.toUpperCase() === empIdUpper) {
          return { 
            ...lu, 
            role: dbUser.role,
            full_name: dbUser.full_name,
            department: dbUser.department
          }
        }
        return lu
      })
      localStorage.setItem('pea_registered_users', JSON.stringify(updatedLocal))

      // 6. Successful login
      login(res.data.data.token, mergedUser)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง')
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
        <div className="lg:col-span-6 flex flex-col items-center text-center text-white px-4">
          <img
            src={sawasdee}
            alt="PEA Mascot"
            className="w-48 sm:w-60 md:w-72 lg:w-80 h-auto object-contain animate-float drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-6"
          />
          <h1 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-md text-white mb-3">
            ระบบจองห้องประชุม
          </h1>
          <div className="h-1.5 w-16 bg-white/40 rounded-full mb-4" />
          <p className="text-purple-100 text-sm sm:text-base font-medium leading-relaxed drop-shadow max-w-md">
            การไฟฟ้าส่วนภูมิภาคเขต 3 <br className="hidden sm:inline" />
            (ภาคตะวันออกเฉียงเหนือ) จังหวัดนครราชสีมา
          </p>
        </div>

        {/* Right Column: Login Card */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] p-6 sm:p-10 border border-white/20 w-full max-w-md">
            
            {/* Header and Logo */}
            <div className="text-center mb-6">
              <img
                src={peaLogo}
                alt="PEA Logo"
                className="h-14 sm:h-16 w-auto object-contain mx-auto mb-3"
              />
              <h2 className="text-gray-800 text-xl font-bold tracking-tight">เข้าสู่ระบบ</h2>
              <p className="text-gray-400 text-xs mt-1">กรอกรหัสพนักงานและรหัสผ่านเพื่อเข้าใช้งาน</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">รหัสพนักงาน *</label>
                <input
                  {...register('emp_id', { required: 'กรุณากรอกรหัสพนักงาน' })}
                  placeholder="เช่น EMP001"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-sm transition-all uppercase"
                />
                {errors.emp_id && <p className="mt-1 text-xs text-red-500">{errors.emp_id.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-gray-700">รหัสผ่าน *</label>
                  <Link to="/forgot-password" className="text-xs text-pea-purple font-semibold hover:underline cursor-pointer">
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                <input
                  type="password"
                  {...register('password', { required: 'กรุณากรอกรหัสผ่าน' })}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent text-sm transition-all"
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pea-purple hover:bg-pea-purple-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 mt-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="text-center text-xs text-gray-500 mt-6">
              ยังไม่มีบัญชีพนักงานในระบบใช่ไหม?{' '}
              <Link to="/register" className="text-pea-purple font-semibold hover:underline">
                สมัครสมาชิกที่นี่
              </Link>
            </div>

            <p className="text-center text-[10px] text-gray-400 mt-6 leading-relaxed">
              ระบบเชื่อมโยงข้อมูลจำลอง SSO ขององค์กร<br />
              หากพบปัญหา กรุณาติดต่อ แผนกคอมพิวเตอร์และเครือข่าย
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
