import type { ReactNode } from 'react'
import Navbar from './Navbar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8FC] relative overflow-hidden">
      {/* Ambient soft glows to prevent empty feeling */}
      <div className="absolute top-0 left-[-15%] w-[55%] h-[35%] bg-purple-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-15%] w-[50%] h-[45%] bg-purple-300/15 rounded-full blur-[140px] pointer-events-none" />

      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-100 py-6 mt-8 relative z-10 w-full flex items-center justify-center">
        <p className="text-center text-xs text-gray-400 font-semibold tracking-wide px-4">
          © {new Date().getFullYear()} การไฟฟ้าส่วนภูมิภาค (PEA) · ระบบจองห้องประชุมออนไลน์ · เขต 3
        </p>
      </footer>
    </div>
  )
}
