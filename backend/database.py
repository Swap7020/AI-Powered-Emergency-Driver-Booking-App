"""
Database configuration
- Development: SQLite (./driver_app.db)
- Production:  PostgreSQL (set DATABASE_URL env var on Render)
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Render sets DATABASE_URL automatically for PostgreSQL
# Locally falls back to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./driver_app.db")

# Render PostgreSQL URLs start with postgres:// — SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs check_same_thread=False; PostgreSQL does not
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from backend.models import User, Customer, Driver, Booking  # noqa
    Base.metadata.create_all(bind=engine)
    _seed_drivers()


def _seed_drivers():
    import bcrypt
    from backend.models import Driver, User

    db = SessionLocal()
    try:
        existing = db.query(Driver).count()
        if existing > 0:
            db.query(Driver).update({"availability": True})
            db.commit()
            return

        sample = [
            {"name": "Ravi Kumar",   "phone": "9000000001", "lat": 12.9716, "lng": 77.5946, "rating": 4.8, "exp": 5, "lic": "KA01-2019-1234567"},
            {"name": "Suresh Babu",  "phone": "9000000002", "lat": 12.9780, "lng": 77.6010, "rating": 4.5, "exp": 3, "lic": "KA02-2020-2345678"},
            {"name": "Amit Singh",   "phone": "9000000003", "lat": 12.9650, "lng": 77.5900, "rating": 4.2, "exp": 2, "lic": "KA03-2021-3456789"},
            {"name": "Priya Sharma", "phone": "9000000004", "lat": 12.9820, "lng": 77.5870, "rating": 4.9, "exp": 7, "lic": "KA04-2017-4567890"},
            {"name": "Kiran Rao",    "phone": "9000000005", "lat": 12.9600, "lng": 77.6100, "rating": 4.0, "exp": 1, "lic": "KA05-2022-5678901"},
        ]
        hashed_pw = bcrypt.hashpw(b"driver123", bcrypt.gensalt()).decode()

        for d in sample:
            user = User(name=d["name"], phone=d["phone"],
                        hashed_password=hashed_pw, role="driver")
            db.add(user)
            db.flush()
            driver = Driver(
                user_id=user.id, name=d["name"], phone=d["phone"],
                license_number=d["lic"], license_expiry="31/12/2030",
                experience_years=d["exp"],
                latitude=d["lat"], longitude=d["lng"],
                availability=True, rating=d["rating"],
            )
            db.add(driver)

        db.commit()
        print("✅ Seeded 5 sample drivers")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()
