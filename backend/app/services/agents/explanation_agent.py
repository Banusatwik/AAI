import logging
from typing import Dict, Any, List
from backend.app.core.config import settings
from backend.app.schemas.evaluation import (
    ThresholdResultItem, RuleContributionItem, PolicyProvenanceItem, PolicyGapDetail, OptimizationResponse
)

logger = logging.getLogger(__name__)

class ExplanationAgent:
    """
    Agent 4 — Engineering Explanation & Narrative Agent.
    Synthesizes the deterministic evaluation results, safety margins, statistical baselines,
    and policy provenance into a clear, audit-ready mechanical engineering report.
    """

    @classmethod
    def generate_explanation(
        cls,
        equipment_code: str,
        equipment_name: str,
        final_decision: str,
        decision_reason: str,
        risk_score: float,
        risk_level: str,
        threshold_results: List[ThresholdResultItem],
        rule_contributions: List[RuleContributionItem],
        provenance: List[PolicyProvenanceItem],
        gaps: List[PolicyGapDetail],
        optimization: Optional[OptimizationResponse] = None
    ) -> str:
        # If OpenAI is enabled, we can request a refined natural language summary
        if settings.OPENAI_API_KEY:
            try:
                import httpx
                headers = {
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                summary_data = {
                    "equipment": f"{equipment_name} ({equipment_code})",
                    "final_decision": final_decision,
                    "reason": decision_reason,
                    "risk_score": f"{risk_score}/100 ({risk_level})",
                    "violations": [t.dict() for t in threshold_results if t.is_mandatory_violation],
                    "rules_triggered": [r.description for r in rule_contributions],
                    "gaps": [g.parameter for g in gaps]
                }
                system_prompt = (
                    "You are a Senior Mechanical Safety Engineer and Auditing Specialist. "
                    "Write an authoritative, concise executive engineering evaluation summary (2-3 paragraphs) "
                    "explaining the decision, safety boundaries, risk score rationale, and actionable operational recommendations. "
                    "Maintain formal engineering terminology. Do not invent any numbers not present in the data."
                )
                payload = {
                    "model": settings.OPENAI_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Evaluation Data:\n{summary_data}"}
                    ],
                    "temperature": 0.2
                }
                with httpx.Client(timeout=8.0) as client:
                    res = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        return data["choices"][0]["message"]["content"].strip()
            except Exception as e:
                logger.warning(f"LLM explanation generation failed, using deterministic template: {e}")

        # Deterministic Mechanical Engineering Summary
        paragraphs = []
        if final_decision == "APPROVED":
            paragraphs.append(
                f"OPERATIONAL STATUS: APPROVED. The proposed operation on {equipment_name} ({equipment_code}) "
                f"strictly satisfies all mandatory safety boundaries defined in active policies. "
                f"The composite deterministic risk score is {risk_score}/100, classified as {risk_level} RISK."
            )
            passed_params = [f"{t.parameter} ({t.requested_value} {t.unit}, margin: +{t.safety_margin} {t.unit})" for t in threshold_results if t.status == "PASS"]
            if passed_params:
                paragraphs.append(f"Operating parameters are within verified tolerances: {', '.join(passed_params)}.")
            
            if optimization and optimization.recommended_point:
                paragraphs.append(
                    f"Operational Advisory: While currently approved, operating at the recommended setpoint "
                    f"({optimization.recommended_point.rpm} RPM, {optimization.recommended_point.flow_rate} m³/h) "
                    f"can further reduce risk by {optimization.risk_score_reduction} points and enhance mechanical efficiency."
                )

        elif final_decision == "DENIED":
            violations = [t for t in threshold_results if t.is_mandatory_violation or t.status == "THRESHOLD_VIOLATION"]
            violation_details = ", ".join([
                f"{v.parameter.upper()} = {v.requested_value} {v.unit} (Policy Limit: {v.policy_max if v.policy_max is not None else v.policy_min} {v.unit}, Ref Clause: {v.clause_reference or 'N/A'})"
                for v in violations
            ])
            paragraphs.append(
                f"OPERATIONAL STATUS: DENIED (MANDATORY SAFETY BOUNDARY VIOLATION). "
                f"The proposed operation for {equipment_name} ({equipment_code}) violates mandatory safety thresholds: {violation_details}."
            )
            paragraphs.append(
                f"In accordance with mechanical safety policy hierarchy (Level 1 Hard Boundary Rule), hard policy violations "
                f"strictly preclude operation regardless of calculated risk score ({risk_score}/100). Immediate setpoint reduction is required."
            )
            if optimization and optimization.recommended_point:
                paragraphs.append(
                    f"Corrective Action: Adjust operating parameters to safe envelope: {optimization.rationale}"
                )

        elif final_decision == "POLICY GAP":
            gap_names = ", ".join([g.parameter for g in gaps])
            paragraphs.append(
                f"OPERATIONAL STATUS: POLICY GAP DETECTED. "
                f"No approved safety policy or operating boundary was found in the database for parameter(s): {gap_names} on {equipment_name} ({equipment_code})."
            )
            paragraphs.append(
                f"In accordance with Core Safety Principle 14 ('Never assume or invent a safety limit'), "
                f"the operation cannot be automatically approved. A formal Policy Gap has been logged to the Mechanical Safety Governance Registry "
                f"under ownership of the Mechanical Safety Team."
            )

        return "\n\n".join(paragraphs)
