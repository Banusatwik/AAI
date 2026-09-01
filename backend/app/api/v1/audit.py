from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models.audit import AuditLog
from backend.app.models.risk_rule import RiskScoringRule
from backend.app.schemas.audit import AuditLogResponse
from backend.app.schemas.policy import RiskRuleResponse, RiskRuleBase

router = APIRouter(prefix="", tags=["Audit & Rules"])

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 100,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type.upper())
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

@router.get("/rules", response_model=List[RiskRuleResponse])
def list_risk_rules(db: Session = Depends(get_db)):
    return db.query(RiskScoringRule).order_by(RiskScoringRule.category, RiskScoringRule.score_points.desc()).all()

@router.post("/rules", response_model=RiskRuleResponse)
def create_risk_rule(payload: RiskRuleBase, db: Session = Depends(get_db)):
    rule = RiskScoringRule(
        rule_code=payload.rule_code.upper(),
        parameter=payload.parameter.lower(),
        condition=payload.condition,
        threshold_value=payload.threshold_value,
        score_points=payload.score_points,
        category=payload.category,
        description=payload.description,
        is_active=payload.is_active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/rules/{rule_id}", response_model=RiskRuleResponse)
def update_risk_rule(rule_id: int, payload: RiskRuleBase, db: Session = Depends(get_db)):
    rule = db.query(RiskScoringRule).filter(RiskScoringRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.condition = payload.condition
    rule.threshold_value = payload.threshold_value
    rule.score_points = payload.score_points
    rule.description = payload.description
    rule.category = payload.category
    rule.is_active = payload.is_active

    db.commit()
    db.refresh(rule)
    return rule
