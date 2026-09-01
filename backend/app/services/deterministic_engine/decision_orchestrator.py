import datetime
import logging
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from backend.app.models.equipment import Equipment
from backend.app.models.policy import Policy, PolicyVersion, PolicyClause, PolicyThreshold
from backend.app.models.policy_gap import PolicyGap
from backend.app.models.evaluation import OperationRequest, EvaluationResult
from backend.app.models.audit import AuditLog
from backend.app.models.risk_rule import RiskScoringRule

from backend.app.schemas.evaluation import (
    OperationEvaluateRequest, EvaluationResponse, ThresholdResultItem,
    StatisticalSummaryItem, ProbabilitySummaryItem, RuleContributionItem,
    PolicyProvenanceItem, PolicyGapDetail
)
from backend.app.schemas.optimization import OptimizationResponse

from backend.app.services.agents.operation_understanding import extract_parameters_from_text
from backend.app.services.agents.policy_retrieval import PolicyRetrievalAgent
from backend.app.services.agents.explanation_agent import ExplanationAgent
from backend.app.services.deterministic_engine.threshold_analyzer import ThresholdAnalyzer
from backend.app.services.deterministic_engine.statistical_analyzer import StatisticalAnalyzer
from backend.app.services.deterministic_engine.probability_analyzer import ProbabilityAnalyzer
from backend.app.services.deterministic_engine.risk_scoring_engine import RiskScoringEngine
from backend.app.services.deterministic_engine.optimizer import ParameterOptimizer

logger = logging.getLogger(__name__)

class DecisionOrchestrator:
    """
    Combined Decision Engine Orchestrator.
    Integrates all logical agents and deterministic analytical engines.
    Enforces the strict 3-level safety priority hierarchy:
      - Level 1: Hard Safety Boundary Violation -> DENIED
      - Level 3: Missing Policy Boundary -> POLICY GAP
      - Level 2: Policy Exists & Bounds Respected -> Statistical/Probability/Risk Scoring -> Decision
    """

    @classmethod
    def evaluate_operation(
        cls,
        db: Session,
        request_input: OperationEvaluateRequest
    ) -> EvaluationResponse:
        now = datetime.datetime.utcnow()

        # Step 1: Operation Understanding (Agent 1)
        parsed_equip_code = request_input.equipment_code
        parsed_op_type = request_input.operation_type or "Run"
        parsed_params = request_input.parameters or {}

        if request_input.natural_language_request:
            eq_extracted, op_extracted, extracted_p = extract_parameters_from_text(
                request_input.natural_language_request
            )
            if eq_extracted and not parsed_equip_code:
                parsed_equip_code = eq_extracted
            if op_extracted:
                parsed_op_type = op_extracted
            # Merge extracted params with any explicitly passed params
            parsed_params = {**extracted_p, **parsed_params}

        # Fallback equipment code if none provided
        if not parsed_equip_code:
            # Default to first available equipment in DB or P-101
            first_eq = db.query(Equipment).first()
            parsed_equip_code = first_eq.code if first_eq else "P-101"

        equipment = db.query(Equipment).filter(
            (Equipment.code == parsed_equip_code) | 
            (Equipment.code == parsed_equip_code.upper())
        ).first()

        if not equipment:
            # Create a placeholder or raise
            equipment = Equipment(
                code=parsed_equip_code.upper(),
                name=f"Machinery {parsed_equip_code.upper()}",
                equipment_type="Centrifugal Pump",
                status="OPERATIONAL"
            )
            db.add(equipment)
            db.commit()
            db.refresh(equipment)

        # Step 2: Policy Retrieval (Agent 2)
        active_version = PolicyRetrievalAgent.retrieve_active_policy(db, equipment)
        policy_thresholds: Dict[str, PolicyThreshold] = {}
        clauses: List[PolicyClause] = []
        rules: List[RiskScoringRule] = []

        if active_version:
            policy_thresholds = PolicyRetrievalAgent.get_thresholds_for_version(db, active_version.id)
            clauses = PolicyRetrievalAgent.get_clauses_for_version(db, active_version.id)
            rules = PolicyRetrievalAgent.get_rules_for_version(db, active_version.id)
        else:
            # Retrieve global rules even if no equipment-specific policy
            rules = PolicyRetrievalAgent.get_rules_for_version(db, None)

        # Step 3: Check for Policy Gaps (Level 3 check)
        policy_gaps: List[PolicyGapDetail] = []
        has_policy_gap = False

        if not active_version:
            # Complete absence of policy for this equipment type
            for param_name in parsed_params.keys():
                gap_rec = cls._record_policy_gap(db, param_name, equipment.equipment_type, equipment.code, parsed_op_type)
                policy_gaps.append(PolicyGapDetail(
                    parameter=param_name,
                    equipment_code=equipment.code,
                    equipment_type=equipment.equipment_type,
                    occurrence_count=gap_rec.occurrence_count,
                    gap_owner=gap_rec.owner,
                    status=gap_rec.status,
                    message=f"No active safety policy exists for equipment type '{equipment.equipment_type}'."
                ))
            has_policy_gap = True
        else:
            # Check individual parameters for missing thresholds
            for param_name, param_val in parsed_params.items():
                if param_name.lower() not in policy_thresholds:
                    gap_rec = cls._record_policy_gap(db, param_name, equipment.equipment_type, equipment.code, parsed_op_type)
                    policy_gaps.append(PolicyGapDetail(
                        parameter=param_name,
                        equipment_code=equipment.code,
                        equipment_type=equipment.equipment_type,
                        occurrence_count=gap_rec.occurrence_count,
                        gap_owner=gap_rec.owner,
                        status=gap_rec.status,
                        message=f"No approved safety boundary was found for parameter '{param_name}' on {equipment.code}."
                    ))
                    has_policy_gap = True

        # Step 4: Threshold Analysis (Agent 3)
        threshold_results = ThresholdAnalyzer.evaluate_all(parsed_params, policy_thresholds)

        # Step 5: Statistical & Probability Analysis
        statistical_summaries = StatisticalAnalyzer.evaluate_request_parameters(
            db, equipment.id, parsed_params
        )
        probability_summaries = [
            ProbabilityAnalyzer.estimate_probability_for_value(db, equipment.id, k, v)
            for k, v in parsed_params.items()
        ]

        # Step 6: Deterministic Risk Scoring
        risk_score, risk_level, rule_contributions = RiskScoringEngine.evaluate_rules(
            rules, threshold_results, statistical_summaries, probability_summaries
        )

        # Step 7: Optimization
        optimization_res: Optional[OptimizationResponse] = None
        try:
            optimization_res = ParameterOptimizer.optimize_operation(
                db, equipment.id, equipment.code, parsed_params, policy_thresholds, rules
            )
        except Exception as e:
            logger.warning(f"Optimization calculation error: {e}")

        # Step 8: Policy Provenance Construction
        provenance_items: List[PolicyProvenanceItem] = []
        clause_dict = {c.clause_number: c for c in clauses}

        for t_res in threshold_results:
            thresh_obj = policy_thresholds.get(t_res.parameter.lower())
            if thresh_obj and active_version and active_version.policy:
                clause_obj = clause_dict.get(thresh_obj.clause_reference)
                clause_title = clause_obj.title if clause_obj else "Operational Limit Specification"
                clause_text = clause_obj.text_content if clause_obj else f"Limit for {t_res.parameter} is {thresh_obj.max_val} {thresh_obj.unit}."
                
                limit_str = f"Max: {thresh_obj.max_val} {thresh_obj.unit}" if thresh_obj.max_val is not None else f"Min: {thresh_obj.min_val} {thresh_obj.unit}"
                
                provenance_items.append(PolicyProvenanceItem(
                    policy_code=active_version.policy.code,
                    policy_name=active_version.policy.name,
                    policy_version=active_version.version,
                    effective_date=active_version.effective_date.strftime("%Y-%m-%d"),
                    owner=active_version.policy.owner,
                    clause_number=thresh_obj.clause_reference or "General",
                    clause_title=clause_title,
                    clause_text=clause_text,
                    parameter=t_res.parameter,
                    policy_limit=limit_str,
                    requested_value=f"{t_res.requested_value} {t_res.unit}",
                    is_violated=t_res.is_mandatory_violation
                ))

        # Step 9: Final Decision Synthesis (Strict Hierarchy Enforcement)
        hard_violations = [t for t in threshold_results if t.is_mandatory_violation]

        if hard_violations:
            # Level 1: Hard Policy Violation ALWAYS results in DENIED
            final_decision = "DENIED"
            viol_strs = [f"{v.parameter.upper()} ({v.requested_value} {v.unit} > limit {v.policy_max} {v.unit})" for v in hard_violations]
            decision_reason = f"Hard safety boundary violation: {', '.join(viol_strs)}."
        elif has_policy_gap:
            # Level 3: Policy Gap
            final_decision = "POLICY GAP"
            gap_params = [g.parameter for g in policy_gaps]
            decision_reason = f"No active safety policy exists for parameter(s): {', '.join(gap_params)}. Limits cannot be assumed."
        elif risk_score >= 76.0 or risk_level == "CRITICAL":
            # High risk rejection
            final_decision = "DENIED"
            decision_reason = f"Calculated operational risk score ({risk_score}/100) exceeds safety tolerance."
        else:
            # Approved
            final_decision = "APPROVED"
            decision_reason = f"Operating parameters are within verified safety boundaries with acceptable risk ({risk_score}/100, {risk_level})."

        # Step 10: Explanation Agent (Agent 4)
        llm_explanation = ExplanationAgent.generate_explanation(
            equipment_code=equipment.code,
            equipment_name=equipment.name,
            final_decision=final_decision,
            decision_reason=decision_reason,
            risk_score=risk_score,
            risk_level=risk_level,
            threshold_results=threshold_results,
            rule_contributions=rule_contributions,
            provenance=provenance_items,
            gaps=policy_gaps,
            optimization=optimization_res
        )

        # Step 11: Persist Operation Request, Evaluation Result, and Audit Log
        req_record = OperationRequest(
            raw_prompt=request_input.natural_language_request,
            equipment_code=equipment.code,
            operation_type=parsed_op_type,
            structured_parameters=parsed_params,
            requested_by=request_input.requested_by or "Operator"
        )
        db.add(req_record)
        db.flush()

        eval_result = EvaluationResult(
            request_id=req_record.id,
            equipment_id=equipment.id,
            policy_version_id=active_version.id if active_version else None,
            final_decision=final_decision,
            risk_score=risk_score,
            risk_level=risk_level,
            threshold_results=[t.model_dump() for t in threshold_results],
            statistical_metrics=[s.model_dump() for s in statistical_summaries],
            probability_metrics=[p.model_dump() for p in probability_summaries],
            rule_contributions=[r.model_dump() for r in rule_contributions],
            optimization_details=optimization_res.model_dump() if optimization_res else None,
            policy_provenance=[p.model_dump() for p in provenance_items],
            llm_explanation=llm_explanation,
            evaluated_at=now
        )
        db.add(eval_result)

        # Audit Log
        audit = AuditLog(
            event_type="EVALUATION",
            entity_type="EvaluationResult",
            entity_id=str(req_record.id),
            actor=request_input.requested_by or "Operator",
            action_summary=f"Evaluated {parsed_op_type} on {equipment.code}: {final_decision} (Risk: {risk_score})",
            payload_snapshot={
                "decision": final_decision,
                "equipment": equipment.code,
                "parameters": parsed_params,
                "risk_score": risk_score,
                "policy_version": active_version.version if active_version else None
            }
        )
        db.add(audit)
        db.commit()
        db.refresh(eval_result)

        return EvaluationResponse(
            id=eval_result.id,
            request_summary=f"{parsed_op_type} operation on {equipment.name} ({equipment.code})",
            equipment_code=equipment.code,
            equipment_name=equipment.name,
            equipment_type=equipment.equipment_type,
            parsed_parameters=parsed_params,
            final_decision=final_decision,
            decision_reason=decision_reason,
            risk_score=risk_score,
            risk_level=risk_level,
            threshold_results=threshold_results,
            statistical_summary=statistical_summaries,
            probability_summary=probability_summaries,
            rule_contributions=rule_contributions,
            optimization_recommendation=optimization_res,
            policy_provenance=provenance_items,
            policy_gaps=policy_gaps,
            llm_explanation=llm_explanation,
            evaluated_at=now
        )

    @classmethod
    def _record_policy_gap(
        cls,
        db: Session,
        param_name: str,
        equip_type: str,
        equip_code: str,
        op_type: str
    ) -> PolicyGap:
        gap = db.query(PolicyGap).filter(
            PolicyGap.parameter == param_name.lower(),
            (PolicyGap.equipment_type == equip_type) | (PolicyGap.equipment_code == equip_code)
        ).first()

        if gap:
            gap.occurrence_count += 1
            gap.last_detected_at = datetime.datetime.utcnow()
        else:
            gap = PolicyGap(
                parameter=param_name.lower(),
                equipment_type=equip_type,
                equipment_code=equip_code,
                operation=op_type,
                occurrence_count=1,
                status="OPEN",
                owner="Mechanical Safety Team"
            )
            db.add(gap)
        
        db.commit()
        db.refresh(gap)
        return gap
