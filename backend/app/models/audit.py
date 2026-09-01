import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from backend.app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), index=True, nullable=False) # EVALUATION, POLICY_CREATED, POLICY_UPDATED, VERSION_ACTIVATED, GAP_CREATED, GAP_RESOLVED
    entity_type = Column(String(50), nullable=True) # Evaluation, Policy, Gap, Equipment
    entity_id = Column(String(50), nullable=True)
    actor = Column(String(100), default="System")
    action_summary = Column(String(255), nullable=False)
    payload_snapshot = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
