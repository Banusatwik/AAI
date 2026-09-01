from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from backend.app.schemas.evaluation import OperationEvaluateRequest, EvaluationResponse, EvaluationListItem
from backend.app.services.deterministic_engine.decision_orchestrator import DecisionOrchestrator
from backend.app.models.evaluation import EvaluationResult, OperationRequest
from backend.app.models.equipment import Equipment

router = APIRouter(prefix="/evaluate", tags=["Evaluation"])

@router.post("", response_model=EvaluationResponse)
def evaluate_operation(
    payload: OperationEvaluateRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates an industrial mechanical operation request against dynamic safety policies,
    operating limits, historical statistics, failure probability models, and risk rules.
    """
    try:
        response = DecisionOrchestrator.evaluate_operation(db, payload)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.get("/history", response_model=List[EvaluationListItem])
def list_evaluations(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    results = db.query(EvaluationResult).join(
        Equipment, EvaluationResult.equipment_id == Equipment.id, isouter=True
    ).order_by(EvaluationResult.evaluated_at.desc()).limit(limit).all()

    out = []
    for r in results:
        code = r.equipment.code if r.equipment else "UNKNOWN"
        out.append(EvaluationListItem(
            id=r.id,
            equipment_code=code,
            final_decision=r.final_decision,
            risk_score=r.risk_score,
            risk_level=r.risk_level,
            evaluated_at=r.evaluated_at
        ))
    return out

@router.get("/{evaluation_id}")
def get_evaluation_details(
    evaluation_id: int,
    db: Session = Depends(get_db)
):
    result = db.query(EvaluationResult).filter(EvaluationResult.id == evaluation_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Evaluation record not found")
    
    eq = result.equipment
    return {
        "id": result.id,
        "equipment_code": eq.code if eq else "UNKNOWN",
        "equipment_name": eq.name if eq else "Unknown Equipment",
        "equipment_type": eq.equipment_type if eq else "Unknown",
        "final_decision": result.final_decision,
        "risk_score": result.risk_score,
        "risk_level": result.risk_level,
        "threshold_results": result.threshold_results,
        "statistical_metrics": result.statistical_metrics,
        "probability_metrics": result.probability_metrics,
        "rule_contributions": result.rule_contributions,
        "optimization_details": result.optimization_details,
        "policy_provenance": result.policy_provenance,
        "llm_explanation": result.llm_explanation,
        "evaluated_at": result.evaluated_at
    }
