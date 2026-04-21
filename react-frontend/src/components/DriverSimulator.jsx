/**
 * Driver Location Simulator
 * Simulates a driver moving from their location toward the pickup point.
 * Used for demo/testing — remove in production.
 * Only visible to drivers on the DriverDashboard.
 */
import { useState, useRef, useEffect } from 'react'
import { Play, Square, Navigation } from 'lucide-react'

const WS_BASE = import.meta.env.VITE_WS_URL ||
  (window.location.hostname === 'localhost' ? 'ws://localhost:8000' : `wss://${window.location.hostname}`)

export default function DriverSimulator({ bookingId, pickupLat, pickupLng, driverLat, driverLng }) {
  const [running, setRunning]   = useState(false)
  const [step,    setStep]      = useState(0)
  const wsRef  = useRef(null)
  const timerRef = useRef(null)

  // Generate waypoints from driver → pickup
  const waypoints = generateWaypoints(
    driverLat || 12.965, driverLng || 77.59,
    pickupLat || 12.9716, pickupLng || 77.5946,
    20
  )

  const connectWS = () => {
    const ws = new WebSocket(`${WS_BASE}/ws/tracking/${bookingId}`)
    wsRef.current = ws
    return new Promise(res => { ws.onopen = res })
  }

  const start = async () => {
    setRunning(true)
    setStep(0)
    await connectWS()

    let i = 0
    timerRef.current = setInterval(() => {
      if (i >= waypoints.length) {
        // Send "arrived" status
        wsRef.current?.send(JSON.stringify({
          type: 'status', status: 'arrived',
          message: 'Driver has arrived at your pickup location',
        }))
        stop()
        return
      }
      const wp = waypoints[i]
      wsRef.current?.send(JSON.stringify({
        type: 'location', lat: wp.lat, lng: wp.lng,
        heading: wp.heading, speed: 30,
      }))
      setStep(i)
      i++
    }, 1500)
  }

  const stop = () => {
    clearInterval(timerRef.current)
    wsRef.current?.close()
    setRunning(false)
  }

  useEffect(() => () => stop(), [])

  if (!bookingId) return null

  return (
    <div className="card bg-amber-50 border-amber-200 mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-amber-800">🧪 Driver Simulator</p>
        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Demo only</span>
      </div>
      <p className="text-xs text-amber-700 mb-3">
        Simulates driver moving toward pickup. Customer's tracking page will update live.
      </p>
      <div className="flex items-center gap-2">
        {!running ? (
          <button onClick={start}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
            <Play size={13} /> Start Simulation
          </button>
        ) : (
          <button onClick={stop}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
            <Square size={13} /> Stop
          </button>
        )}
        {running && (
          <span className="text-xs text-amber-700 flex items-center gap-1">
            <Navigation size={12} className="animate-spin" />
            Step {step + 1}/{waypoints.length}
          </span>
        )}
      </div>
    </div>
  )
}

function generateWaypoints(fromLat, fromLng, toLat, toLng, steps) {
  const points = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Add slight random jitter to simulate real movement
    const jitter = () => (Math.random() - 0.5) * 0.0005
    const lat = fromLat + (toLat - fromLat) * t + jitter()
    const lng = fromLng + (toLng - fromLng) * t + jitter()
    const heading = Math.atan2(toLng - fromLng, toLat - fromLat) * (180 / Math.PI)
    points.push({ lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)), heading: Math.round(heading) })
  }
  return points
}
