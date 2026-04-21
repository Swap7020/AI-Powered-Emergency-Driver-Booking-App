"""
Fare Calculator — Driver-as-a-Service (Time-Based Model)

The car owner hires a driver. Fare is based on:
  1. Base charge       — flat booking fee
  2. Time charge       — per hour of actual driving (driver's input)
  3. Night surcharge   — 20% extra between 10 PM – 6 AM
  4. Emergency surcharge — flat extra for emergency bookings

Distance is NOT charged separately — the car owner bears fuel costs.
Driver inputs the actual hours driven at trip end → final fare calculated.
"""
from datetime import datetime

# ── Rate Card (INR) ───────────────────────────────────────────────────────────
BASE_CHARGE          = 50.0    # ₹ flat booking fee
RATE_PER_HOUR        = 100.0   # ₹ per hour of driving
STOP_CHARGE          = 20.0    # ₹ per intermediate stop
EMERGENCY_SURCHARGE  = 80.0    # ₹ flat for emergency bookings
NIGHT_SURCHARGE_PCT  = 0.20    # 20% extra between 10 PM – 6 AM
MIN_FARE             = 100.0   # ₹ minimum fare


def is_night_time(dt: datetime = None) -> bool:
    hour = (dt or datetime.utcnow()).hour
    return hour >= 22 or hour < 6


def calculate_fare(
    actual_hours: float,
    emergency: bool = False,
    booking_time: datetime = None,
    num_stops: int = 0,
) -> dict:
    base        = BASE_CHARGE
    time_charge = round(actual_hours * RATE_PER_HOUR, 2)
    stop_charge = round(num_stops * STOP_CHARGE, 2)
    subtotal    = base + time_charge + stop_charge

    emg_charge   = EMERGENCY_SURCHARGE if emergency else 0.0
    night        = is_night_time(booking_time)
    night_charge = round(subtotal * NIGHT_SURCHARGE_PCT, 2) if night else 0.0

    total = max(subtotal + emg_charge + night_charge, MIN_FARE)
    total = round(total, 2)

    return {
        "base_charge":         base,
        "actual_hours":        round(actual_hours, 2),
        "time_charge":         time_charge,
        "num_stops":           num_stops,
        "stop_charge":         stop_charge,
        "emergency_surcharge": emg_charge,
        "night_surcharge":     night_charge,
        "is_night":            night,
        "subtotal":            round(subtotal, 2),
        "total_fare":          total,
        "currency":            "INR",
        "rate_per_hour":       RATE_PER_HOUR,
        "stop_rate":           STOP_CHARGE,
        "note":                "Fare based on actual hours driven. Fuel & vehicle costs are owner's responsibility.",
    }


def estimate_fare(estimated_hours: float, emergency: bool = False, num_stops: int = 0) -> dict:
    result = calculate_fare(estimated_hours, emergency, num_stops=num_stops)
    result["is_estimate"] = True
    result["note"] = f"Estimated fare for {estimated_hours} hrs + {num_stops} stop(s). Final fare set by driver after trip."
    return result
