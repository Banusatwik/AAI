from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.policy import Policy, PolicyVersion, PolicyClause, PolicyThreshold
from backend.app.models.risk_rule import RiskScoringRule
from backend.app.models.audit import AuditLog
from backend.app.schemas.policy import (
    PolicyResponse, PolicyDetailResponse, PolicyCreate, PolicyUpdate,
    PolicyVersionCreate, PolicyVersionResponse, PolicyThresholdBase
)

router = APIRouter(prefix="/policies", tags=["Policies"])

@router.get("", response_model=List[PolicyResponse])
def list_policies(db: Session = Depends(get_db)):
    policies = db.query(Policy).all()
    results = []
    for p in policies:
        active_ver = db.query(PolicyVersion).filter(
            PolicyVersion.policy_id == p.id,
            PolicyVersion.is_active == True
        ).first()
        v_count = db.query(PolicyVersion).filter(PolicyVersion.policy_id == p.id).count()
        results.append(PolicyResponse(
            id=p.id,
            code=p.code,
            name=p.name,
            equipment_type=p.equipment_type,
            owner=p.owner,
            description=p.description,
            created_at=p.created_at,
            updated_at=p.updated_at,
            active_version=active_ver.version if active_ver else None,
            version_count=v_count
        ))
    return results

@router.get("/{policy_id}", response_model=PolicyDetailResponse)
def get_policy_detail(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@router.post("", response_model=PolicyDetailResponse)
def create_policy(payload: PolicyCreate, db: Session = Depends(get_db)):
    existing = db.query(Policy).filter(Policy.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Policy code already exists")

    new_policy = Policy(
        code=payload.code.upper(),
        name=payload.name,
        equipment_type=payload.equipment_type,
        owner=payload.owner,
        description=payload.description
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)

    # Create Initial Version
    version_obj = PolicyVersion(
        policy_id=new_policy.id,
        version=payload.initial_version or "1.0",
        is_active=True,
        effective_date=payload.effective_date or datetime.utcnow(),
        change_summary="Initial policy formulation"
    )
    db.add(version_obj)
    db.commit()
    db.refresh(version_obj)

    # Add Clauses
    for c in payload.clauses:
        clause_obj = PolicyClause(
            policy_version_id=version_obj.id,
            clause_number=c.clause_number,
            title=c.title,
            text_content=c.text_content,
            is_mandatory=c.is_mandatory
        )
        db.add(clause_obj)

    # Add Thresholds
    for t in payload.thresholds:
        thresh_obj = PolicyThreshold(
            policy_version_id=version_obj.id,
            parameter=t.parameter.lower(),
            unit=t.unit,
            min_val=t.min_val,
            max_val=t.max_val,
            normal_min=t.normal_min,
            normal_max=t.normal_max,
            warning_val=t.warning_val,
            critical_val=t.critical_val,
            is_mandatory=t.is_mandatory,
            clause_reference=t.clause_reference,
            description=t.description
        )
        db.add(thresh_obj)

    # Add Rules
    for r in payload.rules:
        rule_obj = RiskScoringRule(
            policy_version_id=version_obj.id,
            rule_code=r.rule_code,
            parameter=r.parameter.lower(),
            condition=r.condition,
            threshold_value=r.threshold_value,
            score_points=r.score_points,
            category=r.category,
            description=r.description,
            is_active=r.is_active
        )
        db.add(rule_obj)

    # Audit Log
    db.add(AuditLog(
        event_type="POLICY_CREATED",
        entity_type="Policy",
        entity_id=str(new_policy.id),
        actor="Safety Engineer",
        action_summary=f"Created Policy {new_policy.code} v{version_obj.version}",
        payload_snapshot={"code": new_policy.code, "name": new_policy.name}
    ))

    db.commit()
    db.refresh(new_policy)
    return new_policy

@router.post("/{policy_id}/versions", response_model=PolicyVersionResponse)
def create_policy_version(
    policy_id: int,
    payload: PolicyVersionCreate,
    db: Session = Depends(get_db)
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    # If new version is marked active, deactivate others
    if payload.is_active:
        db.query(PolicyVersion).filter(PolicyVersion.policy_id == policy.id).update({"is_active": False})

    version_obj = PolicyVersion(
        policy_id=policy.id,
        version=payload.version,
        is_active=payload.is_active,
        effective_date=payload.effective_date,
        expiration_date=payload.expiration_date,
        change_summary=payload.change_summary
    )
    db.add(version_obj)
    db.commit()
    db.refresh(version_obj)

    for c in payload.clauses:
        db.add(PolicyClause(
            policy_version_id=version_obj.id,
            clause_number=c.clause_number,
            title=c.title,
            text_content=c.text_content,
            is_mandatory=c.is_mandatory
        ))

    for t in payload.thresholds:
        db.add(PolicyThreshold(
            policy_version_id=version_obj.id,
            parameter=t.parameter.lower(),
            unit=t.unit,
            min_val=t.min_val,
            max_val=t.max_val,
            normal_min=t.normal_min,
            normal_max=t.normal_max,
            warning_val=t.warning_val,
            critical_val=t.critical_val,
            is_mandatory=t.is_mandatory,
            clause_reference=t.clause_reference,
            description=t.description
        ))

    db.add(AuditLog(
        event_type="POLICY_VERSION_CREATED",
        entity_type="PolicyVersion",
        entity_id=str(version_obj.id),
        actor="Safety Engineer",
        action_summary=f"Created Version {payload.version} for Policy {policy.code}",
        payload_snapshot={"policy_code": policy.code, "version": payload.version}
    ))

    db.commit()
    db.refresh(version_obj)
    return version_obj

@router.put("/{policy_id}/versions/{version_id}/activate")
def activate_policy_version(
    policy_id: int,
    version_id: int,
    db: Session = Depends(get_db)
):
    """
    Activates a specific policy version and deactivates all other versions for this policy.
    Crucial for testing dynamic policy version changes without code restart.
    """
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    target_ver = db.query(PolicyVersion).filter(
        PolicyVersion.id == version_id,
        PolicyVersion.policy_id == policy_id
    ).first()
    if not target_ver:
        raise HTTPException(status_code=404, detail="Version not found")

    # Deactivate all versions for this policy
    db.query(PolicyVersion).filter(PolicyVersion.policy_id == policy.id).update({"is_active": False})
    target_ver.is_active = True

    db.add(AuditLog(
        event_type="VERSION_ACTIVATED",
        entity_type="PolicyVersion",
        entity_id=str(target_ver.id),
        actor="Safety Engineer",
        action_summary=f"Activated Version {target_ver.version} for Policy {policy.code}",
        payload_snapshot={"policy_code": policy.code, "active_version": target_ver.version}
    ))

    db.commit()
    return {"status": "success", "message": f"Policy {policy.code} version {target_ver.version} is now ACTIVE."}

@router.put("/thresholds/{threshold_id}")
def update_threshold(
    threshold_id: int,
    payload: PolicyThresholdBase,
    db: Session = Depends(get_db)
):
    """
    Edits a policy threshold directly.
    Demonstrates that limits are read dynamically from DB and not hardcoded.
    """
    thresh = db.query(PolicyThreshold).filter(PolicyThreshold.id == threshold_id).first()
    if not thresh:
        raise HTTPException(status_code=404, detail="Threshold not found")

    thresh.min_val = payload.min_val
    thresh.max_val = payload.max_val
    thresh.normal_min = payload.normal_min
    thresh.normal_max = payload.normal_max
    thresh.warning_val = payload.warning_val
    thresh.critical_val = payload.critical_val
    thresh.is_mandatory = payload.is_mandatory
    thresh.clause_reference = payload.clause_reference
    thresh.description = payload.description

    db.add(AuditLog(
        event_type="THRESHOLD_UPDATED",
        entity_type="PolicyThreshold",
        entity_id=str(thresh.id),
        actor="Safety Engineer",
        action_summary=f"Updated threshold for {thresh.parameter}: Max={thresh.max_val} {thresh.unit}",
        payload_snapshot={"parameter": thresh.parameter, "max_val": thresh.max_val, "unit": thresh.unit}
    ))

    db.commit()
    return {"status": "success", "message": "Threshold updated successfully."}
