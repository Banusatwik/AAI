from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PolicyClauseBase(BaseModel):
    clause_number: str
    title: str
    text_content: str
    is_mandatory: bool = True

class PolicyClauseResponse(PolicyClauseBase):
    id: int
    policy_version_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PolicyThresholdBase(BaseModel):
    parameter: str
    unit: str
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    normal_min: Optional[float] = None
    normal_max: Optional[float] = None
    warning_val: Optional[float] = None
    critical_val: Optional[float] = None
    is_mandatory: bool = True
    clause_reference: Optional[str] = None
    description: Optional[str] = None

class PolicyThresholdResponse(PolicyThresholdBase):
    id: int
    policy_version_id: int

    class Config:
        from_attributes = True

class RiskRuleBase(BaseModel):
    rule_code: str
    parameter: str
    condition: str
    threshold_value: Optional[float] = None
    score_points: float
    category: str = "OPERATIONAL"
    description: str
    is_active: bool = True

class RiskRuleResponse(RiskRuleBase):
    id: int
    policy_version_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PolicyVersionBase(BaseModel):
    version: str
    is_active: bool = True
    effective_date: datetime
    expiration_date: Optional[datetime] = None
    change_summary: Optional[str] = None

class PolicyVersionCreate(PolicyVersionBase):
    clauses: List[PolicyClauseBase] = []
    thresholds: List[PolicyThresholdBase] = []
    rules: List[RiskRuleBase] = []

class PolicyVersionResponse(PolicyVersionBase):
    id: int
    policy_id: int
    created_at: datetime
    clauses: List[PolicyClauseResponse] = []
    thresholds: List[PolicyThresholdResponse] = []
    rules: List[RiskRuleResponse] = []

    class Config:
        from_attributes = True

class PolicyBase(BaseModel):
    code: str
    name: str
    equipment_type: str
    owner: str = "Mechanical Safety Team"
    description: Optional[str] = None

class PolicyCreate(PolicyBase):
    initial_version: str = "1.0"
    effective_date: datetime
    clauses: List[PolicyClauseBase] = []
    thresholds: List[PolicyThresholdBase] = []
    rules: List[RiskRuleBase] = []

class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    owner: Optional[str] = None
    description: Optional[str] = None

class PolicyResponse(PolicyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    active_version: Optional[str] = None
    version_count: int = 0

    class Config:
        from_attributes = True

class PolicyDetailResponse(PolicyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    versions: List[PolicyVersionResponse] = []

    class Config:
        from_attributes = True
