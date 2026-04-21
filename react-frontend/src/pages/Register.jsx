import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, User, Phone, Lock, MapPin, CreditCard, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'

const Field = ({ label, icon: Icon, error, ...props }) => (
  <div>
    <label className="label">{label}</label>
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
      <input className={`input ${Icon ? 'pl-10' : ''} ${error ? 'border-red-400 focus:ring-red-400' : ''}`} {...props} />
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
)

export default function Register() {
  const [tab, setTab] = useState('customer')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const [cust, setCust] = useState({ name:'', phone:'', email:'', password:'', confirm:'', address:'', city:'', id_type:'aadhaar', id_number:'', latitude:'12.9716', longitude:'77.5946' })
  const [drv,  setDrv]  = useState({ name:'', phone:'', email:'', password:'', confirm:'', address:'', city:'', license_number:'', license_expiry:'', experience_years:2, latitude:'12.9716', longitude:'77.5946' })

  const submitCustomer = async (e) => {
    e.preventDefault()
    if (cust.password !== cust.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      const { data } = await authAPI.registerCustomer({ ...cust, latitude: parseFloat(cust.latitude), longitude: parseFloat(cust.longitude) })
      setAuth(data.access_token, { id: data.user_id, name: data.name, role: data.role })
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  const submitDriver = async (e) => {
    e.preventDefault()
    if (drv.password !== drv.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      const { data } = await authAPI.registerDriver({ ...drv, latitude: parseFloat(drv.latitude), longitude: parseFloat(drv.longitude), experience_years: parseInt(drv.experience_years) })
      setAuth(data.access_token, { id: data.user_id, name: data.name, role: data.role })
      toast.success('Driver account created!')
      navigate('/driver')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  const tabBtn = (key, label, emoji) => (
    <button onClick={() => setTab(key)}
      className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${tab === key ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
      {emoji} {label}
    </button>
  )

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Car size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-1">Join MyDriver today</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl mb-5">
          {tabBtn('customer', 'Customer', '👤')}
          {tabBtn('driver',   'Driver',   '🧑‍✈️')}
        </div>

        <div className="card shadow-lg">
          {/* ── Customer Form ── */}
          {tab === 'customer' && (
            <form onSubmit={submitCustomer} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                📋 Aadhaar or PAN card required for identity verification
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name *"    icon={User}  placeholder="John Doe"      value={cust.name}    onChange={e => setCust({...cust, name: e.target.value})}    required />
                <Field label="Phone *"        icon={Phone} placeholder="9876543210"    value={cust.phone}   onChange={e => setCust({...cust, phone: e.target.value})}   required />
              </div>
              <Field label="Email" icon={null} type="email" placeholder="john@email.com" value={cust.email} onChange={e => setCust({...cust, email: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" placeholder="Bangalore" value={cust.city} onChange={e => setCust({...cust, city: e.target.value})} />
                <div>
                  <label className="label">ID Type *</label>
                  <select className="input" value={cust.id_type} onChange={e => setCust({...cust, id_type: e.target.value})}>
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="pan">PAN Card</option>
                  </select>
                </div>
              </div>
              <Field label={`${cust.id_type === 'aadhaar' ? 'Aadhaar' : 'PAN'} Number *`} icon={CreditCard}
                placeholder={cust.id_type === 'aadhaar' ? '1234 5678 9012' : 'ABCDE1234F'}
                value={cust.id_number} onChange={e => setCust({...cust, id_number: e.target.value})} required />
              <Field label="Address" placeholder="123, MG Road, Bangalore" value={cust.address} onChange={e => setCust({...cust, address: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Password *"         icon={Lock} type="password" placeholder="••••••••" value={cust.password} onChange={e => setCust({...cust, password: e.target.value})} required />
                <Field label="Confirm Password *" icon={Lock} type="password" placeholder="••••••••" value={cust.confirm}  onChange={e => setCust({...cust, confirm: e.target.value})}  required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? 'Creating account...' : '✅ Register as Customer'}
              </button>
            </form>
          )}

          {/* ── Driver Form ── */}
          {tab === 'driver' && (
            <form onSubmit={submitDriver} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                🪪 Valid driving license required for driver registration
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name *"  icon={User}  placeholder="Ravi Kumar"   value={drv.name}  onChange={e => setDrv({...drv, name: e.target.value})}  required />
                <Field label="Phone *"      icon={Phone} placeholder="9876543210"   value={drv.phone} onChange={e => setDrv({...drv, phone: e.target.value})} required />
              </div>
              <Field label="Email" type="email" placeholder="ravi@email.com" value={drv.email} onChange={e => setDrv({...drv, email: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" placeholder="Bangalore" value={drv.city} onChange={e => setDrv({...drv, city: e.target.value})} />
                <Field label="License Number *" icon={FileText} placeholder="KA01-2019-1234567" value={drv.license_number} onChange={e => setDrv({...drv, license_number: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="License Expiry *" placeholder="DD/MM/YYYY" value={drv.license_expiry} onChange={e => setDrv({...drv, license_expiry: e.target.value})} required />
                <div>
                  <label className="label">Experience (years)</label>
                  <input type="range" min="0" max="30" value={drv.experience_years}
                    onChange={e => setDrv({...drv, experience_years: e.target.value})}
                    className="w-full accent-brand-600 mt-2" />
                  <p className="text-xs text-slate-500 text-center">{drv.experience_years} years</p>
                </div>
              </div>
              <Field label="Address" placeholder="456, Koramangala, Bangalore" value={drv.address} onChange={e => setDrv({...drv, address: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Password *"         icon={Lock} type="password" placeholder="••••••••" value={drv.password} onChange={e => setDrv({...drv, password: e.target.value})} required />
                <Field label="Confirm Password *" icon={Lock} type="password" placeholder="••••••••" value={drv.confirm}  onChange={e => setDrv({...drv, confirm: e.target.value})}  required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? 'Creating account...' : '✅ Register as Driver'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
