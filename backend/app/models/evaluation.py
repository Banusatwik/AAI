import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class OperationRequest(Base):
    __tablename__ = "operation_requests"

    id = Column(Integer, primary_key=True, index=True)
    raw_prompt = Column(Text, nullable=True) # Natural language or formatted request
    equipment_code = Column(String(50), nullable=True)
    operation_type = Column(String(100), default="Run")
    structured_parameters = Column(JSON, nullable=False) # JSON dict of parsed params
    requested_by = Column(String(100), default="Operator")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    evaluations = relationship("EvaluationResult", back_populates="request", cascade="all, delete-orphan")

class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("operation_requests.id", ondelete="CASCADE"), nullable=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True)
    policy_version_id = Column(Integer, ForeignKey("policy_versions.id"), nullable=True)
    
    # Decisions: APPROVED, DENIED, POLICY GAP
    final_decision = Column(String(50), index=True, nullable=False)
    
    # Risk Classification
    risk_score = Column(Float, nullable=False) # 0 to 100
    risk_level = Column(String(50), nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    
    # Detailed Analytical Outputs (JSON)
    threshold_results = Column(JSON, nullable=True)
    statistical_metrics = Column(JSON, nullable=True)
    probability_metrics = Column(JSON, nullable=True)
    rule_contributions = Column(JSON, nullable=True)
    optimization_details = Column(JSON, nullable=True)
    policy_provenance = Column(JSON, nullable=True)
    
    # Natural Language / LLM Explanation
    llm_explanation = Column(Text, nullable=True)
    
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    # Relationships
    request = relationship("OperationRequest", back_populates="evaluations")
    equipment = relationship("Equipment", back_populates="evaluations")
