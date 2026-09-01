import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. P-101
    name = Column(String(100), nullable=False) # e.g. Primary Feed Centrifugal Pump
    equipment_type = Column(String(100), index=True, nullable=False) # e.g. Centrifugal Pump, Reciprocating Compressor, Gas Turbine
    model_number = Column(String(100), nullable=True)
    location = Column(String(100), nullable=True) # e.g. Plant Section 4 - Hydrocracker
    power_kw = Column(Float, nullable=True)
    rated_speed_rpm = Column(Float, nullable=True)
    status = Column(String(50), default="OPERATIONAL") # OPERATIONAL, MAINTENANCE, STANDBY, DECOMMISSIONED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    measurements = relationship("HistoricalMeasurement", back_populates="equipment", cascade="all, delete-orphan")
    evaluations = relationship("EvaluationResult", back_populates="equipment")
