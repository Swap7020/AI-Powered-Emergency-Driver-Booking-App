import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Car, LayoutDashboard, Clock, LogOut, Menu, X, Moon, Sun, MapPin } from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { dark, toggle } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }
  const isActive = (path) => location.pathname === path

  const navLink = (to, label, Icon) => (
    <Link to={to} onClick={() => setOpen(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive(to)
          ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
          : 'text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}>
      <Icon size={16} />{label}
    </Link>
  )

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-brand-700 dark:text-brand-400 text-lg">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Car size={18} className="text-white" />
          </div>
          MyDriver
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              {user.role === 'customer' && <>
                {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
                {navLink('/book',      'Book Driver', Car)}
                {navLink('/history',   'History', Clock)}
              </>}
              {user.role === 'driver' && navLink('/driver', 'Driver Panel', LayoutDashboard)}

              <div className="ml-3 pl-3 border-l border-slate-200 dark:border-slate-600 flex items-center gap-2">
                {/* Dark mode toggle */}
                <button onClick={toggle}
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title={dark ? 'Light mode' : 'Dark mode'}>
                  {dark ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors">
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={toggle}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mr-1">
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <Link to="/login"    className="btn-ghost text-sm">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={toggle} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 space-y-1 animate-fade-in">
          {user ? (
            <>
              {user.role === 'customer' && <>
                {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
                {navLink('/book',      'Book Driver', Car)}
                {navLink('/history',   'History', Clock)}
              </>}
              {user.role === 'driver' && navLink('/driver', 'Driver Panel', LayoutDashboard)}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-brand-600 font-semibold hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
