from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Customer Registration ─────────────────────────────────────────────────────

class CustomerRegister(BaseModel):
    name:       str
    phone:      str
    email:      Optional[str] = None
    password:   str
    address:    Optional[str] = None
    city:       Optional[str] = None
    id_type:    str = "aadhaar"   # aadhaar | pan
    id_number:  str               # Aadhaar or PAN number
    latitude:   Optional[float] = None
    longitude:  Optional[float] = None


# ── Driver Registration ───────────────────────────────────────────────────────

class DriverRegister(BaseModel):
    name:             str
    phone:            str
    email:            Optional[str] = None
    password:         str
    address:          Optional[str] = None
    city:             Optional[str] = None
    license_number:   str
    license_expiry:   str           # DD/MM/YYYY
    experience_years: int = 0
    latitude:         float
    longitude:        float


# ── Login ─────────────────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    phone:    str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      str
    name:         str
    role:         str


# ── Driver Out ────────────────────────────────────────────────────────────────

class DriverOut(BaseModel):
    id:               str
    name:             str
    phone:            str
    license_number:   Optional[str]
    experience_years: int
    latitude:         Optional[float]
    longitude:        Optional[float]
    availability:     bool
    rating:           float
    total_rides:      int

    class Config:
        from_attributes = True


class DriverStatusUpdate(BaseModel):
    availability: bool


# ── Booking ───────────────────────────────────────────────────────────────────

class Stop(BaseModel):
    addr: str
    lat:  Optional[float] = None
    lng:  Optional[float] = None


class BookingCreate(BaseModel):
    pickup_lat:      float
    pickup_lng:      float
    pickup_addr:     Optional[str] = None
    dropoff_lat:     Optional[float] = None
    dropoff_lng:     Optional[float] = None
    dropoff_addr:    Optional[str] = None
    stops:           Optional[List[Stop]] = None   # intermediate stops
    estimated_hours: float = 1.0
    emergency:       bool = False


class CompleteRide(BaseModel):
    actual_hours: float   # driver inputs actual hours driven


class BookingOut(BaseModel):
    id:              str
    user_id:         str
    driver_id:       Optional[str]
    pickup_lat:      float
    pickup_lng:      float
    pickup_addr:     Optional[str]
    dropoff_lat:     Optional[float]
    dropoff_lng:     Optional[float]
    dropoff_addr:    Optional[str]
    stops:           Optional[str]   # raw JSON string
    estimated_hours: float
    actual_hours:    Optional[float]
    base_charge:         float
    time_charge:         float
    emergency_surcharge: float
    night_surcharge:     float
    total_fare:          float
    is_final_fare:       bool
    status:          str
    emergency:       bool
    timestamp:       datetime
    ride_started_at: Optional[datetime]
    completed_at:    Optional[datetime]
    driver:          Optional[DriverOut] = None

    class Config:
        from_attributes = True
