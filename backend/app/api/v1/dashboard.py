from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.equipment import Equipment
from backend.app.models.evaluation import EvaluationResult
from backend.app.models.policy_gap import PolicyGap
from backend.app.models.policy import Policy, PolicyVersion
from backend.app.models.measurement import HistoricalMeasurement
from backend.app.schemas.dashboard import (
    DashboardResponse, DashboardKPIs, RiskDistribution, DecisionDistribution, EquipmentHealthCard
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    evals = db.query(EvaluationResult).all()
    total_evals = len(evals)

    approved = sum(1 for e in evals if e.final_decision == "APPROVED")
    denied = sum(1 for e in evals if e.final_decision == "DENIED")
    gaps_count = db.query(PolicyGap).count()

    scores = [e.risk_score for e in evals if e.risk_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 24.5
    high_risk_ops = sum(1 for e in evals if e.risk_level in ["HIGH", "CRITICAL"])

    kpis = DashboardKPIs(
        total_evaluations=total_evals,
        approved_count=approved,
        denied_count=denied,
        policy_gaps_count=gaps_count,
        average_risk_score=avg_score,
        high_risk_operations_count=high_risk_ops
    )

    risk_dist = RiskDistribution(
        low=sum(1 for e in evals if e.risk_level == "LOW"),
        moderate=sum(1 for e in evals if e.risk_level == "MODERATE"),
        high=sum(1 for e in evals if e.risk_level == "HIGH"),
        critical=sum(1 for e in evals if e.risk_level == "CRITICAL")
    )

    decision_dist = DecisionDistribution(
        approved=approved,
        denied=denied,
        policy_gap=sum(1 for e in evals if e.final_decision == "POLICY GAP")
    )

    # Equipment Health Cards
    equipments = db.query(Equipment).all()
    health_cards = []

    for eq in equipments:
        # Latest evaluation
        latest_eval = db.query(EvaluationResult).filter(
            EvaluationResult.equipment_id == eq.id
        ).order_by(EvaluationResult.evaluated_at.desc()).first()

        # Latest measurement
        latest_meas = db.query(HistoricalMeasurement).filter(
            HistoricalMeasurement.equipment_id == eq.id
        ).order_by(HistoricalMeasurement.timestamp.desc()).first()

        # Active policy
        policy = db.query(Policy).filter(Policy.equipment_type == eq.equipment_type).first()
        policy_code = policy.code if policy else "NONE"

        vib_stat = "Normal"
        temp_stat = "Normal"
        press_stat = "Normal"

        if latest_meas:
            if latest_meas.vibration and latest_meas.vibration > 4.2:
                vib_stat = "Elevated" if latest_meas.vibration <= 5.0 else "Critical"
            if latest_meas.bearing_temperature and latest_meas.bearing_temperature > 72.0:
                temp_stat = "Warning" if latest_meas.bearing_temperature <= 80.0 else "Critical"
            elif latest_meas.temperature and latest_meas.temperature > 95.0:
                temp_stat = "Warning"

        health_cards.append(EquipmentHealthCard(
            id=eq.id,
            code=eq.code,
            name=eq.name,
            equipment_type=eq.equipment_type,
            status=eq.status,
            latest_risk_level=latest_eval.risk_level if latest_eval else "LOW",
            latest_decision=latest_eval.final_decision if latest_eval else "APPROVED",
            vibration_status=vib_stat,
            temperature_status=temp_stat,
            pressure_status=press_stat,
            active_policy_code=policy_code,
            last_evaluated_at=latest_eval.evaluated_at if latest_eval else None
        ))

    # Recent evaluations
    recent_evals_records = db.query(EvaluationResult).order_by(
        EvaluationResult.evaluated_at.desc()
    ).limit(5).all()

    recent_evals = [
        {
            "id": r.id,
            "equipment_code": r.equipment.code if r.equipment else "P-101",
            "decision": r.final_decision,
            "risk_score": r.risk_score,
            "risk_level": r.risk_level,
            "evaluated_at": r.evaluated_at
        }
        for r in recent_evals_records
    ]

    # Recent gaps
    recent_gaps_records = db.query(PolicyGap).order_by(
        PolicyGap.occurrence_count.desc()
    ).limit(5).all()

    recent_gaps = [
        {
            "id": g.id,
            "parameter": g.parameter,
            "equipment_type": g.equipment_type,
            "equipment_code": g.equipment_code,
            "occurrence_count": g.occurrence_count,
            "status": g.status,
            "owner": g.owner,
            "last_detected_at": g.last_detected_at
        }
        for g in recent_gaps_records
    ]

    return DashboardResponse(
        kpis=kpis,
        risk_distribution=risk_dist,
        decision_distribution=decision_dist,
        equipment_health=health_cards,
        recent_evaluations=recent_evals,
        recent_policy_gaps=recent_gaps
    )
