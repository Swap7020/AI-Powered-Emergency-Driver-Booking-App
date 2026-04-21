"""
Booking routes:
  POST /book-driver          — create booking with estimated fare
  POST /estimate-fare        — get fare estimate without booking
  PATCH /booking/{id}/start  — driver starts the ride
  PATCH /booking/{id}/complete — driver submits actual hours → final fare calculated
  GET  /booking/{id}         — get booking details
  GET  /user/bookings        — customer's booking history
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from backend.database import get_db
from backend.models import Booking, User, Driver
from backend.schemas import BookingCreate, BookingOut, CompleteRide
from backend.auth import get_current_user
from backend.services.ai_matching import match_driver
from backend.services.fare_calculator import calculate_fare, estimate_fare

router = APIRouter(tags=["Bookings"])


def _attach_driver(booking: Booking, db: Session):
    if booking.driver_id:
        booking.driver = db.query(Driver).filter(Driver.id == booking.driver_id).first()
    return booking


@router.post("/estimate-fare", summary="Estimate fare (no booking created)")
def get_fare_estimate(data: BookingCreate):
    num_stops = len(data.stops) if data.stops else 0
    return estimate_fare(data.estimated_hours, data.emergency, num_stops)


@router.post("/book-driver", response_model=BookingOut,
             summary="Book a driver — multi-stop supported")
def book_driver(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import json as _json
    best_driver = match_driver(db, data.pickup_lat, data.pickup_lng, data.emergency)
    if not best_driver:
        raise HTTPException(404, "No drivers registered in the system")

    num_stops = len(data.stops) if data.stops else 0
    fare = estimate_fare(data.estimated_hours, data.emergency, num_stops)

    # Serialize stops to JSON string for storage
    stops_json = _json.dumps([s.model_dump() for s in data.stops]) if data.stops else None

    booking = Booking(
        user_id=current_user.id,
        driver_id=best_driver.id,
        pickup_lat=data.pickup_lat,   pickup_lng=data.pickup_lng,
        pickup_addr=data.pickup_addr,
        dropoff_lat=data.dropoff_lat, dropoff_lng=data.dropoff_lng,
        dropoff_addr=data.dropoff_addr,
        stops=stops_json,
        estimated_hours=data.estimated_hours,
        base_charge=fare["base_charge"],
        time_charge=fare["time_charge"],
        emergency_surcharge=fare["emergency_surcharge"],
        night_surcharge=fare["night_surcharge"],
        total_fare=fare["total_fare"],
        is_final_fare=False,
        status="confirmed",
        emergency=data.emergency,
    )
    db.add(booking)
    best_driver.availability = False
    best_driver.total_rides += 1
    db.commit()
    db.refresh(booking)
    return _attach_driver(booking, db)


@router.patch("/booking/{booking_id}/start", summary="Driver starts the ride")
def start_ride(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    booking.status = "in_progress"
    booking.ride_started_at = datetime.utcnow()
    db.commit()
    return {"message": "Ride started", "started_at": booking.ride_started_at}


@router.patch("/booking/{booking_id}/complete", response_model=BookingOut,
              summary="Driver submits actual hours → final fare calculated")
def complete_ride(
    booking_id: str,
    data: CompleteRide,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import json as _json
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if data.actual_hours <= 0:
        raise HTTPException(400, "Actual hours must be greater than 0")

    num_stops = len(_json.loads(booking.stops)) if booking.stops else 0
    fare = calculate_fare(
        actual_hours=data.actual_hours,
        emergency=booking.emergency,
        booking_time=booking.timestamp,
        num_stops=num_stops,
    )

    booking.actual_hours    = data.actual_hours
    booking.base_charge     = fare["base_charge"]
    booking.time_charge     = fare["time_charge"]
    booking.emergency_surcharge = fare["emergency_surcharge"]
    booking.night_surcharge = fare["night_surcharge"]
    booking.total_fare      = fare["total_fare"]
    booking.is_final_fare   = True
    booking.status          = "completed"
    booking.completed_at    = datetime.utcnow()

    # Free up driver
    if booking.driver_id:
        driver = db.query(Driver).filter(Driver.id == booking.driver_id).first()
        if driver:
            driver.availability = True

    db.commit()
    db.refresh(booking)
    return _attach_driver(booking, db)


@router.get("/booking/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    return _attach_driver(booking, db)


@router.get("/user/bookings", response_model=List[BookingOut])
def get_user_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookings = (db.query(Booking)
                .filter(Booking.user_id == current_user.id)
                .order_by(Booking.timestamp.desc()).all())
    return [_attach_driver(b, db) for b in bookings]
