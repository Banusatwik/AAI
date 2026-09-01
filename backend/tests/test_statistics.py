import pytest
import numpy as np
from backend.app.models.equipment import Equipment
from backend.app.services.deterministic_engine.statistical_analyzer import StatisticalAnalyzer

def test_statistical_metrics_calculation(db_session):
    eq = db_session.query(Equipment).filter(Equipment.code == "P-101").first()
    
    stats = StatisticalAnalyzer.compute_stats_for_parameter(db_session, eq.id, "vibration", "mm/s")
    
    assert stats is not None
    assert stats.sample_size >= 100
    assert 2.0 <= stats.mean <= 3.5
    assert stats.std_dev > 0.0
    assert stats.p95 >= stats.p50
    assert stats.max_value >= stats.p95
    assert len(stats.time_series) == stats.sample_size

def test_z_score_calculation(db_session):
    eq = db_session.query(Equipment).filter(Equipment.code == "P-101").first()
    
    # Request high value (e.g. 4.8 mm/s vibration)
    summaries = StatisticalAnalyzer.evaluate_request_parameters(
        db_session, eq.id, {"vibration": 4.8}
    )
    assert len(summaries) == 1
    vib_summary = summaries[0]
    # Z-score should be positive and > 2.0 for 4.8 mm/s
    assert vib_summary.z_score > 2.0
    assert vib_summary.is_abnormal is True
