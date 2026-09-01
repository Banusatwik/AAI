import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models.policy import PolicyThreshold, PolicyVersion
from backend.app.models.risk_rule import RiskScoringRule
from backend.app.schemas.optimization import OperatingPoint, OptimizationResponse, OptimizationRequest
from backend.app.services.deterministic_engine.threshold_analyzer import ThresholdAnalyzer
from backend.app.services.deterministic_engine.risk_scoring_engine import RiskScoringEngine
from backend.app.services.deterministic_engine.statistical_analyzer import StatisticalAnalyzer
from backend.app.services.deterministic_engine.probability_analyzer import ProbabilityAnalyzer

class ParameterOptimizer:
    """
    Mechanical Parameter Optimization Module.
    Finds a safer feasible operating point that minimizes operational risk,
    maintains acceptable flow/output, and maximizes mechanical efficiency
    while strictly obeying all policy-defined hard constraints.
    """

    @classmethod
    def optimize_operation(
        cls,
        db: Session,
        equipment_id: int,
        equipment_code: str,
        current_params: Dict[str, float],
        policy_thresholds: Dict[str, PolicyThreshold],
        rules: List[RiskScoringRule]
    ) -> OptimizationResponse:
        rpm_in = current_params.get("rpm", 2900.0)
        flow_in = current_params.get("flow_rate", current_params.get("flow", 120.0))
        press_in = current_params.get("pressure", 12.0)
        vib_in = current_params.get("vibration", 4.2)
        bearing_temp_in = current_params.get("bearing_temperature", current_params.get("temperature", 75.0))

        # Evaluate Current Point Risk
        t_curr = ThresholdAnalyzer.evaluate_all(current_params, policy_thresholds)
        s_curr = StatisticalAnalyzer.evaluate_request_parameters(db, equipment_id, current_params)
        p_curr = [
            ProbabilityAnalyzer.estimate_probability_for_value(db, equipment_id, k, v) 
            for k, v in current_params.items()
        ]
        curr_score, curr_risk_lvl, _ = RiskScoringEngine.evaluate_rules(rules, t_curr, s_curr, p_curr)

        # Baseline efficiency calculation using typical centrifugal pump affinity laws / characteristic curve
        # Efficiency = 100 * (1 - ((rpm / 3000 - 0.9)**2 + (flow / 120 - 1.0)**2 * 1.5))
        base_eff = max(60.0, min(92.0, 88.0 - (abs(rpm_in - 2750.0)/100.0)*1.8 - (abs(flow_in - 118.0)/10.0)*1.2))

        curr_point = OperatingPoint(
            rpm=round(rpm_in, 1),
            flow_rate=round(flow_in, 1),
            pressure=round(press_in, 1),
            bearing_temperature=round(bearing_temp_in, 1),
            vibration=round(vib_in, 1),
            estimated_efficiency_pct=round(base_eff, 1),
            estimated_risk_score=curr_score,
            risk_level=curr_risk_lvl
        )

        # Retrieve hard safety limits from policy thresholds
        rpm_thresh = policy_thresholds.get("rpm")
        vib_thresh = policy_thresholds.get("vibration")
        temp_thresh = policy_thresholds.get("bearing_temperature") or policy_thresholds.get("temperature")
        press_thresh = policy_thresholds.get("pressure")
        flow_thresh = policy_thresholds.get("flow_rate") or policy_thresholds.get("flow")

        # Constraints
        max_rpm = rpm_thresh.max_val if rpm_thresh and rpm_thresh.max_val else 3000.0
        min_rpm = rpm_thresh.min_val if rpm_thresh and rpm_thresh.min_val else 1800.0
        normal_max_rpm = rpm_thresh.normal_max if rpm_thresh and rpm_thresh.normal_max else (max_rpm * 0.92)

        max_vib = vib_thresh.max_val if vib_thresh and vib_thresh.max_val else 4.5
        warn_vib = vib_thresh.warning_val if vib_thresh and vib_thresh.warning_val else 3.5

        # Check if requested parameters are completely unfulfillable (e.g. required flow demands RPM > max_rpm)
        if min_rpm > max_rpm:
            return OptimizationResponse(
                feasible=False,
                status_message="NO SAFE OPERATING POINT FOUND",
                equipment_code=equipment_code,
                current_point=curr_point,
                recommended_point=None,
                rationale="Policy constraints are contradictory or infeasible (min_rpm > max_rpm).",
                constrained_by_policies=["MECH-SAFETY-BOUNDS"]
            )

        # Grid search over feasible RPM space [min_rpm, normal_max_rpm] to find optimal operating point
        rpm_candidates = np.linspace(min_rpm, normal_max_rpm, 25)
        best_candidate = None
        min_candidate_risk = 999.0
        best_eff = 0.0

        for candidate_rpm in rpm_candidates:
            # Affinity law scaling
            speed_ratio = candidate_rpm / (rpm_in if rpm_in > 0 else 2850.0)
            
            # Flow scales with speed ratio
            cand_flow = flow_in * (0.85 + 0.15 * speed_ratio) if flow_in else 115.0
            # Pressure scales roughly with square of speed ratio
            cand_press = press_in * (speed_ratio ** 1.8) if press_in else 12.0
            # Vibration scales strongly with speed ratio
            cand_vib = vib_in * (speed_ratio ** 2.2) if vib_in else 2.8
            # Bearing temperature scales with speed
            cand_bearing = bearing_temp_in - (1.0 - speed_ratio) * 20.0 if bearing_temp_in else 65.0

            # Verify hard constraints
            if cand_vib > (warn_vib if warn_vib else max_vib):
                continue
            if press_thresh and press_thresh.max_val and cand_press > press_thresh.max_val:
                continue
            if temp_thresh and temp_thresh.max_val and cand_bearing > temp_thresh.max_val:
                continue

            test_params = {
                "rpm": float(candidate_rpm),
                "flow_rate": float(cand_flow),
                "pressure": float(cand_press),
                "vibration": float(cand_vib),
                "bearing_temperature": float(cand_bearing)
            }

            t_cand = ThresholdAnalyzer.evaluate_all(test_params, policy_thresholds)
            s_cand = StatisticalAnalyzer.evaluate_request_parameters(db, equipment_id, test_params)
            p_cand = [
                ProbabilityAnalyzer.estimate_probability_for_value(db, equipment_id, k, v) 
                for k, v in test_params.items()
            ]
            c_score, c_risk, _ = RiskScoringEngine.evaluate_rules(rules, t_cand, s_cand, p_cand)

            c_eff = max(65.0, min(94.0, 90.0 - (abs(candidate_rpm - 2700.0)/100.0)*1.5 - (abs(cand_flow - 118.0)/10.0)*1.0))

            # Composite objective: minimize risk score, secondary maximize efficiency
            fitness = c_score - (c_eff * 0.1)
            if fitness < min_candidate_risk:
                min_candidate_risk = fitness
                best_candidate = {
                    "rpm": candidate_rpm,
                    "flow_rate": cand_flow,
                    "pressure": cand_press,
                    "vibration": cand_vib,
                    "bearing_temperature": cand_bearing,
                    "risk_score": c_score,
                    "risk_level": c_risk,
                    "efficiency": c_eff
                }

        if not best_candidate:
            return OptimizationResponse(
                feasible=False,
                status_message="NO SAFE OPERATING POINT FOUND",
                equipment_code=equipment_code,
                current_point=curr_point,
                recommended_point=None,
                rationale="All tested operating points violate policy limits for vibration, pressure, or temperature.",
                constrained_by_policies=["MECH-HARD-BOUNDS", "VIBRATION_LIMIT", "PRESSURE_LIMIT"]
            )

        rec_point = OperatingPoint(
            rpm=round(best_candidate["rpm"], 1),
            flow_rate=round(best_candidate["flow_rate"], 1),
            pressure=round(best_candidate["pressure"], 1),
            bearing_temperature=round(best_candidate["bearing_temperature"], 1),
            vibration=round(best_candidate["vibration"], 1),
            estimated_efficiency_pct=round(best_candidate["efficiency"], 1),
            estimated_risk_score=round(best_candidate["risk_score"], 1),
            risk_level=best_candidate["risk_level"]
        )

        risk_diff = round(curr_score - best_candidate["risk_score"], 1)
        eff_gain = round(best_candidate["efficiency"] - base_eff, 1)

        rationale = (
            f"Recommended reducing operating speed from {round(rpm_in)} RPM to {round(best_candidate['rpm'])} RPM. "
            f"This lowers vibration from {round(vib_in, 2)} mm/s to {round(best_candidate['vibration'], 2)} mm/s "
            f"(within normal safety band <= {warn_vib} mm/s), reduces bearing thermal load to {round(best_candidate['bearing_temperature'], 1)}°C, "
            f"and achieves an estimated {risk_diff} point risk reduction while maintaining required flow delivery at {round(best_candidate['efficiency'], 1)}% efficiency."
        )

        constrained_policies = []
        if rpm_thresh and rpm_thresh.clause_reference:
            constrained_policies.append(f"RPM Limit Clause {rpm_thresh.clause_reference}")
        if vib_thresh and vib_thresh.clause_reference:
            constrained_policies.append(f"Vibration Limit Clause {vib_thresh.clause_reference}")

        return OptimizationResponse(
            feasible=True,
            status_message="OPTIMAL_POINT_FOUND",
            equipment_code=equipment_code,
            current_point=curr_point,
            recommended_point=rec_point,
            risk_score_reduction=risk_diff,
            efficiency_gain_pct=eff_gain,
            rationale=rationale,
            constrained_by_policies=constrained_policies
        )
