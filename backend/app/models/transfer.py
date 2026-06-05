from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TransferOrder(Base):
    __tablename__ = "transfer_orders"

    id = Column(Integer, primary_key=True, index=True)
    transfer_no = Column(String(50), unique=True, nullable=False)
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    initiator = Column(String(50), nullable=False)
    approver = Column(String(50))
    approval_time = Column(DateTime)
    out_confirm_time = Column(DateTime)
    in_confirm_time = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    materials = relationship("TransferMaterial", back_populates="transfer_order")


class TransferMaterial(Base):
    __tablename__ = "transfer_materials"

    id = Column(Integer, primary_key=True, index=True)
    transfer_order_id = Column(Integer, ForeignKey("transfer_orders.id"), nullable=False)
    material_code = Column(String(50), nullable=False)
    material_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)

    transfer_order = relationship("TransferOrder", back_populates="materials")
