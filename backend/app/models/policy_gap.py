import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from backend.app.core.database import Base

class PolicyGap(Base):
    __tablename__ = "policy_gaps"

    id = Column(Integer, primary_key=True, index=True)
    parameter = Column(String(100), index=True, nullable=False) # e.g. shaft_misalignment
    equipment_type = Column(String(100), index=True, nullable=True) # e.g. Centrifugal Pump
    equipment_code = Column(String(50), index=True, nullable=True) # e.g. P-101
    operation = Column(String(100), nullable=True)
    occurrence_count = Column(Integer, default=1)
    status = Column(String(50), default="OPEN", index=True) # OPEN, UNDER_REVIEW, RESOLVED
    owner = Column(String(100), default="Mechanical Safety Team")
    resolution_notes = Column(Text, nullable=True)
    first_detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_detected_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
