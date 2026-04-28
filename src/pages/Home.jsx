import { Link } from 'react-router-dom'
import { Car, Shield, Zap, Star, Clock, MapPin, ChevronRight } from 'lucide-react'
import useAuthStore from '../store/authStore'

const features = [
  { icon: Zap,     title: 'Instant Matching',    desc: 'AI finds the best driver near you in seconds.',       color: 'bg-amber-100 text-amber-600' },
  { icon: Shield,  title: 'Verified Drivers',    desc: 'All drivers are license-verified before onboarding.', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Car,     title: 'Your Car, Our Driver', desc: 'You own the car — we provide the professional driver.', color: 'bg-blue-100 text-blue-600' },
  { icon: Star,    title: 'Rated & Reviewed',    desc: 'Choose from top-rated experienced drivers.',           color: 'bg-purple-100 text-purple-600' },
  { icon: Clock,   title: 'Flexible Hire',       desc: 'Book by the hour — from 30 mins to 12 hours.',        color: 'bg-rose-100 text-rose-600' },
  { icon: MapPin,  title: 'Any Location',        desc: 'Available across the city, 24/7.',                    color: 'bg-teal-100 text-teal-600' },
]

export default function Home() {
  const user = useAuthStore(s => s.user)

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Driver-as-a-Service Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
            Your Car.<br />
            <span className="text-yellow-300">Our Driver.</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Hire a verified professional driver for your personal vehicle — for emergencies, late nights, or whenever you need one.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <Link to="/book" className="btn-emergency text-base px-8 py-3">
                  🚨 Emergency Booking
                </Link>
                <Link to="/book" className="btn bg-white text-brand-700 hover:bg-blue-50 text-base px-8 py-3">
                  Book a Driver <ChevronRight size={18} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn bg-yellow-400 hover:bg-yellow-300 text-brand-900 font-bold text-base px-8 py-3">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn bg-white/10 hover:bg-white/20 border border-white/30 text-white text-base px-8 py-3">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
          {[['500+', 'Verified Drivers'], ['10K+', 'Rides Completed'], ['4.8★', 'Average Rating']].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl font-black text-brand-700">{val}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-black text-center text-slate-800 mb-2">Why MyDriver?</h2>
        <p className="text-center text-slate-500 mb-10">Everything you need, nothing you don't.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card-hover group">
              <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={22} />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-gradient-to-r from-brand-600 to-brand-700 text-white py-14 px-4 text-center">
          <h2 className="text-3xl font-black mb-3">Ready to get started?</h2>
          <p className="text-blue-100 mb-7 max-w-md mx-auto">Join thousands of users who trust MyDriver for safe, reliable driver hire.</p>
          <Link to="/register" className="btn bg-white text-brand-700 hover:bg-blue-50 text-base px-10 py-3 font-bold">
            Create Free Account
          </Link>
        </section>
      )}
    </div>
  )
}
