import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Car, Clock, CheckCircle, AlertTriangle, ChevronRight, TrendingUp } from 'lucide-react'
import { bookingAPI, driverAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import DriverCard from '../components/DriverCard'

const statusConfig = {
  confirmed:   { label: 'Confirmed',   cls: 'badge-blue',   icon: '🔵' },
  in_progress: { label: 'In Progress', cls: 'badge-yellow',  icon: '🚗' },
  completed:   { label: 'Completed',   cls: 'badge-green',  icon: '✅' },
  cancelled:   { label: 'Cancelled',   cls: 'badge-red',    icon: '❌' },
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user)
  const [bookings, setBookings] = useState([])
  const [drivers,  setDrivers]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([bookingAPI.myBookings(), driverAPI.available()])
      .then(([b, d]) => { setBookings(b.data); setDrivers(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Bookings',  value: bookings.length,                                          icon: Car,           color: 'bg-blue-50 text-blue-600' },
    { label: 'Completed',       value: bookings.filter(b => b.status === 'completed').length,    icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Emergency Rides', value: bookings.filter(b => b.emergency).length,                 icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
    { label: 'Total Spent',     value: `₹${bookings.filter(b=>b.status==='completed').reduce((s,b)=>s+b.total_fare,0).toFixed(0)}`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="page-container">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="section-title">Welcome back, {user?.name} 👋</h1>
        <p className="text-slate-500 mt-1">Here's your activity overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-black text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/book" className="group card-hover bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Book a Driver</p>
              <p className="text-blue-100 text-sm mt-1">Hire a driver for your car</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Car size={24} className="text-white" />
            </div>
          </div>
        </Link>
        <Link to="/book" className="group card-hover bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Emergency Booking</p>
              <p className="text-red-100 text-sm mt-1">Instant driver assignment</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} className="text-white" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">Recent Bookings</h2>
            <Link to="/history" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              <Car size={36} className="mx-auto mb-2 opacity-30" />
              <p>No bookings yet</p>
              <Link to="/book" className="btn-primary text-sm mt-3 inline-flex">Book your first ride</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 4).map(b => {
                const cfg = statusConfig[b.status] || statusConfig.confirmed
                return (
                  <div key={b.id} className="card py-3 px-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {b.pickup_addr || `${b.pickup_lat?.toFixed(3)}, ${b.pickup_lng?.toFixed(3)}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.timestamp?.slice(0,16)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-sm text-slate-700">₹{b.total_fare?.toFixed(0)}</span>
                      <span className={cfg.cls + ' badge'}>{cfg.icon} {cfg.label}</span>
                      {['confirmed','in_progress'].includes(b.status) && (
                        <Link to={`/tracking/${b.id}`}
                          className="text-xs bg-brand-600 text-white px-2.5 py-1 rounded-lg hover:bg-brand-700 transition-colors">
                          Track
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Available drivers */}
        <div>
          <h2 className="font-bold text-slate-800 mb-4">Available Drivers</h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : drivers.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">No drivers available</div>
          ) : (
            <div className="space-y-3">
              {drivers.slice(0, 4).map(d => <DriverCard key={d.id} driver={d} compact />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
