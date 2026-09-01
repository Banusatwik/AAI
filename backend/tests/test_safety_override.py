import pytest
from backend.app.schemas.evaluation import OperationEvaluateRequest
from backend.app.services.deterministic_engine.decision_orchestrator import DecisionOrchestrator

def test_hard_policy_violation_always_denies_despite_low_risk(db_session):
    """
    CRITICAL SAFETY REQUIREMENT:
    Policy max RPM = 2850 RPM in v2.0.
    Suppose requested RPM is 3000 RPM (violates hard boundary),
    even if vibration and temperature are artificially pristine / low risk,
    the decision MUST BE DENIED.
    """
    req = OperationEvaluateRequest(
        equipment_code="P-101",
        operation_type="Run",
        parameters={
            "rpm": 3000.0, # Violates policy limit 2850
            "vibration": 1.2, # Very low / pristine
            "bearing_temperature": 45.0, # Very low
            "pressure": 10.0 # Normal
        }
    )

    response = DecisionOrchestrator.evaluate_operation(db_session, req)

    # Decision MUST be DENIED
    assert response.final_decision == "DENIED"
    assert "Hard safety boundary violation" in response.decision_reason
    assert any(p.parameter == "rpm" and p.is_violated for p in response.policy_provenance)
