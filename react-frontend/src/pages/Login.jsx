import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'

export default function Login() {
  const [form, setForm] = useState({ phone: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.access_token, { id: data.user_id, name: data.name, role: data.role })
      toast.success(`Welcome back, ${data.name}!`)
      navigate(data.role === 'driver' ? '/driver' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Car size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Welcome back</h1>
          <p className="text-slate-500 mt-1">Sign in to your MyDriver account</p>
        </div>

        <div className="card shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-10" placeholder="9876543210"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-10 pr-10" type={showPw ? 'text' : 'password'}
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
