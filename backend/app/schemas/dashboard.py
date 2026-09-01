from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class EquipmentHealthCard(BaseModel):
    id: int
    code: str
    name: str
    equipment_type: str
    status: str
    latest_risk_level: str
    latest_decision: str
    vibration_status: str
    temperature_status: str
    pressure_status: str
    active_policy_code: str
    last_evaluated_at: Optional[datetime] = None

class RiskDistribution(BaseModel):
    low: int = 0
    moderate: int = 0
    high: int = 0
    critical: int = 0

class DecisionDistribution(BaseModel):
    approved: int = 0
    denied: int = 0
    policy_gap: int = 0

class DashboardKPIs(BaseModel):
    total_evaluations: int = 0
    approved_count: int = 0
    denied_count: int = 0
    policy_gaps_count: int = 0
    average_risk_score: float = 0.0
    high_risk_operations_count: int = 0

class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    risk_distribution: RiskDistribution
    decision_distribution: DecisionDistribution
    equipment_health: List[EquipmentHealthCard] = []
    recent_evaluations: List[Dict[str, Any]] = []
    recent_policy_gaps: List[Dict[str, Any]] = []
