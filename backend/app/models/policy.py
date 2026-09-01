import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. MECH-PUMP-001
    name = Column(String(150), nullable=False) # e.g. Centrifugal Pump Operational Safety Policy
    equipment_type = Column(String(100), index=True, nullable=False) # e.g. Centrifugal Pump
    owner = Column(String(100), default="Mechanical Safety Team")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    versions = relationship("PolicyVersion", back_populates="policy", cascade="all, delete-orphan")

class PolicyVersion(Base):
    __tablename__ = "policy_versions"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False)
    version = Column(String(20), nullable=False) # e.g. 1.0, 2.0
    is_active = Column(Boolean, default=True, index=True)
    effective_date = Column(DateTime, nullable=False)
    expiration_date = Column(DateTime, nullable=True)
    change_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    policy = relationship("Policy", back_populates="versions")
    clauses = relationship("PolicyClause", back_populates="policy_version", cascade="all, delete-orphan")
    thresholds = relationship("PolicyThreshold", back_populates="policy_version", cascade="all, delete-orphan")
    rules = relationship("RiskScoringRule", back_populates="policy_version", cascade="all, delete-orphan")

class PolicyClause(Base):
    __tablename__ = "policy_clauses"

    id = Column(Integer, primary_key=True, index=True)
    policy_version_id = Column(Integer, ForeignKey("policy_versions.id", ondelete="CASCADE"), nullable=False)
    clause_number = Column(String(50), nullable=False) # e.g. 4.2.1
    title = Column(String(150), nullable=False) # e.g. Maximum Allowable Vibration Limit
    text_content = Column(Text, nullable=False)
    is_mandatory = Column(Boolean, default=True) # If true, violation is strict DENIED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    policy_version = relationship("PolicyVersion", back_populates="clauses")

class PolicyThreshold(Base):
    __tablename__ = "policy_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    policy_version_id = Column(Integer, ForeignKey("policy_versions.id", ondelete="CASCADE"), nullable=False)
    parameter = Column(String(100), index=True, nullable=False) # e.g. vibration, rpm, pressure, bearing_temperature, flow_rate
    unit = Column(String(50), nullable=False) # e.g. mm/s, RPM, bar, °C, m³/h
    min_val = Column(Float, nullable=True) # Absolute lower policy limit
    max_val = Column(Float, nullable=True) # Absolute upper policy limit (Hard limit)
    normal_min = Column(Float, nullable=True)
    normal_max = Column(Float, nullable=True)
    warning_val = Column(Float, nullable=True)
    critical_val = Column(Float, nullable=True)
    is_mandatory = Column(Boolean, default=True)
    clause_reference = Column(String(50), nullable=True) # e.g. 4.2.1
    description = Column(String(255), nullable=True)

    policy_version = relationship("PolicyVersion", back_populates="thresholds")
