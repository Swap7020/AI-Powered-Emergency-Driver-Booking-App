import { Star, Phone, CreditCard, Briefcase, CheckCircle } from 'lucide-react'

export default function DriverCard({ driver, compact = false }) {
  if (!driver) return null

  const initials = driver.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (compact) return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 truncate">{driver.name}</p>
        <p className="text-xs text-slate-500">⭐ {driver.rating} · {driver.experience_years}yrs exp</p>
      </div>
      <span className={`badge ${driver.availability ? 'badge-green' : 'badge-red'}`}>
        {driver.availability ? 'Available' : 'Busy'}
      </span>
    </div>
  )

  return (
    <div className="card-hover">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-bold text-slate-800">{driver.name}</h3>
            <span className={`badge ${driver.availability ? 'badge-green' : 'badge-red'}`}>
              {driver.availability ? '● Available' : '● Busy'}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span>{driver.rating} rating</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Briefcase size={13} className="text-brand-500" />
              <span>{driver.experience_years} yrs exp</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Phone size={13} className="text-emerald-500" />
              <span>{driver.phone}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <CreditCard size={13} className="text-purple-500" />
              <span className="truncate">{driver.license_number || 'N/A'}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle size={12} />
            <span>{driver.total_rides} rides completed</span>
          </div>
        </div>
      </div>
    </div>
  )
}
