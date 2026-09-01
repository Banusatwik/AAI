import pytest
from backend.app.schemas.evaluation import OperationEvaluateRequest
from backend.app.services.deterministic_engine.decision_orchestrator import DecisionOrchestrator
from backend.app.models.policy import Policy, PolicyVersion

def test_dynamic_policy_version_switching(db_session):
    # Under Policy v2.0 (Active by default in seed):
    # Max continuous allowable speed = 2850 RPM.
    # A request with 2900 RPM MUST BE DENIED as a hard policy boundary violation.
    req = OperationEvaluateRequest(
        equipment_code="P-101",
        operation_type="Run",
        parameters={"rpm": 2900.0, "vibration": 2.8, "bearing_temperature": 60.0}
    )
    res_v2 = DecisionOrchestrator.evaluate_operation(db_session, req)
    assert res_v2.final_decision == "DENIED"
    assert any(t.parameter == "rpm" and t.is_mandatory_violation for t in res_v2.threshold_results)

    # Now switch active version to v1.0 (where Max allowable speed = 3000 RPM)
    pump_policy = db_session.query(Policy).filter(Policy.code == "MECH-PUMP-001").first()
    
    # Deactivate v2.0 and activate v1.0
    db_session.query(PolicyVersion).filter(PolicyVersion.policy_id == pump_policy.id).update({"is_active": False})
    v1 = db_session.query(PolicyVersion).filter(
        PolicyVersion.policy_id == pump_policy.id,
        PolicyVersion.version == "1.0"
    ).first()
    v1.is_active = True
    db_session.commit()

    # Re-evaluate the exact same request (2900 RPM)
    res_v1 = DecisionOrchestrator.evaluate_operation(db_session, req)
    # Under v1.0, 2900 RPM < 3000 RPM limit -> No hard policy violation and operation is APPROVED!
    assert not any(t.is_mandatory_violation for t in res_v1.threshold_results)
    assert res_v1.final_decision == "APPROVED"
    assert res_v1.policy_provenance[0].policy_version == "1.0"
