from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from backend.app.schemas.optimization import OptimizationResponse

class OperationEvaluateRequest(BaseModel):
    natural_language_request: Optional[str] = None
    equipment_code: Optional[str] = None
    operation_type: Optional[str] = "Run"
    parameters: Optional[Dict[str, float]] = None # e.g. {"rpm": 2850, "pressure": 14.0, "vibration": 4.2, ...}
    requested_by: Optional[str] = "Mechanical Operator"

class ThresholdResultItem(BaseModel):
    parameter: str
    unit: str
    requested_value: float
    normal_min: Optional[float] = None
    normal_max: Optional[float] = None
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    policy_min: Optional[float] = None
    policy_max: Optional[float] = None
    safety_margin: Optional[float] = None # Distance to nearest critical/policy limit
    distance_to_threshold: Optional[float] = None
    status: str # "PASS", "WARNING", "CRITICAL", "THRESHOLD_VIOLATION", "POLICY_GAP"
    is_mandatory_violation: bool = False
    clause_reference: Optional[str] = None
    notes: Optional[str] = None

class RuleContributionItem(BaseModel):
    rule_code: str
    category: str
    description: str
    score_points: float
    trigger_condition: str

class StatisticalSummaryItem(BaseModel):
    parameter: str
    current_value: float
    historical_mean: float
    historical_median: float
    historical_std_dev: float
    p95: float
    historical_min: float
    historical_max: float
    z_score: float
    is_abnormal: bool

class ProbabilitySummaryItem(BaseModel):
    parameter: str
    operating_value: float
    estimated_failure_probability_pct: Optional[float] = None
    sample_size: int
    historical_failures: int
    is_insufficient_data: bool = False
    status_label: str # "HISTORICAL_ESTIMATE" or "INSUFFICIENT_DATA"

class PolicyProvenanceItem(BaseModel):
    policy_code: str
    policy_name: str
    policy_version: str
    effective_date: str
    owner: str
    clause_number: str
    clause_title: str
    clause_text: str
    parameter: str
    policy_limit: str
    requested_value: str
    is_violated: bool = False

class PolicyGapDetail(BaseModel):
    parameter: str
    equipment_code: Optional[str] = None
    equipment_type: Optional[str] = None
    occurrence_count: int
    gap_owner: str
    status: str
    message: str

class EvaluationResponse(BaseModel):
    id: Optional[int] = None
    request_summary: str
    equipment_code: str
    equipment_name: str
    equipment_type: str
    parsed_parameters: Dict[str, Any]
    
    # Decisions: APPROVED, DENIED, POLICY GAP
    final_decision: str
    decision_reason: str
    
    # Risk Engine Output
    risk_score: float # 0 - 100
    risk_level: str # LOW, MODERATE, HIGH, CRITICAL
    
    # Sub-Engine Results
    threshold_results: List[ThresholdResultItem] = []
    statistical_summary: List[StatisticalSummaryItem] = []
    probability_summary: List[ProbabilitySummaryItem] = []
    rule_contributions: List[RuleContributionItem] = []
    optimization_recommendation: Optional[OptimizationResponse] = None
    
    # Policy Provenance & Gaps
    policy_provenance: List[PolicyProvenanceItem] = []
    policy_gaps: List[PolicyGapDetail] = []
    
    # Natural Language AI Summary
    llm_explanation: str
    
    evaluated_at: datetime

    class Config:
        from_attributes = True

class EvaluationListItem(BaseModel):
    id: int
    equipment_code: str
    final_decision: str
    risk_score: float
    risk_level: str
    evaluated_at: datetime

    class Config:
        from_attributes = True
