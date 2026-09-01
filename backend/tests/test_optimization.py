import pytest
from backend.app.schemas.evaluation import OperationEvaluateRequest
from backend.app.services.deterministic_engine.decision_orchestrator import DecisionOrchestrator
from backend.app.models.equipment import Equipment
from backend.app.models.policy import PolicyThreshold
from backend.app.services.deterministic_engine.optimizer import ParameterOptimizer

def test_optimization_recommends_safer_point(db_session):
    eq = db_session.query(Equipment).filter(Equipment.code == "P-101").first()

    # Request high point: 2900 RPM, 4.3 mm/s vibration, 78°C bearing temp
    req = OperationEvaluateRequest(
        equipment_code="P-101",
        operation_type="Run",
        parameters={
            "rpm": 2840.0,
            "vibration": 4.1,
            "bearing_temperature": 76.0,
            "flow_rate": 125.0
        }
    )

    response = DecisionOrchestrator.evaluate_operation(db_session, req)
    opt = response.optimization_recommendation

    assert opt is not None
    assert opt.feasible is True
    assert opt.recommended_point is not None
    # Recommended RPM should be lower than requested 2840
    assert opt.recommended_point.rpm < 2840.0
    # Recommended point risk score should be lower
    assert opt.recommended_point.estimated_risk_score <= opt.current_point.estimated_risk_score
    # Recommended vibration must be within warning/normal boundary
    assert opt.recommended_point.vibration <= 3.5

def test_optimization_infeasible_when_policy_impossible(db_session):
    eq = db_session.query(Equipment).filter(Equipment.code == "P-101").first()
    
    # Contradictory thresholds where min_rpm > max_rpm
    thresholds = {
        "rpm": PolicyThreshold(parameter="rpm", unit="RPM", min_val=3200.0, max_val=2500.0)
    }

    opt_res = ParameterOptimizer.optimize_operation(
        db_session, eq.id, eq.code, {"rpm": 2900.0}, thresholds, []
    )

    assert opt_res.feasible is False
    assert opt_res.status_message == "NO SAFE OPERATING POINT FOUND"
