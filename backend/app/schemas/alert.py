from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class AlertHandle(BaseModel):
    handle_result: str


class Alert(BaseModel):
    id: int
    alert_type: str
    severity: str
    material_id: int
    material_code: str
    material_name: str
    warehouse_id: int
    warehouse_name: str
    message: str
    current_quantity: Optional[int] = None
    safety_stock: Optional[int] = None
    expiry_date: Optional[date] = None
    is_handled: bool
    handle_result: Optional[str] = None
    handled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
