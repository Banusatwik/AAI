import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class HistoricalMeasurement(Base):
    __tablename__ = "historical_measurements"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    # Mechanical Parameters
    rpm = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True) # bar
    temperature = Column(Float, nullable=True) # °C
    vibration = Column(Float, nullable=True) # mm/s
    flow_rate = Column(Float, nullable=True) # m³/h
    power_kw = Column(Float, nullable=True) # kW
    efficiency_pct = Column(Float, nullable=True) # %
    bearing_temperature = Column(Float, nullable=True) # °C
    lubrication_pressure = Column(Float, nullable=True) # bar
    
    # Operational & Failure outcome annotations
    is_anomaly = Column(Boolean, default=False)
    failure_occurred = Column(Boolean, default=False, index=True)
    failure_mode = Column(String(100), nullable=True) # e.g. "Bearing Seizure", "Vibration Trip", "Cavitation Breakdown", "Overheating"
    notes = Column(String(255), nullable=True)

    equipment = relationship("Equipment", back_populates="measurements")

    __table_args__ = (
        Index('ix_equip_time', 'equipment_id', 'timestamp'),
    )
