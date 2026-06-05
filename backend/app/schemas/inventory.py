from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class InventoryMaterialItem(BaseModel):
    material_code: str
    quantity: int


class InventoryInCreate(BaseModel):
    order_no: str
    warehouse_id: int
    materials: List[InventoryMaterialItem]
    record_date: date
    handler: str


class InventoryOutCreate(BaseModel):
    order_no: str
    warehouse_id: int
    materials: List[InventoryMaterialItem]
    record_date: date
    handler: str
    department: str
    purpose: str


class InventoryRecord(BaseModel):
    id: int
    record_type: str
    order_no: str
    warehouse_id: int
    material_code: str
    material_name: str
    quantity: int
    record_date: date
    handler: str
    department: Optional[str] = None
    purpose: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
