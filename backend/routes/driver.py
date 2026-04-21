from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Driver, User
from backend.schemas import DriverOut, DriverStatusUpdate
from backend.auth import get_current_user

router = APIRouter(prefix="/driver", tags=["Drivers"])


@router.get("/drivers", response_model=List[DriverOut], summary="Available drivers")
def list_drivers(db: Session = Depends(get_db)):
    return db.query(Driver).filter(Driver.availability == True).all()


@router.get("/all", response_model=List[DriverOut], summary="All drivers")
def list_all(db: Session = Depends(get_db)):
    return db.query(Driver).all()


@router.put("/status", summary="Toggle availability")
def update_status(data: DriverStatusUpdate,
                  current_user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(404, "Driver profile not found")
    driver.availability = data.availability
    db.commit()
    return {"availability": driver.availability}


@router.post("/reset-availability", summary="Reset all drivers to available (dev/testing)")
def reset_all_available(db: Session = Depends(get_db)):
    """Resets all drivers to available — useful for testing."""
    count = db.query(Driver).update({"availability": True})
    db.commit()
    return {"message": f"Reset {count} drivers to available"}


@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(driver_id: str, db: Session = Depends(get_db)):
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(404, "Driver not found")
    return d
