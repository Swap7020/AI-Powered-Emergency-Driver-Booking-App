import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import useThemeStore from './store/themeStore'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BookDriver from './pages/BookDriver'
import History from './pages/History'
import DriverDashboard from './pages/DriverDashboard'
import LiveTracking from './pages/LiveTracking'

const Private = ({ children }) => {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}
const DriverOnly = ({ children }) => {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'driver') return <Navigate to="/dashboard" replace />
  return children
}
const CustomerOnly = ({ children }) => {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'customer') return <Navigate to="/driver" replace />
  return children
}

export default function App() {
  const token = useAuthStore(s => s.token)
  const dark   = useThemeStore(s => s.dark)

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/login"     element={token ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register"  element={token ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={<Private><CustomerOnly><Dashboard /></CustomerOnly></Private>} />
        <Route path="/book"      element={<Private><CustomerOnly><BookDriver /></CustomerOnly></Private>} />
        <Route path="/history"   element={<Private><CustomerOnly><History /></CustomerOnly></Private>} />
        <Route path="/driver"    element={<Private><DriverOnly><DriverDashboard /></DriverOnly></Private>} />
        <Route path="/tracking/:bookingId" element={<Private><LiveTracking /></Private>} />
        <Route path="*"          element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}
