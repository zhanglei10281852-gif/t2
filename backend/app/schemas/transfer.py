from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TransferMaterialCreate(BaseModel):
    material_code: str
    material_name: str
    quantity: int


class TransferMaterial(BaseModel):
    id: int
    transfer_order_id: int
    material_code: str
    material_name: str
    quantity: int

    class Config:
        from_attributes = True


class TransferOrderCreate(BaseModel):
    from_warehouse_id: int
    to_warehouse_id: int
    initiator: str
    materials: List[TransferMaterialCreate]


class TransferOrder(BaseModel):
    id: int
    transfer_no: str
    from_warehouse_id: int
    to_warehouse_id: int
    status: str
    initiator: str
    approver: Optional[str] = None
    approval_time: Optional[datetime] = None
    out_confirm_time: Optional[datetime] = None
    in_confirm_time: Optional[datetime] = None
    created_at: datetime
    materials: List[TransferMaterial] = []

    class Config:
        from_attributes = True


class TransferApproval(BaseModel):
    approver: str


class TransferConfirm(BaseModel):
    handler: str
