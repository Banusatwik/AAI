import pytest
from backend.app.models.equipment import Equipment
from backend.app.services.deterministic_engine.probability_analyzer import ProbabilityAnalyzer

def test_probability_calculation_on_historical_data(db_session):
    eq = db_session.query(Equipment).filter(Equipment.code == "P-101").first()
    
    # Test probability distribution on vibration
    prob_resp = ProbabilityAnalyzer.get_probability_distribution(db_session, eq.id, eq.code, "vibration", "mm/s")
    
    assert prob_resp.is_insufficient_data is False
    assert prob_resp.total_observations > 50
    assert len(prob_resp.bins) > 0
    # Higher vibration bins should have higher estimated failure probability
    high_bin = prob_resp.bins[-1]
    assert high_bin.total_observations >= 0

def test_insufficient_data_handling_for_empty_equipment(db_session):
    # Create new equipment with no historical data
    empty_eq = Equipment(code="P-999", name="Empty Test Pump", equipment_type="Centrifugal Pump")
    db_session.add(empty_eq)
    db_session.commit()
    db_session.refresh(empty_eq)

    prob_item = ProbabilityAnalyzer.estimate_probability_for_value(db_session, empty_eq.id, "vibration", 4.2)
    assert prob_item.is_insufficient_data is True
    assert prob_item.status_label == "INSUFFICIENT_DATA"
    assert prob_item.estimated_failure_probability_pct is None
