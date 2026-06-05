from pydantic import BaseModel
from typing import Optional


class WarehouseBase(BaseModel):
    name: str
    address: str
    manager_name: str
    manager_phone: str
    capacity: float


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(WarehouseBase):
    pass


class Warehouse(WarehouseBase):
    id: int

    class Config:
        from_attributes = True
