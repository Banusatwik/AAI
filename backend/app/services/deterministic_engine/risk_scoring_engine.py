from typing import List, Dict, Any, Tuple, Optional
from backend.app.models.risk_rule import RiskScoringRule
from backend.app.schemas.evaluation import (
    ThresholdResultItem, StatisticalSummaryItem, ProbabilitySummaryItem, RuleContributionItem
)
from backend.app.core.config import settings

class RiskScoringEngine:
    """
    Deterministic Risk Scoring Engine.
    Evaluates configurable rules from the database to compute an exact numerical risk score (0-100),
    classifies into risk levels, and returns an itemized contribution list.
    """

    @classmethod
    def evaluate_rules(
        cls,
        rules: List[RiskScoringRule],
        threshold_results: List[ThresholdResultItem],
        statistical_summaries: List[StatisticalSummaryItem],
        probability_summaries: List[ProbabilitySummaryItem]
    ) -> Tuple[float, str, List[RuleContributionItem]]:
        total_score = 0.0
        contributions: List[RuleContributionItem] = []

        # Index threshold results by parameter
        thresh_map = {t.parameter.lower(): t for t in threshold_results}
        stats_map = {s.parameter.lower(): s for s in statistical_summaries}
        prob_map = {p.parameter.lower(): p for p in probability_summaries}

        for rule in rules:
            if getattr(rule, "is_active", True) is False:
                continue

            param = rule.parameter.lower() if rule.parameter else ""
            triggered = False
            trigger_reason = ""

            # Check threshold-based conditions
            if rule.condition in ["warning_threshold_exceeded", "warning_exceeded"]:
                t_item = thresh_map.get(param)
                if t_item and t_item.status in ["WARNING", "CRITICAL", "THRESHOLD_VIOLATION"]:
                    triggered = True
                    trigger_reason = f"{param.capitalize()} ({t_item.requested_value} {t_item.unit}) exceeds warning threshold ({t_item.warning_threshold} {t_item.unit})"
            
            elif rule.condition in ["critical_threshold_exceeded", "critical_exceeded"]:
                t_item = thresh_map.get(param)
                if t_item and t_item.status in ["CRITICAL", "THRESHOLD_VIOLATION"]:
                    triggered = True
                    trigger_reason = f"{param.capitalize()} ({t_item.requested_value} {t_item.unit}) reached critical threshold ({t_item.critical_threshold} {t_item.unit})"

            elif rule.condition in ["max_exceeded", "policy_limit_exceeded"]:
                t_item = thresh_map.get(param)
                if t_item and t_item.is_mandatory_violation:
                    triggered = True
                    trigger_reason = f"{param.capitalize()} ({t_item.requested_value} {t_item.unit}) violated hard policy limit ({t_item.policy_max} {t_item.unit})"

            elif rule.condition == "gt" and rule.threshold_value is not None:
                t_item = thresh_map.get(param)
                if t_item and t_item.requested_value > rule.threshold_value:
                    triggered = True
                    trigger_reason = f"{param.capitalize()} ({t_item.requested_value} {t_item.unit}) > {rule.threshold_value} {t_item.unit}"

            elif rule.condition == "gte" and rule.threshold_value is not None:
                t_item = thresh_map.get(param)
                if t_item and t_item.requested_value >= rule.threshold_value:
                    triggered = True
                    trigger_reason = f"{param.capitalize()} ({t_item.requested_value} {t_item.unit}) >= {rule.threshold_value} {t_item.unit}"

            elif rule.condition == "zscore_gt" and rule.threshold_value is not None:
                s_item = stats_map.get(param)
                if s_item and abs(s_item.z_score) > rule.threshold_value:
                    triggered = True
                    trigger_reason = f"{param.capitalize()} Z-Score ({s_item.z_score}) indicates statistical anomaly (> {rule.threshold_value}σ)"

            elif rule.condition in ["prob_gt", "prob_gte"] and rule.threshold_value is not None:
                p_item = prob_map.get(param)
                if p_item and p_item.estimated_failure_probability_pct is not None:
                    if p_item.estimated_failure_probability_pct >= rule.threshold_value:
                        triggered = True
                        trigger_reason = f"Historical failure probability for {param} is {p_item.estimated_failure_probability_pct}% (>= {rule.threshold_value}%)"

            if triggered:
                points = float(rule.score_points)
                total_score += points
                contributions.append(RuleContributionItem(
                    rule_code=rule.rule_code,
                    category=rule.category or "OPERATIONAL",
                    description=rule.description or "Risk rule triggered",
                    score_points=points,
                    trigger_condition=trigger_reason
                ))

        # Clamp total score between 0.0 and 100.0
        final_score = min(100.0, max(0.0, total_score))

        # Classify Risk Level
        if final_score >= settings.CRITICAL_RISK_THRESHOLD:
            risk_level = "CRITICAL"
        elif final_score >= settings.HIGH_RISK_THRESHOLD:
            risk_level = "HIGH"
        elif final_score >= settings.MODERATE_RISK_THRESHOLD:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        return round(final_score, 1), risk_level, contributions
