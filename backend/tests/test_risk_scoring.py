import pytest
from backend.app.models.risk_rule import RiskScoringRule
from backend.app.schemas.evaluation import ThresholdResultItem
from backend.app.services.deterministic_engine.risk_scoring_engine import RiskScoringEngine

def test_risk_scoring_rule_evaluation():
    rules = [
        RiskScoringRule(
            rule_code="RULE-VIB-WARN",
            parameter="vibration",
            condition="warning_threshold_exceeded",
            score_points=20.0,
            description="High vibration warning",
            is_active=True
        ),
        RiskScoringRule(
            rule_code="RULE-TEMP-WARN",
            parameter="bearing_temperature",
            condition="warning_threshold_exceeded",
            score_points=25.0,
            description="High bearing temperature",
            is_active=True
        ),
    ]

    t_results = [
        ThresholdResultItem(
            parameter="vibration",
            unit="mm/s",
            requested_value=3.8,
            warning_threshold=3.5,
            status="WARNING"
        ),
        ThresholdResultItem(
            parameter="bearing_temperature",
            unit="°C",
            requested_value=75.0,
            warning_threshold=72.0,
            status="WARNING"
        )
    ]

    score, level, contributions = RiskScoringEngine.evaluate_rules(
        rules=rules,
        threshold_results=t_results,
        statistical_summaries=[],
        probability_summaries=[]
    )

    assert score == 45.0 # 20 + 25
    assert level == "MODERATE"
    assert len(contributions) == 2
    assert contributions[0].score_points == 20.0
    assert contributions[1].score_points == 25.0
