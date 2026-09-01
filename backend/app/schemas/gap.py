from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PolicyGapBase(BaseModel):
    parameter: str
    equipment_type: Optional[str] = None
    equipment_code: Optional[str] = None
    operation: Optional[str] = None
    occurrence_count: int = 1
    status: str = "OPEN"
    owner: str = "Mechanical Safety Team"
    resolution_notes: Optional[str] = None

class PolicyGapCreate(BaseModel):
    parameter: str
    equipment_type: Optional[str] = None
    equipment_code: Optional[str] = None
    operation: Optional[str] = None

class PolicyGapUpdate(BaseModel):
    status: Optional[str] = None
    owner: Optional[str] = None
    resolution_notes: Optional[str] = None

class PolicyGapResponse(PolicyGapBase):
    id: int
    first_detected_at: datetime
    last_detected_at: datetime

    class Config:
        from_attributes = True
