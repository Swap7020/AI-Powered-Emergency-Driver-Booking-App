"""
User routes: separate customer and driver registration + login.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Customer, Driver
from backend.schemas import CustomerRegister, DriverRegister, UserLogin, TokenResponse
from backend.auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter(tags=["Auth"])


@router.post("/register/customer", response_model=TokenResponse,
             summary="Register as Customer (requires Aadhaar/PAN)")
def register_customer(data: CustomerRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.phone == data.phone).first():
        raise HTTPException(400, "Phone already registered")

    # Validate ID
    id_type = data.id_type.lower()
    if id_type not in ("aadhaar", "pan"):
        raise HTTPException(400, "id_type must be 'aadhaar' or 'pan'")
    if id_type == "aadhaar" and len(data.id_number.replace(" ", "")) != 12:
        raise HTTPException(400, "Aadhaar must be 12 digits")
    if id_type == "pan" and len(data.id_number) != 10:
        raise HTTPException(400, "PAN must be 10 characters")

    user = User(name=data.name, phone=data.phone, email=data.email,
                hashed_password=hash_password(data.password), role="customer")
    db.add(user)
    db.flush()

    customer = Customer(
        user_id=user.id, name=data.name, phone=data.phone, email=data.email,
        address=data.address, city=data.city,
        id_type=id_type, id_number=data.id_number,
        latitude=data.latitude, longitude=data.longitude,
    )
    db.add(customer)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=create_token(user.id, user.role),
                         user_id=user.id, name=user.name, role=user.role)


@router.post("/register/driver", response_model=TokenResponse,
             summary="Register as Driver (requires Driving License)")
def register_driver(data: DriverRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.phone == data.phone).first():
        raise HTTPException(400, "Phone already registered")

    user = User(name=data.name, phone=data.phone, email=data.email,
                hashed_password=hash_password(data.password), role="driver")
    db.add(user)
    db.flush()

    driver = Driver(
        user_id=user.id, name=data.name, phone=data.phone, email=data.email,
        address=data.address, city=data.city,
        license_number=data.license_number, license_expiry=data.license_expiry,
        experience_years=data.experience_years,
        latitude=data.latitude, longitude=data.longitude,
        availability=True,
    )
    db.add(driver)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=create_token(user.id, user.role),
                         user_id=user.id, name=user.name, role=user.role)


@router.post("/login", response_model=TokenResponse, summary="Login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid phone or password")
    return TokenResponse(access_token=create_token(user.id, user.role),
                         user_id=user.id, name=user.name, role=user.role)


@router.get("/me", summary="Get current user profile")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = {}
    if current_user.role == "customer":
        c = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if c:
            profile = {"id_type": c.id_type, "city": c.city, "address": c.address}
    elif current_user.role == "driver":
        d = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if d:
            profile = {"license_number": d.license_number,
                       "experience_years": d.experience_years,
                       "availability": d.availability, "rating": d.rating}
    return {"id": current_user.id, "name": current_user.name,
            "phone": current_user.phone, "role": current_user.role, **profile}
