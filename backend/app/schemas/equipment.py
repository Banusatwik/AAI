from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class EquipmentBase(BaseModel):
    code: str
    name: str
    equipment_type: str
    model_number: Optional[str] = None
    location: Optional[str] = None
    power_kw: Optional[float] = None
    rated_speed_rpm: Optional[float] = None
    status: Optional[str] = "OPERATIONAL"

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentResponse(EquipmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EquipmentDetailResponse(EquipmentResponse):
    active_policy_code: Optional[str] = None
    active_policy_version: Optional[str] = None
    measurement_count: int = 0
    latest_measurements: Optional[dict] = None
