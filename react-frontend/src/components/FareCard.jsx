import { IndianRupee, Clock, MapPin, Zap, Moon, Info } from 'lucide-react'

export default function FareCard({ fare, title = 'Fare Breakdown', isFinal = false }) {
  if (!fare) return null

  const rows = [
    { icon: IndianRupee, label: 'Base Charge',      value: fare.base_charge,         color: 'text-slate-600' },
    { icon: Clock,       label: 'Time Charge',       value: fare.time_charge,         color: 'text-blue-600',
      sub: `${fare.duration_hours ?? fare.estimated_hours ?? fare.actual_hours ?? 1} hrs × ₹${fare.rate_per_hour ?? 100}/hr` },
    { icon: MapPin,      label: 'Stop Charges',      value: fare.stop_charge,         color: 'text-purple-600',
      sub: `${fare.num_stops ?? 0} stop(s) × ₹${fare.stop_rate ?? 20}`,
      hide: !fare.stop_charge },
    { icon: Zap,         label: 'Emergency Surcharge', value: fare.emergency_surcharge, color: 'text-red-500',
      hide: !fare.emergency_surcharge },
    { icon: Moon,        label: 'Night Surcharge',   value: fare.night_surcharge,     color: 'text-indigo-500',
      hide: !fare.night_surcharge },
  ]

  return (
    <div className="card border-2 border-brand-100 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">{title}</h3>
        {isFinal
          ? <span className="badge-green">✓ Final</span>
          : <span className="badge-yellow">Estimated</span>}
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl p-4 text-white text-center mb-4">
        <p className="text-sm opacity-80 mb-1">Total Driver Hire Charges</p>
        <p className="text-4xl font-black">₹{fare.total_fare?.toFixed(2)}</p>
        <p className="text-xs opacity-70 mt-1">Fuel & vehicle costs are owner's responsibility</p>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2">
        {rows.filter(r => !r.hide).map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                <Icon size={14} className={color} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{label}</p>
                {sub && <p className="text-xs text-slate-400">{sub}</p>}
              </div>
            </div>
            <p className="font-semibold text-slate-800">₹{value?.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 bg-blue-50 rounded-lg p-3">
        <Info size={14} className="text-brand-600 mt-0.5 shrink-0" />
        <p className="text-xs text-brand-700">{fare.note || 'Driver hire only — fuel & vehicle costs are yours'}</p>
      </div>
    </div>
  )
}
