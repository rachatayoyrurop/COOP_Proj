import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProfilePage from './pages/ProfilePage'
import RoomsPage from './pages/RoomsPage'
import RoomDetailPage from './pages/RoomDetailPage'
import BookingFormPage from './pages/BookingFormPage'
import CalendarPage from './pages/CalendarPage'
import MyBookingsPage from './pages/MyBookingsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout'
import RoomManagementPage from './pages/superadmin/RoomManagementPage'
import UserManagementPage from './pages/superadmin/UserManagementPage'
import BookingLogsPage from './pages/superadmin/BookingLogsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Layout wrapper */}
          <Route
            path="/"
            element={<Layout><RoomsPage /></Layout>}
          />
          <Route
            path="/rooms/:id"
            element={<Layout><RoomDetailPage /></Layout>}
          />
          <Route
            path="/calendar"
            element={<Layout><CalendarPage /></Layout>}
          />

          {/* Authenticated */}
          <Route
            path="/book/:roomId"
            element={
              <ProtectedRoute>
                <Layout><BookingFormPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <Layout><MyBookingsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout><ProfilePage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['Admin', 'SuperAdmin']}>
                <Layout><AdminDashboardPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Super Admin */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute roles={['SuperAdmin']}>
                <Layout><SuperAdminLayout /></Layout>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/superadmin/rooms" replace />} />
            <Route path="rooms" element={<RoomManagementPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="booking-logs" element={<BookingLogsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
