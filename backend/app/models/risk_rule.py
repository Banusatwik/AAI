import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class RiskScoringRule(Base):
    __tablename__ = "risk_scoring_rules"

    id = Column(Integer, primary_key=True, index=True)
    policy_version_id = Column(Integer, ForeignKey("policy_versions.id", ondelete="CASCADE"), nullable=True) # None = global rule
    rule_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. RULE-VIB-WARN
    parameter = Column(String(100), nullable=False) # e.g. vibration, bearing_temperature, pressure, failure_probability, z_score
    condition = Column(String(20), nullable=False) # e.g. 'gt', 'gte', 'lt', 'lte', 'zscore_gt', 'prob_gt', 'warning_threshold_exceeded', 'critical_threshold_exceeded'
    threshold_value = Column(Float, nullable=True) # e.g. 3.5, or dynamically derived
    score_points = Column(Float, nullable=False) # e.g. 20.0, 40.0, 50.0
    category = Column(String(50), default="OPERATIONAL") # VIBRATION, THERMAL, PRESSURE, PROBABILITY, STATISTICAL
    description = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    policy_version = relationship("PolicyVersion", back_populates="rules")
