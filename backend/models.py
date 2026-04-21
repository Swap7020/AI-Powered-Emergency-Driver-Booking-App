"""
SQLAlchemy ORM models — User, Customer, Driver, Booking
"""
import json
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, DateTime, ForeignKey, Integer, Text
from backend.database import Base


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id              = Column(String, primary_key=True, default=gen_id)
    name            = Column(String(100), nullable=False)
    phone           = Column(String(20),  unique=True, nullable=False, index=True)
    email           = Column(String(200), nullable=True)
    hashed_password = Column(String,      nullable=False)
    role            = Column(String(20),  default="customer")  # customer | driver | admin
    is_verified     = Column(Boolean,     default=False)
    created_at      = Column(DateTime,    default=datetime.utcnow)


class Customer(Base):
    """Extended profile for customers — stores Aadhaar/PAN verification."""
    __tablename__ = "customers"

    id              = Column(String, primary_key=True, default=gen_id)
    user_id         = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    name            = Column(String(100), nullable=False)
    phone           = Column(String(20),  nullable=False)
    email           = Column(String(200), nullable=True)
    address         = Column(String(500), nullable=True)
    city            = Column(String(100), nullable=True)
    # Verification
    id_type         = Column(String(20),  nullable=True)   # aadhaar | pan
    id_number       = Column(String(50),  nullable=True)
    id_verified     = Column(Boolean,     default=False)
    # Location
    latitude        = Column(Float,       nullable=True)
    longitude       = Column(Float,       nullable=True)
    created_at      = Column(DateTime,    default=datetime.utcnow)


class Driver(Base):
    """Extended profile for drivers — stores license and vehicle info."""
    __tablename__ = "drivers"

    id              = Column(String, primary_key=True, default=gen_id)
    user_id         = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    name            = Column(String(100), nullable=False)
    phone           = Column(String(20),  unique=True, nullable=False)
    email           = Column(String(200), nullable=True)
    address         = Column(String(500), nullable=True)
    city            = Column(String(100), nullable=True)
    # License verification
    license_number  = Column(String(50),  nullable=True)
    license_expiry  = Column(String(20),  nullable=True)   # DD/MM/YYYY
    license_verified = Column(Boolean,    default=False)
    experience_years = Column(Integer,    default=0)
    # Location & status
    latitude        = Column(Float,       nullable=True)
    longitude       = Column(Float,       nullable=True)
    availability    = Column(Boolean,     default=True)
    rating          = Column(Float,       default=5.0)
    total_rides     = Column(Integer,     default=0)
    created_at      = Column(DateTime,    default=datetime.utcnow)


class Booking(Base):
    __tablename__ = "bookings"

    id              = Column(String, primary_key=True, default=gen_id)
    user_id         = Column(String, ForeignKey("users.id"),    nullable=False, index=True)
    driver_id       = Column(String, ForeignKey("drivers.id"),  nullable=True)
    # Pickup
    pickup_lat      = Column(Float,       nullable=False)
    pickup_lng      = Column(Float,       nullable=False)
    pickup_addr     = Column(String(300), nullable=True)
    # Dropoff
    dropoff_lat     = Column(Float,       nullable=True)
    dropoff_lng     = Column(Float,       nullable=True)
    dropoff_addr    = Column(String(300), nullable=True)
    # Multi-stop: JSON array of {"addr","lat","lng"} objects
    stops           = Column(Text,        nullable=True)   # JSON string
    # Trip
    distance_km     = Column(Float,       default=0.0)
    estimated_hours = Column(Float,       default=1.0)   # customer's estimate at booking
    actual_hours    = Column(Float,       nullable=True)  # driver's input at trip end
    # Fare breakdown
    base_charge          = Column(Float,  default=0.0)
    time_charge          = Column(Float,  default=0.0)
    emergency_surcharge  = Column(Float,  default=0.0)
    night_surcharge      = Column(Float,  default=0.0)
    total_fare           = Column(Float,  default=0.0)
    is_final_fare        = Column(Boolean, default=False)  # False=estimate, True=final
    # Status
    status          = Column(String(30),  default="confirmed")
    emergency       = Column(Boolean,     default=False)
    timestamp       = Column(DateTime,    default=datetime.utcnow, index=True)
    ride_started_at = Column(DateTime,    nullable=True)
    completed_at    = Column(DateTime,    nullable=True)
