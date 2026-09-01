from typing import Dict, Any, List, Optional
from backend.app.models.policy import PolicyThreshold
from backend.app.schemas.evaluation import ThresholdResultItem

class ThresholdAnalyzer:
    """
    Threshold Analysis Engine (Agent 3).
    Compares requested operating values against policy-defined thresholds dynamically.
    Calculates safety margins, threshold distances, and identifies hard violations.
    """

    @staticmethod
    def analyze_parameter(
        param_name: str,
        value: float,
        threshold: Optional[PolicyThreshold]
    ) -> ThresholdResultItem:
        if not threshold:
            return ThresholdResultItem(
                parameter=param_name,
                unit="N/A",
                requested_value=value,
                status="POLICY_GAP",
                is_mandatory_violation=False,
                notes="No approved safety policy threshold exists for this parameter."
            )

        unit = threshold.unit or ""
        min_v = threshold.min_val
        max_v = threshold.max_val
        norm_min = threshold.normal_min
        norm_max = threshold.normal_max
        warn_v = threshold.warning_val
        crit_v = threshold.critical_val
        is_mand = bool(threshold.is_mandatory) if threshold.is_mandatory is not None else True

        status = "PASS"
        is_violation = False
        notes = "Within normal operating boundaries."

        # Check Hard Policy Max Limit
        if max_v is not None and value > max_v:
            status = "THRESHOLD_VIOLATION"
            is_violation = is_mand
            notes = f"Exceeds maximum allowable policy limit of {max_v} {unit}."
        # Check Hard Policy Min Limit
        elif min_v is not None and value < min_v:
            status = "THRESHOLD_VIOLATION"
            is_violation = is_mand
            notes = f"Below minimum allowable policy limit of {min_v} {unit}."
        # Check Critical Threshold
        elif crit_v is not None and value >= crit_v:
            status = "CRITICAL"
            notes = f"Reached critical advisory threshold of {crit_v} {unit}."
        # Check Warning Threshold
        elif warn_v is not None and value >= warn_v:
            status = "WARNING"
            notes = f"Operating in warning zone (threshold: {warn_v} {unit})."
        # Check Normal Operating Range
        elif norm_max is not None and value > norm_max:
            status = "WARNING"
            notes = f"Exceeds recommended normal range max ({norm_max} {unit})."
        elif norm_min is not None and value < norm_min:
            status = "WARNING"
            notes = f"Below recommended normal range min ({norm_min} {unit})."

        # Calculate Safety Margin (distance to policy max limit or critical threshold)
        safety_margin = None
        limit_target = max_v if max_v is not None else crit_v
        if limit_target is not None:
            safety_margin = round(limit_target - value, 3)

        # Distance to warning threshold
        distance_to_threshold = None
        if warn_v is not None:
            distance_to_threshold = round(warn_v - value, 3)

        return ThresholdResultItem(
            parameter=param_name,
            unit=unit,
            requested_value=value,
            normal_min=norm_min,
            normal_max=norm_max,
            warning_threshold=warn_v,
            critical_threshold=crit_v,
            policy_min=min_v,
            policy_max=max_v,
            safety_margin=safety_margin,
            distance_to_threshold=distance_to_threshold,
            status=status,
            is_mandatory_violation=bool(is_violation),
            clause_reference=threshold.clause_reference,
            notes=notes
        )

    @classmethod
    def evaluate_all(
        cls,
        parameters: Dict[str, float],
        policy_thresholds: Dict[str, PolicyThreshold]
    ) -> List[ThresholdResultItem]:
        results: List[ThresholdResultItem] = []
        for param, val in parameters.items():
            thresh = policy_thresholds.get(param.lower())
            item = cls.analyze_parameter(param, val, thresh)
            results.append(item)
        return results
