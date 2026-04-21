"""
Real-Time Tracking — WebSocket + REST endpoints

WebSocket: /ws/tracking/{booking_id}
  - Driver sends: {"type":"location","lat":12.97,"lng":77.59,"heading":45,"speed":30}
  - Driver sends: {"type":"status","status":"arrived"}
  - Server broadcasts to all subscribers of that booking_id

REST:
  GET  /tracking/{booking_id}        — latest driver location + ETA
  POST /tracking/{booking_id}/location — driver updates location (REST fallback)
"""
import json
import math
from datetime import datetime
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Booking, Driver
from backend.auth import get_current_user
from backend.models import User

router = APIRouter(tags=["Tracking"])

# ── In-memory store (replace with Redis in production) ────────────────────────
# { booking_id: { lat, lng, heading, speed, updated_at, status } }
_driver_locations: Dict[str, dict] = {}

# { booking_id: [WebSocket, ...] }
_connections: Dict[str, List[WebSocket]] = {}


# ── Haversine ─────────────────────────────────────────────────────────────────
def haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def calc_eta(dist_km: float, speed_kmh: float = 30.0) -> int:
    """Return ETA in minutes."""
    if speed_kmh <= 0:
        speed_kmh = 30.0
    return max(1, round((dist_km / speed_kmh) * 60))


# ── WebSocket connection manager ──────────────────────────────────────────────
class ConnectionManager:
    async def connect(self, booking_id: str, ws: WebSocket):
        await ws.accept()
        _connections.setdefault(booking_id, []).append(ws)
        # Send current location immediately on connect
        if booking_id in _driver_locations:
            await ws.send_json({"type": "location", **_driver_locations[booking_id]})

    def disconnect(self, booking_id: str, ws: WebSocket):
        if booking_id in _connections:
            _connections[booking_id] = [w for w in _connections[booking_id] if w != ws]

    async def broadcast(self, booking_id: str, data: dict):
        dead = []
        for ws in _connections.get(booking_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(booking_id, ws)


manager = ConnectionManager()


# ── WebSocket endpoint ────────────────────────────────────────────────────────
@router.websocket("/ws/tracking/{booking_id}")
async def tracking_ws(booking_id: str, websocket: WebSocket):
    """
    Bidirectional WebSocket for live tracking.
    Both driver and customer connect here.
    Driver sends location/status updates → server broadcasts to all.
    """
    await manager.connect(booking_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                continue

            msg_type = msg.get("type")

            if msg_type == "location":
                # Store latest location
                _driver_locations[booking_id] = {
                    "lat":        msg.get("lat"),
                    "lng":        msg.get("lng"),
                    "heading":    msg.get("heading", 0),
                    "speed":      msg.get("speed", 0),
                    "updated_at": datetime.utcnow().isoformat(),
                }
                # Broadcast to all subscribers
                await manager.broadcast(booking_id, {
                    "type":       "location",
                    **_driver_locations[booking_id],
                })

            elif msg_type == "status":
                # Driver sends status update
                status_update = {
                    "type":       "status",
                    "status":     msg.get("status"),
                    "timestamp":  datetime.utcnow().isoformat(),
                    "message":    msg.get("message", ""),
                }
                await manager.broadcast(booking_id, status_update)

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(booking_id, websocket)


# ── REST: get current tracking state ─────────────────────────────────────────
@router.get("/tracking/{booking_id}")
def get_tracking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")

    driver = None
    if booking.driver_id:
        driver = db.query(Driver).filter(Driver.id == booking.driver_id).first()

    loc = _driver_locations.get(booking_id)

    # ETA calculation
    eta_to_pickup = None
    eta_to_dropoff = None

    if loc and driver:
        if booking.pickup_lat and booking.status in ("confirmed", "driver_assigned"):
            dist = haversine(loc["lat"], loc["lng"], booking.pickup_lat, booking.pickup_lng)
            eta_to_pickup = calc_eta(dist, loc.get("speed", 30))

        if booking.dropoff_lat and booking.status == "in_progress":
            dist = haversine(loc["lat"], loc["lng"], booking.dropoff_lat, booking.dropoff_lng)
            eta_to_dropoff = calc_eta(dist, loc.get("speed", 30))

    return {
        "booking_id":    booking_id,
        "status":        booking.status,
        "emergency":     booking.emergency,
        "driver": {
            "id":       driver.id if driver else None,
            "name":     driver.name if driver else None,
            "phone":    driver.phone if driver else None,
            "rating":   driver.rating if driver else None,
            "license":  driver.license_number if driver else None,
        } if driver else None,
        "location":      loc,
        "eta_to_pickup_min":   eta_to_pickup,
        "eta_to_dropoff_min":  eta_to_dropoff,
        "pickup_lat":    booking.pickup_lat,
        "pickup_lng":    booking.pickup_lng,
        "dropoff_lat":   booking.dropoff_lat,
        "dropoff_lng":   booking.dropoff_lng,
        "pickup_addr":   booking.pickup_addr,
        "dropoff_addr":  booking.dropoff_addr,
        "ride_started_at": booking.ride_started_at,
        "completed_at":  booking.completed_at,
    }


# ── REST: driver pushes location (fallback for non-WS clients) ───────────────
class LocationUpdate(BaseModel):
    lat:     float
    lng:     float
    heading: float = 0
    speed:   float = 30


@router.post("/tracking/{booking_id}/location")
async def push_location(
    booking_id: str,
    data: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")

    loc = {
        "lat":        data.lat,
        "lng":        data.lng,
        "heading":    data.heading,
        "speed":      data.speed,
        "updated_at": datetime.utcnow().isoformat(),
    }
    _driver_locations[booking_id] = loc

    # Also update driver's current location in DB
    if booking.driver_id:
        driver = db.query(Driver).filter(Driver.id == booking.driver_id).first()
        if driver:
            driver.latitude  = data.lat
            driver.longitude = data.lng
            db.commit()

    # Broadcast via WebSocket
    await manager.broadcast(booking_id, {"type": "location", **loc})
    return {"status": "ok", "location": loc}
