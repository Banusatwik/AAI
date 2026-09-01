import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(50), default="OPERATOR") # OPERATOR, SAFETY_ENGINEER, ADMIN, AUDITOR
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
