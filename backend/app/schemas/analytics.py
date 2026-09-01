from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TimeSeriesPoint(BaseModel):
    timestamp: datetime
    value: float
    is_anomaly: bool = False
    failure_occurred: bool = False
    moving_avg: Optional[float] = None

class ParameterStatsResponse(BaseModel):
    equipment_code: str
    equipment_type: str
    parameter: str
    unit: str
    sample_size: int
    mean: float
    median: float
    std_dev: float
    variance: float
    min_value: float
    max_value: float
    p50: float
    p90: float
    p95: float
    p99: float
    trend: str # "STABLE", "INCREASING", "DECREASING"
    is_insufficient_data: bool = False
    time_series: List[TimeSeriesPoint] = []

class ProbabilityBin(BaseModel):
    range_label: str # e.g. "Low (0.0 - 2.5 mm/s)"
    min_val: float
    max_val: float
    total_observations: int
    failure_events: int
    failure_probability_pct: float # e.g. 8.4%
    status: str # "NORMAL", "ELEVATED", "HIGH_RISK", "CRITICAL", "INSUFFICIENT_DATA"

class ParameterProbabilityResponse(BaseModel):
    equipment_code: str
    parameter: str
    unit: str
    total_observations: int
    total_failures: int
    overall_failure_rate_pct: float
    is_insufficient_data: bool
    data_status_message: Optional[str] = None
    bins: List[ProbabilityBin] = []
