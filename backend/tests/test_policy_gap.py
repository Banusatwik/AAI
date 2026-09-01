import pytest
from backend.app.schemas.evaluation import OperationEvaluateRequest
from backend.app.services.deterministic_engine.decision_orchestrator import DecisionOrchestrator
from backend.app.models.policy_gap import PolicyGap

def test_policy_gap_detection(db_session):
    # Request a parameter with NO active policy: "shaft_misalignment"
    request_data = OperationEvaluateRequest(
        equipment_code="P-101",
        operation_type="Run",
        parameters={"shaft_misalignment": 2.4}
    )

    response = DecisionOrchestrator.evaluate_operation(db_session, request_data)

    assert response.final_decision == "POLICY GAP"
    assert len(response.policy_gaps) >= 1
    assert response.policy_gaps[0].parameter == "shaft_misalignment"
    assert response.policy_gaps[0].status == "OPEN"

    # Verify gap was saved in database
    gap_record = db_session.query(PolicyGap).filter(
        PolicyGap.parameter == "shaft_misalignment"
    ).first()
    assert gap_record is not None
    assert gap_record.occurrence_count >= 1

def test_policy_gap_occurrence_counter_increment(db_session):
    request_data = OperationEvaluateRequest(
        equipment_code="P-101",
        operation_type="Run",
        parameters={"rotor_eccentricity_angle": 12.5}
    )

    # First request
    DecisionOrchestrator.evaluate_operation(db_session, request_data)
    gap1 = db_session.query(PolicyGap).filter(PolicyGap.parameter == "rotor_eccentricity_angle").first()
    count1 = gap1.occurrence_count

    # Second request with same missing parameter
    DecisionOrchestrator.evaluate_operation(db_session, request_data)
    db_session.refresh(gap1)
    
    assert gap1.occurrence_count == count1 + 1
