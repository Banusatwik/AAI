from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.policy_gap import PolicyGap
from backend.app.models.audit import AuditLog
from backend.app.schemas.gap import PolicyGapResponse, PolicyGapCreate, PolicyGapUpdate

router = APIRouter(prefix="/gaps", tags=["Policy Gaps"])

@router.get("", response_model=List[PolicyGapResponse])
def list_gaps(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PolicyGap)
    if status:
        query = query.filter(PolicyGap.status == status.upper())
    return query.order_by(PolicyGap.occurrence_count.desc(), PolicyGap.last_detected_at.desc()).all()

@router.post("", response_model=PolicyGapResponse)
def create_gap(payload: PolicyGapCreate, db: Session = Depends(get_db)):
    param_clean = payload.parameter.lower().strip()
    existing = db.query(PolicyGap).filter(
        PolicyGap.parameter == param_clean,
        (PolicyGap.equipment_type == payload.equipment_type) | (PolicyGap.equipment_code == payload.equipment_code)
    ).first()

    if existing:
        existing.occurrence_count += 1
        existing.last_detected_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    gap = PolicyGap(
        parameter=param_clean,
        equipment_type=payload.equipment_type,
        equipment_code=payload.equipment_code,
        operation=payload.operation or "Run",
        occurrence_count=1,
        status="OPEN",
        owner="Mechanical Safety Team"
    )
    db.add(gap)
    db.commit()
    db.refresh(gap)
    return gap

@router.put("/{gap_id}", response_model=PolicyGapResponse)
def update_gap(gap_id: int, payload: PolicyGapUpdate, db: Session = Depends(get_db)):
    gap = db.query(PolicyGap).filter(PolicyGap.id == gap_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Policy gap record not found")

    if payload.status:
        gap.status = payload.status.upper()
    if payload.owner:
        gap.owner = payload.owner
    if payload.resolution_notes:
        gap.resolution_notes = payload.resolution_notes

    db.add(AuditLog(
        event_type="GAP_UPDATED",
        entity_type="PolicyGap",
        entity_id=str(gap.id),
        actor="Safety Engineer",
        action_summary=f"Updated Policy Gap '{gap.parameter}' status to {gap.status}",
        payload_snapshot={"parameter": gap.parameter, "status": gap.status, "notes": gap.resolution_notes}
    ))

    db.commit()
    db.refresh(gap)
    return gap
