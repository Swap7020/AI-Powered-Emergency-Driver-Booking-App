import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  MapPin, Navigation, Clock, AlertTriangle, Car,
  Calculator, Mic, RotateCcw, ChevronRight, Route
} from 'lucide-react'
import toast from 'react-hot-toast'
import { bookingAPI } from '../services/api'
import FareCard from '../components/FareCard'
import DriverCard from '../components/DriverCard'
import VoiceBooking from '../components/VoiceBooking'
import MultiStopInput from '../components/MultiStopInput'

// ── Service type cards ────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  {
    key: 'your_car',
    icon: '🚗',
    title: 'Your Car',
    desc: 'Driver drives your personal vehicle',
    color: 'border-brand-400 bg-brand-50 dark:bg-brand-900/20',
    activeColor: 'border-brand-600 bg-brand-100 dark:bg-brand-900/40 ring-2 ring-brand-500',
  },
  {
    key: 'hourly',
    icon: '⏱️',
    title: 'Hourly Hire',
    desc: 'Book driver by the hour for errands',
    color: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
    activeColor: 'border-purple-600 bg-purple-100 dark:bg-purple-900/40 ring-2 ring-purple-500',
  },
  {
    key: 'emergency',
    icon: '🚨',
    title: 'Emergency',
    desc: 'Instant driver — highest priority',
    color: 'border-red-400 bg-red-50 dark:bg-red-900/20',
    activeColor: 'border-red-600 bg-red-100 dark:bg-red-900/40 ring-2 ring-red-500',
  },
]

export default function BookDriver() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [serviceType, setServiceType] = useState('your_car')
  const [loading,     setLoading]     = useState(false)
  const [locating,    setLocating]    = useState(false)
  const [estimate,    setEstimate]    = useState(null)
  const [result,      setResult]      = useState(null)
  const [showVoice,   setShowVoice]   = useState(false)
  const [stops,       setStops]       = useState([])   // multi-stop
  const [form, setForm] = useState({
    pickup_lat: '', pickup_lng: '', pickup_addr: '',
    dropoff_lat: '', dropoff_lng: '', dropoff_addr: '',
    estimated_hours: 1,
  })

  // One-click rebook — pre-fill from URL params
  useEffect(() => {
    const addr = searchParams.get('pickup_addr')
    const lat  = searchParams.get('pickup_lat')
    const lng  = searchParams.get('pickup_lng')
    const hrs  = searchParams.get('estimated_hours')
    const svc  = searchParams.get('service_type')
    if (addr) setForm(f => ({ ...f, pickup_addr: addr, pickup_lat: lat || '', pickup_lng: lng || '' }))
    if (hrs)  setForm(f => ({ ...f, estimated_hours: parseFloat(hrs) }))
    if (svc)  setServiceType(svc)
    if (addr) toast.success('Previous booking details loaded!')
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const getLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        set('pickup_lat', coords.latitude.toFixed(5))
        set('pickup_lng', coords.longitude.toFixed(5))
        set('pickup_addr', `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`)
        toast.success('Location detected!')
        setLocating(false)
      },
      () => { toast.error('Could not get location'); setLocating(false) }
    )
  }

  // Voice booking result handler
  const handleVoiceResult = (parsed) => {
    if (parsed.pickup_addr) set('pickup_addr', parsed.pickup_addr)
    if (parsed.estimated_hours) set('estimated_hours', parsed.estimated_hours)
    if (parsed.emergency) setServiceType('emergency')
    toast.success('Voice input applied!')
  }

  const payload = () => ({
    pickup_lat:      parseFloat(form.pickup_lat)  || 12.9716,
    pickup_lng:      parseFloat(form.pickup_lng)  || 77.5946,
    pickup_addr:     form.pickup_addr  || null,
    dropoff_lat:     form.dropoff_lat  ? parseFloat(form.dropoff_lat)  : null,
    dropoff_lng:     form.dropoff_lng  ? parseFloat(form.dropoff_lng)  : null,
    dropoff_addr:    form.dropoff_addr || null,
    stops: stops.filter(s => s.addr.trim()).map(s => ({
      addr: s.addr,
      lat:  s.lat ? parseFloat(s.lat) : null,
      lng:  s.lng ? parseFloat(s.lng) : null,
    })),
    estimated_hours: form.estimated_hours,
    emergency:       serviceType === 'emergency',
  })

  const handleEstimate = async () => {
    setLoading(true)
    try {
      const { data } = await bookingAPI.estimate(payload())
      setEstimate(data); setResult(null)
    } catch { toast.error('Could not estimate fare') }
    finally { setLoading(false) }
  }

  const handleBook = async () => {
    setLoading(true)
    try {
      const { data } = await bookingAPI.create(payload())
      setResult(data); setEstimate(null)
      toast.success('Driver booked!')
    } catch (err) {
      const d = err.response?.data?.detail
      toast.error(typeof d === 'string' ? d : 'Booking failed')
    } finally { setLoading(false) }
  }

  const isEmergency = serviceType === 'emergency'

  return (
    <div className="page-container max-w-3xl">
      {showVoice && (
        <VoiceBooking
          onResult={handleVoiceResult}
          onClose={() => setShowVoice(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="section-title">Book a Driver</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Your car, our driver — hire by the hour
          </p>
        </div>
        {/* Voice booking button */}
        <button onClick={() => setShowVoice(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow transition-all active:scale-95">
          <Mic size={17} /> Voice Book
        </button>
      </div>

      {/* Service type selector */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {SERVICE_TYPES.map(s => (
          <button key={s.key} onClick={() => setServiceType(s.key)}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              serviceType === s.key ? s.activeColor : s.color + ' border-transparent hover:border-current'
            }`}>
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{s.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{s.desc}</p>
          </button>
        ))}
      </div>

      {isEmergency && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            Emergency mode — nearest + highest-rated driver assigned instantly. ₹80 surcharge applies.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          {/* Pickup */}
          <div className="card">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2 text-sm">
              <MapPin size={15} className="text-emerald-500" /> Pickup Location
            </h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Address or landmark"
                  value={form.pickup_addr} onChange={e => set('pickup_addr', e.target.value)} />
                <button onClick={getLocation} disabled={locating}
                  className="btn-outline px-3 shrink-0" title="Use my location">
                  <Navigation size={15} className={locating ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="input text-xs" placeholder="Latitude"
                  value={form.pickup_lat} onChange={e => set('pickup_lat', e.target.value)} />
                <input className="input text-xs" placeholder="Longitude"
                  value={form.pickup_lng} onChange={e => set('pickup_lng', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Dropoff */}
          <div className="card">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2 text-sm">
              <MapPin size={15} className="text-red-500" /> Destination
              <span className="text-xs text-slate-400 font-normal">(optional)</span>
            </h3>
            <div className="space-y-2">
              <input className="input" placeholder="Destination address"
                value={form.dropoff_addr} onChange={e => set('dropoff_addr', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input text-xs" placeholder="Latitude"
                  value={form.dropoff_lat} onChange={e => set('dropoff_lat', e.target.value)} />
                <input className="input text-xs" placeholder="Longitude"
                  value={form.dropoff_lng} onChange={e => set('dropoff_lng', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Multi-stop */}
          <div className="card">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2 text-sm">
              <Route size={15} className="text-purple-500" /> Intermediate Stops
              <span className="text-xs text-slate-400 font-normal">(optional · ₹20/stop)</span>
            </h3>
            <MultiStopInput stops={stops} onChange={setStops} />
          </div>

          {/* Duration */}
          <div className="card">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2 text-sm">
              <Clock size={15} className="text-brand-500" /> Hire Duration
            </h3>
            <input type="range" min="0.5" max="12" step="0.5"
              value={form.estimated_hours}
              onChange={e => set('estimated_hours', parseFloat(e.target.value))}
              className="w-full accent-brand-600" />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>30 min</span>
              <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">
                {form.estimated_hours} hr{form.estimated_hours > 1 ? 's' : ''}
              </span>
              <span>12 hrs</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
              ₹100/hr · Base ₹50 · {isEmergency ? '+₹80 emergency' : 'No surcharge'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleEstimate} disabled={loading}
              className="btn-outline py-3 text-sm">
              <Calculator size={15} /> Estimate Fare
            </button>
            <button onClick={handleBook} disabled={loading}
              className={`py-3 text-sm ${isEmergency ? 'btn-emergency' : 'btn-primary'}`}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Car size={15} />}
              {isEmergency ? '🚨 Emergency!' : 'Book Driver'}
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {estimate && <FareCard fare={estimate} title="Fare Estimate" />}

          {result && (
            <div className="space-y-4 animate-slide-up">
              {/* Confirmed */}
              <div className="card border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                    <Car size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">Booking Confirmed!</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">ID: {result.id?.slice(0,8)}...</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white dark:bg-slate-700 rounded-lg p-2">
                    <p className="text-slate-400 text-xs">Status</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{result.status}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 rounded-lg p-2">
                    <p className="text-slate-400 text-xs">Type</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      {result.emergency ? '🚨 Emergency' : serviceType === 'hourly' ? '⏱️ Hourly' : '🚗 Your Car'}
                    </p>
                  </div>
                </div>
                {/* Show stops if any */}
                {result.stops && (() => {
                  try {
                    const parsedStops = JSON.parse(result.stops)
                    if (parsedStops.length > 0) return (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          🛑 {parsedStops.length} Stop{parsedStops.length > 1 ? 's' : ''}
                        </p>
                        {parsedStops.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">{i+1}</span>
                            {s.addr}
                          </div>
                        ))}
                      </div>
                    )
                  } catch {}
                  return null
                })()}
              </div>

              {result.driver && <DriverCard driver={result.driver} />}

              <FareCard fare={{
                base_charge: result.base_charge,
                time_charge: result.time_charge,
                emergency_surcharge: result.emergency_surcharge,
                night_surcharge: result.night_surcharge,
                total_fare: result.total_fare,
                estimated_hours: result.estimated_hours,
                rate_per_hour: 100,
                note: 'Driver hire only — fuel & vehicle costs are yours',
              }} title="Fare Breakdown" />

              {/* Action buttons */}
              <Link to={`/tracking/${result.id}`}
                className="btn-primary w-full justify-center flex items-center gap-2 text-sm">
                📍 Track Driver Live <ChevronRight size={15} />
              </Link>

              {/* One-click rebook */}
              <Link
                to={`/book?pickup_addr=${encodeURIComponent(form.pickup_addr)}&pickup_lat=${form.pickup_lat}&pickup_lng=${form.pickup_lng}&estimated_hours=${form.estimated_hours}&service_type=${serviceType}`}
                onClick={() => { setResult(null); setEstimate(null) }}
                className="btn-ghost w-full justify-center flex items-center gap-2 text-sm border border-slate-200 dark:border-slate-600">
                <RotateCcw size={14} /> Rebook Same Trip
              </Link>
            </div>
          )}

          {!estimate && !result && (
            <div className="card border-dashed border-2 border-slate-200 dark:border-slate-600 text-center py-12 text-slate-400 dark:text-slate-500">
              <Calculator size={36} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Click "Estimate Fare" to preview pricing<br />before confirming</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
