"""
FastAPI application entry point.
Run with: uvicorn backend.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.routes import user, driver, booking, tracking

app = FastAPI(
    title="AI Emergency Driver Booking API",
    description="Driver-as-a-Service platform with AI-based matching",
    version="1.0.0",
)

# Allow Streamlit frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(user.router)
app.include_router(driver.router)
app.include_router(booking.router)
app.include_router(tracking.router)


@app.on_event("startup")
def startup():
    """Initialize DB tables and seed sample data on first run."""
    init_db()
    print("✅ Database ready")


@app.get("/", tags=["Health"])
def root():
    return {"status": "running", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
