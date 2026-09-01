import pytest
from backend.app.models.policy import PolicyThreshold
from backend.app.services.deterministic_engine.threshold_analyzer import ThresholdAnalyzer

def test_threshold_pass_below_limit():
    threshold = PolicyThreshold(
        parameter="vibration",
        unit="mm/s",
        min_val=0.0,
        max_val=4.5,
        normal_min=0.0,
        normal_max=3.5,
        warning_val=3.5,
        critical_val=4.2,
        is_mandatory=True,
        clause_reference="4.2.1"
    )
    # Value 3.0 < 4.5
    result = ThresholdAnalyzer.analyze_parameter("vibration", 3.0, threshold)
    assert result.status == "PASS"
    assert result.is_mandatory_violation is False
    assert result.safety_margin == 1.5 # 4.5 - 3.0
    assert result.clause_reference == "4.2.1"

def test_threshold_pass_equal_to_limit():
    threshold = PolicyThreshold(
        parameter="vibration",
        unit="mm/s",
        min_val=0.0,
        max_val=4.5,
        normal_min=0.0,
        normal_max=3.5,
        warning_val=3.5,
        critical_val=4.2,
        is_mandatory=True,
        clause_reference="4.2.1"
    )
    # Value 4.5 == 4.5
    result = ThresholdAnalyzer.analyze_parameter("vibration", 4.5, threshold)
    assert result.is_mandatory_violation is False
    assert result.safety_margin == 0.0

def test_threshold_fail_above_limit():
    threshold = PolicyThreshold(
        parameter="vibration",
        unit="mm/s",
        min_val=0.0,
        max_val=4.5,
        normal_min=0.0,
        normal_max=3.5,
        warning_val=3.5,
        critical_val=4.2,
        is_mandatory=True,
        clause_reference="4.2.1"
    )
    # Value 5.2 > 4.5 -> FAIL
    result = ThresholdAnalyzer.analyze_parameter("vibration", 5.2, threshold)
    assert result.status == "THRESHOLD_VIOLATION"
    assert result.is_mandatory_violation is True
    assert result.safety_margin == -0.7 # 4.5 - 5.2

def test_threshold_warning_zone():
    threshold = PolicyThreshold(
        parameter="vibration",
        unit="mm/s",
        min_val=0.0,
        max_val=4.5,
        normal_min=0.0,
        normal_max=3.5,
        warning_val=3.5,
        critical_val=4.2,
        is_mandatory=True
    )
    # Value 3.8 is in warning zone (>= 3.5 but <= 4.5)
    result = ThresholdAnalyzer.analyze_parameter("vibration", 3.8, threshold)
    assert result.status == "WARNING"
    assert result.is_mandatory_violation is False
