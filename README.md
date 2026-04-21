# 🚗 AI-Based Emergency Driver Booking App
### Driver-as-a-Service Platform

> Hire a verified driver for **your own car** — for emergencies, late nights, or whenever you need one.

---

## 🧠 What Makes This Different

Unlike Uber/Ola (which provide vehicle + driver), this is a **Driver-as-a-Service (DaaS)** platform:
- You own the car → we provide the driver
- Fare is based on **driver's time only** (not distance)
- Fuel and vehicle costs remain with the car owner

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Driver Matching | Haversine-based geospatial algorithm — nearest + best-rated |
| 🚨 Emergency Mode | Weighted scoring: 60% distance + 40% rating |
| 💰 Dynamic Fare Engine | Base + hourly rate + stop charges + night/emergency surcharges |
| 🗺️ Multi-Stop Rides | Add intermediate stops (₹20/stop) |
| 📡 Live Tracking | WebSocket real-time location + ETA prediction |
| 🎤 Voice Booking | Web Speech API with NLP intent parsing |
| 🌙 Dark Mode | Persisted theme toggle |
| 🔄 One-Click Rebook | Pre-fill form from previous booking |
| 🪪 ID Verification | Aadhaar/PAN for customers, Driving License for drivers |
| 🔐 JWT Auth | Role-based access (customer / driver) |

---

## 🛠️ Tech Stack

**Backend**
- FastAPI (Python) — REST + WebSocket APIs
- SQLAlchemy ORM — SQLite (dev) / PostgreSQL (prod)
- JWT + bcrypt authentication
- Uvicorn ASGI server

**Frontend**
- React.js 18 + Vite
- Tailwind CSS
- Zustand (state management)
- React Router v6
- Axios

---

## 📁 Project Structure

```
driver_app/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # DB config + seeding
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # JWT + bcrypt
│   ├── routes/
│   │   ├── user.py          # Register, login
│   │   ├── driver.py        # Driver CRUD
│   │   ├── booking.py       # Booking lifecycle
│   │   └── tracking.py      # WebSocket + ETA
│   └── services/
│       ├── ai_matching.py   # Haversine matching algorithm
│       └── fare_calculator.py
├── react-frontend/
│   ├── src/
│   │   ├── pages/           # Home, Login, Register, Dashboard, etc.
│   │   ├── components/      # Navbar, FareCard, DriverCard, etc.
│   │   ├── services/api.js  # Axios API client
│   │   └── store/           # Zustand auth + theme stores
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── requirements.txt
└── .gitignore
```

---

## 🚀 Setup & Run

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ai-driver-booking-app.git
cd ai-driver-booking-app/driver_app
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd react-frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

### 4. Open in browser
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

## 🔑 Test Accounts (Auto-seeded)

| Name | Phone | Password | Role |
|---|---|---|---|
| Ravi Kumar | 9000000001 | driver123 | Driver |
| Suresh Babu | 9000000002 | driver123 | Driver |
| Priya Sharma | 9000000004 | driver123 | Driver |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register/customer` | Register with Aadhaar/PAN |
| POST | `/register/driver` | Register with Driving License |
| POST | `/login` | Get JWT token |
| GET | `/me` | Current user profile |

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/book-driver` | AI match + create booking |
| POST | `/estimate-fare` | Fare preview |
| GET | `/booking/{id}` | Booking details |
| GET | `/user/bookings` | Booking history |
| PATCH | `/booking/{id}/start` | Start ride |
| PATCH | `/booking/{id}/complete` | Complete + final fare |

### Tracking
| Method | Endpoint | Description |
|---|---|---|
| WS | `/ws/tracking/{id}` | Live location WebSocket |
| GET | `/tracking/{id}` | Current location + ETA |
| POST | `/tracking/{id}/location` | Push location (REST) |

---

## 💰 Fare Structure

| Component | Rate |
|---|---|
| Base charge | ₹50 flat |
| Time charge | ₹100 / hour |
| Stop charge | ₹20 / intermediate stop |
| Emergency surcharge | ₹80 flat |
| Night surcharge | +20% (10 PM – 6 AM) |
| Minimum fare | ₹100 |

---

## 🤖 AI Matching Algorithm

```
Normal mode:   Sort all available drivers by Haversine distance → assign nearest
Emergency mode: Score = 0.6 × (dist/max_dist) + 0.4 × ((5 - rating) / 5)
                Sort by score ascending → assign best match
Fallback:      If no available drivers, assign from all drivers regardless of status
```

---

## 🌐 Deployment

**Backend → Render / Railway**
```bash
# Set environment variable
DATABASE_URL=postgresql://user:pass@host/dbname
```

**Frontend → Vercel / Netlify**
```bash
cd react-frontend
npm run build
# Deploy the dist/ folder
```
frontend_link -- https://ai-powered-emergency-driver-booking.vercel.app/

---

## 📄 License

MIT License — free to use for educational and personal projects.

---

**Built for Final Year Project — AI-Based Emergency Driver Booking System**
