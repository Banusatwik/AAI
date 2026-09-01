export interface OperatingPoint {
  rpm?: number;
  flow_rate?: number;
  pressure?: number;
  bearing_temperature?: number;
  vibration?: number;
  estimated_efficiency_pct?: number;
  estimated_risk_score?: number;
  risk_level?: string;
}

export interface OptimizationResponse {
  feasible: boolean;
  status_message: string;
  equipment_code: string;
  current_point: OperatingPoint;
  recommended_point?: OperatingPoint;
  risk_score_reduction?: number;
  efficiency_gain_pct?: number;
  rationale: string;
  constrained_by_policies: string[];
}

export interface ThresholdResultItem {
  parameter: string;
  unit: string;
  requested_value: number;
  normal_min?: number;
  normal_max?: number;
  warning_threshold?: number;
  critical_threshold?: number;
  policy_min?: number;
  policy_max?: number;
  safety_margin?: number;
  distance_to_threshold?: number;
  status: 'PASS' | 'WARNING' | 'CRITICAL' | 'THRESHOLD_VIOLATION' | 'POLICY_GAP';
  is_mandatory_violation: boolean;
  clause_reference?: string;
  notes?: string;
}

export interface RuleContributionItem {
  rule_code: string;
  category: string;
  description: string;
  score_points: number;
  trigger_condition: string;
}

export interface StatisticalSummaryItem {
  parameter: string;
  current_value: number;
  historical_mean: number;
  historical_median: number;
  historical_std_dev: number;
  p95: number;
  historical_min: number;
  historical_max: number;
  z_score: number;
  is_abnormal: boolean;
}

export interface ProbabilitySummaryItem {
  parameter: string;
  operating_value: number;
  estimated_failure_probability_pct?: number;
  sample_size: number;
  historical_failures: number;
  is_insufficient_data: boolean;
  status_label: string;
}

export interface PolicyProvenanceItem {
  policy_code: string;
  policy_name: string;
  policy_version: string;
  effective_date: string;
  owner: string;
  clause_number: string;
  clause_title: string;
  clause_text: string;
  parameter: string;
  policy_limit: string;
  requested_value: string;
  is_violated: boolean;
}

export interface PolicyGapDetail {
  parameter: string;
  equipment_code?: string;
  equipment_type?: string;
  occurrence_count: number;
  gap_owner: string;
  status: string;
  message: string;
}

export interface EvaluationResponse {
  id?: number;
  request_summary: string;
  equipment_code: string;
  equipment_name: string;
  equipment_type: string;
  parsed_parameters: Record<string, any>;
  final_decision: 'APPROVED' | 'DENIED' | 'POLICY GAP';
  decision_reason: string;
  risk_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  threshold_results: ThresholdResultItem[];
  statistical_summary: StatisticalSummaryItem[];
  probability_summary: ProbabilitySummaryItem[];
  rule_contributions: RuleContributionItem[];
  optimization_recommendation?: OptimizationResponse;
  policy_provenance: PolicyProvenanceItem[];
  policy_gaps: PolicyGapDetail[];
  llm_explanation: string;
  evaluated_at: string;
}

export interface EvaluationListItem {
  id: number;
  equipment_code: string;
  final_decision: string;
  risk_score: number;
  risk_level: string;
  evaluated_at: string;
}

export interface EquipmentItem {
  id: number;
  code: string;
  name: string;
  equipment_type: string;
  model_number?: string;
  location?: string;
  power_kw?: number;
  rated_speed_rpm?: number;
  status: string;
  created_at: string;
  active_policy_code?: string;
  active_policy_version?: string;
  measurement_count: number;
  latest_measurements?: Record<string, any>;
}

export interface PolicyClause {
  id: number;
  clause_number: string;
  title: string;
  text_content: string;
  is_mandatory: boolean;
}

export interface PolicyThreshold {
  id: number;
  parameter: string;
  unit: string;
  min_val?: number;
  max_val?: number;
  normal_min?: number;
  normal_max?: number;
  warning_val?: number;
  critical_val?: number;
  is_mandatory: boolean;
  clause_reference?: string;
  description?: string;
}

export interface RiskRule {
  id: number;
  rule_code: string;
  parameter: string;
  condition: string;
  threshold_value?: number;
  score_points: number;
  category: string;
  description: string;
  is_active: boolean;
}

export interface PolicyVersion {
  id: number;
  policy_id: number;
  version: string;
  is_active: boolean;
  effective_date: string;
  expiration_date?: string;
  change_summary?: string;
  clauses: PolicyClause[];
  thresholds: PolicyThreshold[];
  rules: RiskRule[];
}

export interface PolicyDetail {
  id: number;
  code: string;
  name: string;
  equipment_type: string;
  owner: string;
  description?: string;
  created_at: string;
  updated_at: string;
  versions: PolicyVersion[];
}

export interface PolicySummary {
  id: number;
  code: string;
  name: string;
  equipment_type: string;
  owner: string;
  description?: string;
  active_version?: string;
  version_count: number;
}

export interface PolicyGapItem {
  id: number;
  parameter: string;
  equipment_type?: string;
  equipment_code?: string;
  operation?: string;
  occurrence_count: number;
  status: string;
  owner: string;
  resolution_notes?: string;
  first_detected_at: string;
  last_detected_at: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  is_anomaly: boolean;
  failure_occurred: boolean;
  moving_avg?: number;
}

export interface ParameterStats {
  equipment_code: string;
  equipment_type: string;
  parameter: string;
  unit: string;
  sample_size: number;
  mean: number;
  median: number;
  std_dev: number;
  variance: number;
  min_value: number;
  max_value: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  trend: string;
  is_insufficient_data: boolean;
  time_series: TimeSeriesPoint[];
}

export interface ProbabilityBin {
  range_label: string;
  min_val: number;
  max_val: number;
  total_observations: number;
  failure_events: number;
  failure_probability_pct: number;
  status: string;
}

export interface ParameterProbability {
  equipment_code: string;
  parameter: string;
  unit: string;
  total_observations: number;
  total_failures: number;
  overall_failure_rate_pct: number;
  is_insufficient_data: boolean;
  data_status_message?: string;
  bins: ProbabilityBin[];
}

export interface EquipmentHealthCard {
  id: number;
  code: string;
  name: string;
  equipment_type: string;
  status: string;
  latest_risk_level: string;
  latest_decision: string;
  vibration_status: string;
  temperature_status: string;
  pressure_status: string;
  active_policy_code: string;
  last_evaluated_at?: string;
}

export interface DashboardResponse {
  kpis: {
    total_evaluations: number;
    approved_count: number;
    denied_count: number;
    policy_gaps_count: number;
    average_risk_score: number;
    high_risk_operations_count: number;
  };
  risk_distribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  decision_distribution: {
    approved: number;
    denied: number;
    policy_gap: number;
  };
  equipment_health: EquipmentHealthCard[];
  recent_evaluations: any[];
  recent_policy_gaps: any[];
}

export interface AuditLogItem {
  id: number;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  actor: string;
  action_summary: string;
  payload_snapshot?: Record<string, any>;
  timestamp: string;
}
