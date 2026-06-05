from pydantic import BaseModel
from typing import Optional
from datetime import date


class MaterialBase(BaseModel):
    name: str
    category: str
    specification: Optional[str] = None
    unit: str
    unit_price: float
    warehouse_id: int
    quantity: int = 0
    safety_stock: int = 0
    expiry_date: Optional[date] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    warehouse_id: Optional[int] = None
    quantity: Optional[int] = None
    safety_stock: Optional[int] = None
    expiry_date: Optional[date] = None


class MaterialImport(BaseModel):
    name: str
    category: str
    specification: Optional[str] = None
    unit: str
    unit_price: float
    warehouse_name: str
    quantity: int = 0
    safety_stock: int = 0
    expiry_date: Optional[date] = None


class Material(MaterialBase):
    id: int
    code: str

    class Config:
        from_attributes = True
