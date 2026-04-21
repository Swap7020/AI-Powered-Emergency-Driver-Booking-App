import axios from 'axios'

// In production (Vercel), set VITE_API_URL to your Render backend URL
// e.g. https://ai-driver-booking-api.onrender.com
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('driver-app-auth')
    const token = raw ? JSON.parse(raw)?.state?.token : null
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ''
      if (!url.includes('/login') && !url.includes('/register')) {
        localStorage.removeItem('driver-app-auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  registerCustomer: (d) => api.post('/register/customer', d),
  registerDriver:   (d) => api.post('/register/driver', d),
  login:            (d) => api.post('/login', d),
  me:               ()  => api.get('/me'),
}

export const driverAPI = {
  available:        ()  => api.get('/driver/drivers'),
  all:              ()  => api.get('/driver/all'),
  toggleStatus:     (d) => api.put('/driver/status', d),
}

export const bookingAPI = {
  estimate:         (d) => api.post('/estimate-fare', d),
  create:           (d) => api.post('/book-driver', d),
  get:              (id) => api.get(`/booking/${id}`),
  myBookings:       ()  => api.get('/user/bookings'),
  start:            (id) => api.patch(`/booking/${id}/start`),
  complete:         (id, d) => api.patch(`/booking/${id}/complete`, d),
}

export const trackingAPI = {
  get:          (id) => api.get(`/tracking/${id}`),
  pushLocation: (id, d) => api.post(`/tracking/${id}/location`, d),
}

export default api
