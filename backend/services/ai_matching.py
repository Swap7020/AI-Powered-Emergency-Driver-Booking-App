"""
AI Driver Matching Service
- Fetches all available drivers
- Calculates distance using Haversine formula
- Emergency: ranks by (distance * 0.6) + (5 - rating) * 0.4
- Normal:    ranks purely by distance
- Always returns the nearest available driver — no radius cutoff
"""
import math
from typing import Optional
from sqlalchemy.orm import Session
from backend.models import Driver


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi    = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = (math.sin(dphi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def match_driver(
    db: Session,
    user_lat: float,
    user_lng: float,
    emergency: bool = False,
) -> Optional[Driver]:
    """
    Always returns the best available driver regardless of distance.
    No radius cutoff — if a driver exists, they get assigned.
    """
    drivers = (
        db.query(Driver)
        .filter(
            Driver.availability == True,
            Driver.latitude.isnot(None),
            Driver.longitude.isnot(None),
        )
        .all()
    )

    if not drivers:
        # Last resort: try any driver even if marked unavailable
        drivers = (
            db.query(Driver)
            .filter(
                Driver.latitude.isnot(None),
                Driver.longitude.isnot(None),
            )
            .all()
        )

    if not drivers:
        return None

    # Calculate distance for every driver
    candidates = [(d, haversine(user_lat, user_lng, d.latitude, d.longitude))
                  for d in drivers]

    if emergency:
        # Emergency: nearest + best rated (60/40 weight)
        max_dist = max(dist for _, dist in candidates) or 1.0
        candidates.sort(key=lambda x: (
            0.6 * (x[1] / max_dist) + 0.4 * ((5.0 - x[0].rating) / 5.0)
        ))
    else:
        # Normal: purely by distance
        candidates.sort(key=lambda x: x[1])

    best_driver, best_dist = candidates[0]
    print(f"🤖 AI Match: {best_driver.name} | dist={best_dist:.2f}km | "
          f"rating={best_driver.rating} | emergency={emergency}")
    return best_driver


def get_all_available_with_distance(db: Session, user_lat: float, user_lng: float) -> list:
    drivers = (
        db.query(Driver)
        .filter(Driver.availability == True,
                Driver.latitude.isnot(None),
                Driver.longitude.isnot(None))
        .all()
    )
    result = [{"driver": d, "distance_km": round(haversine(user_lat, user_lng, d.latitude, d.longitude), 2)}
              for d in drivers]
    result.sort(key=lambda x: x["distance_km"])
    return result
