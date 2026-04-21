import { useEffect, useState } from 'react'
import { ToggleLeft, ToggleRight, Star, Car, CheckCircle, Play, Flag, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { bookingAPI, driverAPI, authAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import FareCard from '../components/FareCard'
import DriverSimulator from '../components/DriverSimulator'

export default function DriverDashboard() {
  const user = useAuthStore(s => s.user)
  const [profile,    setProfile]    = useState(null)
  const [bookings,   setBookings]   = useState([])
  const [available,  setAvailable]  = useState(true)
  const [toggling,   setToggling]   = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [openFare,   setOpenFare]   = useState(null)
  const [completing, setCompleting] = useState({})
  const [actualHrs,  setActualHrs]  = useState({})

  const fetchData = async () => {
    try {
      const [me, bk] = await Promise.all([authAPI.me(), bookingAPI.myBookings()])
      setProfile(me.data)
      setAvailable(me.data.availability ?? true)
      setBookings(bk.data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const toggleAvailability = async () => {
    setToggling(true)
    try {
      await driverAPI.toggleStatus({ availability: !available })
      setAvailable(!available)
      toast.success(available ? 'You are now offline' : 'You are now available')
    } catch { toast.error('Failed to update status') }
    finally { setToggling(false) }
  }

  const startRide = async (id) => {
    try {
      await bookingAPI.start(id)
      toast.success('Ride started!')
      fetchData()
    } catch { toast.error('Failed to start ride') }
  }

  const completeRide = async (id) => {
    const hrs = parseFloat(actualHrs[id] || 1)
    if (!hrs || hrs <= 0) return toast.error('Enter actual hours driven')
    setCompleting(c => ({ ...c, [id]: true }))
    try {
      await bookingAPI.complete(id, { actual_hours: hrs })
      toast.success('Ride completed! Fare calculated.')
      fetchData()
    } catch { toast.error('Failed to complete ride') }
    finally { setCompleting(c => ({ ...c, [id]: false })) }
  }

  const stats = [
    { label: 'Total Rides',  value: profile?.total_rides ?? 0,                                    color: 'bg-blue-50 text-blue-600',    icon: Car },
    { label: 'Rating',       value: `⭐ ${profile?.rating ?? 5.0}`,                               color: 'bg-amber-50 text-amber-600',  icon: Star },
    { label: 'Completed',    value: bookings.filter(b => b.status === 'completed').length,         color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
    { label: 'Earnings',     value: `₹${bookings.filter(b=>b.status==='completed').reduce((s,b)=>s+b.total_fare,0).toFixed(0)}`, color: 'bg-purple-50 text-purple-600', icon: TrendingUp },
  ]

  if (loading) return (
    <div className="page-container">
      <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
    </div>
  )

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="section-title">Driver Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome, {user?.name}</p>
        </div>
        <button onClick={toggleAvailability} disabled={toggling}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            available ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>
          {available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {available ? 'Available' : 'Offline'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-xl font-black text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* License info */}
      {profile?.license_number && (
        <div className="card mb-6 bg-amber-50 border-amber-200">
          <p className="text-sm font-semibold text-amber-800">🪪 License: {profile.license_number}</p>
          <p className="text-xs text-amber-600 mt-0.5">{profile.experience_years} years experience</p>
        </div>
      )}

      {/* Bookings */}
      <h2 className="font-bold text-slate-800 mb-4">Assigned Rides</h2>
      {bookings.length === 0 ? (
        <div className="card text-center py-14 text-slate-400">
          <Car size={40} className="mx-auto mb-3 opacity-30" />
          <p>No rides yet.</p>
          <p className="text-sm mt-1">Toggle availability to receive booking requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${b.emergency ? 'badge-red' : 'badge-blue'}`}>
                      {b.emergency ? '🚨 Emergency' : '🚗 Regular'}
                    </span>
                    <span className={`badge ${
                      b.status === 'completed' ? 'badge-green' :
                      b.status === 'in_progress' ? 'badge-yellow' : 'badge-blue'
                    }`}>{b.status}</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm truncate">
                    📍 {b.pickup_addr || `${b.pickup_lat?.toFixed(3)}, ${b.pickup_lng?.toFixed(3)}`}
                  </p>
                  {b.dropoff_addr && <p className="text-xs text-slate-500 mt-0.5">🏁 {b.dropoff_addr}</p>}
                  <p className="text-xs text-slate-400 mt-1">{b.timestamp?.slice(0, 16)}</p>
                </div>

                <div className="flex flex-col gap-2 items-end shrink-0">
                  <p className="font-bold text-slate-800">₹{b.total_fare?.toFixed(0)}</p>
                  <p className="text-xs text-slate-400">{b.is_final_fare ? 'Final' : 'Estimated'}</p>

                  {b.status === 'confirmed' && (
                    <button onClick={() => startRide(b.id)}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                      <Play size={12} /> Start Ride
                    </button>
                  )}

                  {b.status === 'in_progress' && (
                    <div className="flex flex-col gap-1.5 items-end">
                      <div className="flex items-center gap-2">
                        <input type="number" min="0.5" max="24" step="0.5"
                          placeholder="Actual hrs"
                          value={actualHrs[b.id] || ''}
                          onChange={e => setActualHrs(h => ({ ...h, [b.id]: e.target.value }))}
                          className="input w-24 text-xs py-1.5" />
                        <button onClick={() => completeRide(b.id)} disabled={completing[b.id]}
                          className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3 flex items-center gap-1">
                          <Flag size={12} /> Complete
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">Enter actual hours to calculate final fare</p>
                    </div>
                  )}

                  <button onClick={() => setOpenFare(openFare === b.id ? null : b.id)}
                    className="text-xs text-brand-600 hover:underline">
                    {openFare === b.id ? 'Hide fare' : 'View fare'}
                  </button>
                </div>
              </div>

              {openFare === b.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
                  <FareCard fare={{
                    base_charge: b.base_charge, time_charge: b.time_charge,
                    emergency_surcharge: b.emergency_surcharge, night_surcharge: b.night_surcharge,
                    total_fare: b.total_fare, estimated_hours: b.estimated_hours,
                    note: 'Your earnings for this ride',
                  }} title="Fare Details" isFinal={b.is_final_fare} />
                </div>
              )}

              {/* Simulator for confirmed/in_progress rides */}
              {['confirmed', 'in_progress'].includes(b.status) && (
                <DriverSimulator
                  bookingId={b.id}
                  pickupLat={b.pickup_lat}
                  pickupLng={b.pickup_lng}
                  driverLat={profile?.latitude}
                  driverLng={profile?.longitude}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
