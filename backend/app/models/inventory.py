from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class InventoryRecord(Base):
    __tablename__ = "inventory_records"

    id = Column(Integer, primary_key=True, index=True)
    record_type = Column(String(20), nullable=False)
    order_no = Column(String(50), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    material_code = Column(String(50), nullable=False)
    material_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    record_date = Column(Date, nullable=False)
    handler = Column(String(50), nullable=False)
    department = Column(String(100))
    purpose = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
