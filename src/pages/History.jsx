import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Car, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, MapPin, RotateCcw } from 'lucide-react'
import { bookingAPI } from '../services/api'
import FareCard from '../components/FareCard'
import DriverCard from '../components/DriverCard'

const statusConfig = {
  confirmed:   { label: 'Confirmed',   cls: 'badge-blue',   Icon: Clock },
  in_progress: { label: 'In Progress', cls: 'badge-yellow',  Icon: Car },
  completed:   { label: 'Completed',   cls: 'badge-green',  Icon: CheckCircle },
  cancelled:   { label: 'Cancelled',   cls: 'badge-red',    Icon: XCircle },
}

function BookingRow({ b }) {
  const [open, setOpen] = useState(false)
  const cfg = statusConfig[b.status] || statusConfig.confirmed
  const { Icon } = cfg

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            b.emergency ? 'bg-red-100' : 'bg-brand-100'
          }`}>
            {b.emergency ? <AlertTriangle size={18} className="text-red-600" /> : <Car size={18} className="text-brand-600" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">
              {b.pickup_addr || `${b.pickup_lat?.toFixed(3)}, ${b.pickup_lng?.toFixed(3)}`}
            </p>
            <p className="text-xs text-slate-400">{b.timestamp?.slice(0, 16)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="font-bold text-slate-800">₹{b.total_fare?.toFixed(0)}</p>
            <p className="text-xs text-slate-400">{b.is_final_fare ? 'Final' : 'Estimated'}</p>
          </div>
          <span className={`${cfg.cls} badge hidden sm:flex`}>
            <Icon size={11} /> {cfg.label}
          </span>
          {['confirmed','in_progress'].includes(b.status) && (
            <Link to={`/tracking/${b.id}`} onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs bg-brand-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-brand-700 transition-colors">
              <MapPin size={11} /> Track
            </Link>
          )}
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
          {b.driver && <DriverCard driver={b.driver} compact />}
          <FareCard fare={{
            base_charge: b.base_charge, time_charge: b.time_charge,
            emergency_surcharge: b.emergency_surcharge, night_surcharge: b.night_surcharge,
            total_fare: b.total_fare, estimated_hours: b.estimated_hours,
            note: 'Driver hire only',
          }} title="Fare Details" isFinal={b.is_final_fare} />
          {b.dropoff_addr && (
            <p className="text-sm text-slate-500">🏁 Dropoff: {b.dropoff_addr}</p>
          )}
          {/* Multi-stop display */}
          {b.stops && (() => {
            try {
              const s = JSON.parse(b.stops)
              if (!s.length) return null
              return (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    🛑 {s.length} Stop{s.length > 1 ? 's' : ''}
                  </p>
                  {s.map((stop, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">{i+1}</span>
                      {stop.addr}
                    </div>
                  ))}
                </div>
              )
            } catch { return null }
          })()}
          <Link
            to={`/book?pickup_addr=${encodeURIComponent(b.pickup_addr||'')}&pickup_lat=${b.pickup_lat}&pickup_lng=${b.pickup_lng}&estimated_hours=${b.estimated_hours}`}
            className="flex items-center justify-center gap-2 w-full border border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl py-2 text-sm font-medium transition-colors">
            <RotateCcw size={14} /> Rebook This Trip
          </Link>
        </div>
      )}
    </div>
  )
}

export default function History() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    bookingAPI.myBookings().then(({ data }) => setBookings(data)).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? bookings
    : filter === 'emergency' ? bookings.filter(b => b.emergency)
    : bookings.filter(b => b.status === filter)

  const filters = [
    { key: 'all',         label: 'All' },
    { key: 'confirmed',   label: 'Confirmed' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed',   label: 'Completed' },
    { key: 'emergency',   label: '🚨 Emergency' },
  ]

  return (
    <div className="page-container max-w-3xl">
      <h1 className="section-title mb-1">Booking History</h1>
      <p className="text-slate-500 mb-6">{bookings.length} total bookings</p>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f.key ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <Clock size={40} className="mx-auto mb-3 opacity-30" />
          <p>No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => <BookingRow key={b.id} b={b} />)}
        </div>
      )}
    </div>
  )
}
