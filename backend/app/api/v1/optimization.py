from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.equipment import Equipment
from backend.app.schemas.optimization import OptimizationRequest, OptimizationResponse
from backend.app.services.agents.policy_retrieval import PolicyRetrievalAgent
from backend.app.services.deterministic_engine.optimizer import ParameterOptimizer

router = APIRouter(prefix="/optimization", tags=["Optimization"])

@router.post("", response_model=OptimizationResponse)
def run_optimization(
    payload: OptimizationRequest,
    db: Session = Depends(get_db)
):
    eq = db.query(Equipment).filter(
        (Equipment.code == payload.equipment_code) | (Equipment.code == payload.equipment_code.upper())
    ).first()

    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")

    active_ver = PolicyRetrievalAgent.retrieve_active_policy(db, eq)
    if not active_ver:
        raise HTTPException(status_code=400, detail=f"No active policy exists for equipment {eq.code}")

    thresholds = PolicyRetrievalAgent.get_thresholds_for_version(db, active_ver.id)
    rules = PolicyRetrievalAgent.get_rules_for_version(db, active_ver.id)

    params = {}
    if payload.current_rpm is not None:
        params["rpm"] = payload.current_rpm
    if payload.target_flow_rate is not None:
        params["flow_rate"] = payload.target_flow_rate
    if payload.current_pressure is not None:
        params["pressure"] = payload.current_pressure
    if payload.current_bearing_temperature is not None:
        params["bearing_temperature"] = payload.current_bearing_temperature
    if payload.current_vibration is not None:
        params["vibration"] = payload.current_vibration

    if not params:
        params = {"rpm": 2900.0, "flow_rate": 125.0, "pressure": 14.0, "vibration": 4.2, "bearing_temperature": 78.0}

    result = ParameterOptimizer.optimize_operation(
        db, eq.id, eq.code, params, thresholds, rules
    )
    return result
