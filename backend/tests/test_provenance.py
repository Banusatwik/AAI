import pytest
from backend.app.schemas.evaluation import OperationEvaluateRequest
from backend.app.services.deterministic_engine.decision_orchestrator import DecisionOrchestrator

def test_provenance_information_in_decision(db_session):
    request_data = OperationEvaluateRequest(
        equipment_code="P-101",
        operation_type="Run",
        parameters={
            "rpm": 2700.0,
            "vibration": 3.0,
            "bearing_temperature": 65.0
        }
    )

    response = DecisionOrchestrator.evaluate_operation(db_session, request_data)

    assert len(response.policy_provenance) >= 3

    # Check vibration provenance item
    vib_prov = next((p for p in response.policy_provenance if p.parameter == "vibration"), None)
    assert vib_prov is not None
    assert vib_prov.policy_code == "MECH-PUMP-001"
    assert vib_prov.policy_version == "2.0"
    assert vib_prov.clause_number == "4.2.1"
    assert "Vibration" in vib_prov.clause_title
    assert "Mechanical Reliability & Safety Team" in vib_prov.owner
    assert "4.5" in vib_prov.policy_limit
    assert vib_prov.effective_date == "2026-07-01"
