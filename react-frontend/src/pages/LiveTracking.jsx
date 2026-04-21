import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin, Navigation, Clock, CheckCircle, Car,
  Phone, Star, AlertTriangle, Wifi, WifiOff, RefreshCw
} from 'lucide-react'
import { trackingAPI } from '../services/api'
import useAuthStore from '../store/authStore'

// WebSocket URL — in production points to Render backend
const WS_BASE = import.meta.env.VITE_WS_URL ||
  (window.location.hostname === 'localhost' ? 'ws://localhost:8000' : `wss://${window.location.hostname}`)

// Status timeline steps
const STATUS_STEPS = [
  { key: 'confirmed',    label: 'Driver Assigned',  icon: Car,          color: 'text-blue-600',   bg: 'bg-blue-100' },
  { key: 'arrived',      label: 'Driver Arrived',   icon: MapPin,       color: 'text-purple-600', bg: 'bg-purple-100' },
  { key: 'in_progress',  label: 'Ride Started',     icon: Navigation,   color: 'text-amber-600',  bg: 'bg-amber-100' },
  { key: 'completed',    label: 'Ride Completed',   icon: CheckCircle,  color: 'text-emerald-600',bg: 'bg-emerald-100' },
]

const STATUS_ORDER = ['confirmed', 'arrived', 'in_progress', 'completed']

function ETABadge({ label, minutes, color = 'blue' }) {
  if (!minutes) return null
  const colorMap = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    emerald:'bg-emerald-50 border-emerald-200 text-emerald-700',
  }
  return (
    <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 ${colorMap[color]}`}>
      <Clock size={16} />
      <div>
        <p className="text-xs opacity-70">{label}</p>
        <p className="font-bold text-lg leading-none">{minutes} min</p>
      </div>
    </div>
  )
}

// Simple SVG map — shows pickup, dropoff, and animated driver marker
function MapView({ driverPos, pickupPos, dropoffPos, status }) {
  // Normalize coordinates to SVG viewport (400x300)
  const allLats = [driverPos?.lat, pickupPos?.lat, dropoffPos?.lat].filter(Boolean)
  const allLngs = [driverPos?.lng, pickupPos?.lng, dropoffPos?.lng].filter(Boolean)

  if (allLats.length === 0) return (
    <div className="w-full h-64 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
      <div className="text-center">
        <MapPin size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">Waiting for driver location...</p>
      </div>
    </div>
  )

  const minLat = Math.min(...allLats) - 0.005
  const maxLat = Math.max(...allLats) + 0.005
  const minLng = Math.min(...allLngs) - 0.005
  const maxLng = Math.max(...allLngs) + 0.005

  const toX = (lng) => ((lng - minLng) / (maxLng - minLng)) * 360 + 20
  const toY = (lat) => (1 - (lat - minLat) / (maxLat - minLat)) * 220 + 20

  const dX = driverPos ? toX(driverPos.lng) : null
  const dY = driverPos ? toY(driverPos.lat) : null
  const pX = pickupPos  ? toX(pickupPos.lng)  : null
  const pY = pickupPos  ? toY(pickupPos.lat)  : null
  const dpX = dropoffPos ? toX(dropoffPos.lng) : null
  const dpY = dropoffPos ? toY(dropoffPos.lat) : null

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
      <svg viewBox="0 0 400 260" className="w-full" style={{ height: '260px' }}>
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="400" height="260" fill="#f8fafc" />
        <rect width="400" height="260" fill="url(#grid)" />

        {/* Route line */}
        {pX && dpX && (
          <line x1={pX} y1={pY} x2={dpX} y2={dpY}
            stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,4" />
        )}
        {dX && pX && (
          <line x1={dX} y1={dY} x2={pX} y2={pY}
            stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="8,4" opacity="0.6" />
        )}

        {/* Pickup marker */}
        {pX && (
          <g>
            <circle cx={pX} cy={pY} r="10" fill="#10b981" opacity="0.2" />
            <circle cx={pX} cy={pY} r="6"  fill="#10b981" />
            <text x={pX} y={pY - 14} textAnchor="middle" fontSize="10" fill="#065f46" fontWeight="600">Pickup</text>
          </g>
        )}

        {/* Dropoff marker */}
        {dpX && (
          <g>
            <circle cx={dpX} cy={dpY} r="10" fill="#ef4444" opacity="0.2" />
            <circle cx={dpX} cy={dpY} r="6"  fill="#ef4444" />
            <text x={dpX} y={dpY - 14} textAnchor="middle" fontSize="10" fill="#991b1b" fontWeight="600">Dropoff</text>
          </g>
        )}

        {/* Driver marker — animated pulse */}
        {dX && (
          <g>
            <circle cx={dX} cy={dY} r="18" fill="#3b82f6" opacity="0.15">
              <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={dX} cy={dY} r="12" fill="#2563eb" opacity="0.25" />
            <circle cx={dX} cy={dY} r="8"  fill="#1d4ed8" />
            {/* Car icon approximation */}
            <text x={dX} y={dY + 4} textAnchor="middle" fontSize="10" fill="white">🚗</text>
            <text x={dX} y={dY - 16} textAnchor="middle" fontSize="9" fill="#1e40af" fontWeight="700">Driver</text>
          </g>
        )}
      </svg>

      {/* Map footer */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Live tracking map</span>
        {driverPos && (
          <span>📍 {driverPos.lat?.toFixed(4)}, {driverPos.lng?.toFixed(4)}</span>
        )}
      </div>
    </div>
  )
}

export default function LiveTracking() {
  const { bookingId } = useParams()
  const token = useAuthStore(s => s.token)
  const [tracking, setTracking]   = useState(null)
  const [driverPos, setDriverPos] = useState(null)
  const [wsStatus, setWsStatus]   = useState('connecting') // connecting | connected | disconnected
  const [statusLog, setStatusLog] = useState([])
  const [currentStatus, setCurrentStatus] = useState('confirmed')
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  // Fetch initial tracking state via REST
  const fetchTracking = useCallback(async () => {
    try {
      const { data } = await trackingAPI.get(bookingId)
      setTracking(data)
      setCurrentStatus(data.status)
      if (data.location) setDriverPos(data.location)
    } catch {}
  }, [bookingId])

  // WebSocket connection
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${WS_BASE}/ws/tracking/${bookingId}`)
    wsRef.current = ws

    ws.onopen = () => {
      setWsStatus('connected')
      clearTimeout(reconnectRef.current)
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)

        if (msg.type === 'location') {
          setDriverPos({ lat: msg.lat, lng: msg.lng, heading: msg.heading, speed: msg.speed })
          // Recalculate ETA locally
          setTracking(prev => prev ? { ...prev, location: msg } : prev)
        }

        if (msg.type === 'status') {
          setCurrentStatus(msg.status)
          setStatusLog(prev => [{
            status: msg.status,
            message: msg.message || getStatusMessage(msg.status),
            time: new Date().toLocaleTimeString(),
          }, ...prev].slice(0, 10))
          // Refresh full tracking data
          fetchTracking()
        }
      } catch {}
    }

    ws.onclose = () => {
      setWsStatus('disconnected')
      // Auto-reconnect after 3s
      reconnectRef.current = setTimeout(connectWS, 3000)
    }

    ws.onerror = () => setWsStatus('disconnected')
  }, [bookingId, fetchTracking])

  useEffect(() => {
    fetchTracking()
    connectWS()
    // Poll REST every 10s as fallback
    const poll = setInterval(fetchTracking, 10000)
    return () => {
      clearInterval(poll)
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [fetchTracking, connectWS])

  const getStatusMessage = (s) => ({
    confirmed:   'Driver has been assigned to your booking',
    arrived:     'Driver has arrived at your pickup location',
    in_progress: 'Your ride has started',
    completed:   'Ride completed successfully',
  }[s] || s)

  const currentStepIdx = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className="page-container max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="section-title">Live Tracking</h1>
          <p className="text-slate-500 text-sm mt-1">Booking #{bookingId?.slice(0, 8)}...</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
            wsStatus === 'connected'
              ? 'bg-emerald-100 text-emerald-700'
              : wsStatus === 'connecting'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {wsStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
            {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
          </div>
          <button onClick={fetchTracking}
            className="btn-ghost text-sm flex items-center gap-1.5 py-1.5">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Map + ETA */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map */}
          <MapView
            driverPos={driverPos}
            pickupPos={tracking ? { lat: tracking.pickup_lat, lng: tracking.pickup_lng } : null}
            dropoffPos={tracking?.dropoff_lat ? { lat: tracking.dropoff_lat, lng: tracking.dropoff_lng } : null}
            status={currentStatus}
          />

          {/* ETA cards */}
          <div className="grid grid-cols-2 gap-3">
            <ETABadge
              label="ETA to Pickup"
              minutes={tracking?.eta_to_pickup_min}
              color="blue"
            />
            <ETABadge
              label="ETA to Destination"
              minutes={tracking?.eta_to_dropoff_min}
              color="amber"
            />
          </div>

          {/* Location details */}
          {tracking && (
            <div className="card space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Pickup</p>
                  <p className="text-sm font-medium text-slate-700">
                    {tracking.pickup_addr || `${tracking.pickup_lat?.toFixed(4)}, ${tracking.pickup_lng?.toFixed(4)}`}
                  </p>
                </div>
              </div>
              {tracking.dropoff_lat && (
                <div className="flex items-start gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Dropoff</p>
                    <p className="text-sm font-medium text-slate-700">
                      {tracking.dropoff_addr || `${tracking.dropoff_lat?.toFixed(4)}, ${tracking.dropoff_lng?.toFixed(4)}`}
                    </p>
                  </div>
                </div>
              )}
              {driverPos?.speed > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 border-t border-slate-50">
                  <Navigation size={12} />
                  <span>Speed: {driverPos.speed} km/h</span>
                  {driverPos.heading !== undefined && <span>· Heading: {driverPos.heading}°</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Status + Driver */}
        <div className="space-y-4">
          {/* Driver card */}
          {tracking?.driver && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm">Your Driver</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {tracking.driver.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{tracking.driver.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      {tracking.driver.rating}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{tracking.driver.license}</span>
                  </div>
                </div>
              </div>
              <a href={`tel:${tracking.driver.phone}`}
                className="mt-3 flex items-center justify-center gap-2 w-full border border-brand-200 text-brand-700 hover:bg-brand-50 rounded-xl py-2 text-sm font-medium transition-colors">
                <Phone size={14} /> {tracking.driver.phone}
              </a>
            </div>
          )}

          {/* Status timeline */}
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4 text-sm">Ride Status</h3>
            <div className="space-y-1">
              {STATUS_STEPS.map((step, idx) => {
                const done    = idx <= currentStepIdx
                const current = idx === currentStepIdx
                const Icon    = step.icon
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    {/* Connector line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        done ? `${step.bg} ${step.color}` : 'bg-slate-100 text-slate-300'
                      } ${current ? 'ring-2 ring-offset-1 ring-current' : ''}`}>
                        <Icon size={15} />
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 ${done && idx < currentStepIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="pt-1.5 pb-4">
                      <p className={`text-sm font-semibold ${done ? 'text-slate-800' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                      {current && (
                        <p className="text-xs text-slate-500 mt-0.5">{getStatusMessage(step.key)}</p>
                      )}
                      {done && current && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 mt-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live status log */}
          {statusLog.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm">Activity Log</h3>
              <div className="space-y-2">
                {statusLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-400 shrink-0 mt-0.5">{log.time}</span>
                    <span className="text-slate-600">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency indicator */}
          {tracking?.emergency && (
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={16} />
                <span className="font-semibold text-sm">Emergency Booking</span>
              </div>
              <p className="text-xs text-red-500 mt-1">Priority driver assigned</p>
            </div>
          )}

          <Link to="/history" className="btn-outline w-full text-sm justify-center">
            View Booking Details
          </Link>
        </div>
      </div>
    </div>
  )
}
