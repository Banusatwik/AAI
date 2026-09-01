from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class OperatingPoint(BaseModel):
    rpm: Optional[float] = None
    flow_rate: Optional[float] = None
    pressure: Optional[float] = None
    bearing_temperature: Optional[float] = None
    vibration: Optional[float] = None
    estimated_efficiency_pct: Optional[float] = None
    estimated_risk_score: Optional[float] = None
    risk_level: Optional[str] = None

class OptimizationRequest(BaseModel):
    equipment_code: str
    target_flow_rate: Optional[float] = None
    current_rpm: Optional[float] = None
    current_pressure: Optional[float] = None
    current_temperature: Optional[float] = None
    current_bearing_temperature: Optional[float] = None
    current_vibration: Optional[float] = None
    objective: str = "MINIMIZE_RISK_MAXIMIZE_EFFICIENCY"

class OptimizationResponse(BaseModel):
    feasible: bool
    status_message: str # "OPTIMAL_POINT_FOUND" or "NO SAFE OPERATING POINT FOUND"
    equipment_code: str
    current_point: OperatingPoint
    recommended_point: Optional[OperatingPoint] = None
    risk_score_reduction: Optional[float] = None
    efficiency_gain_pct: Optional[float] = None
    rationale: str
    constrained_by_policies: List[str] = []
