from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    actor: str
    action_summary: str
    payload_snapshot: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True
