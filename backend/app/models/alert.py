from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(20), nullable=False)
    severity = Column(String(20), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    material_code = Column(String(50), nullable=False)
    material_name = Column(String(100), nullable=False)
    warehouse_id = Column(Integer, nullable=False)
    warehouse_name = Column(String(100), nullable=False)
    message = Column(String(500), nullable=False)
    current_quantity = Column(Integer)
    safety_stock = Column(Integer)
    expiry_date = Column(Date)
    is_handled = Column(Boolean, default=False)
    handle_result = Column(String(500))
    handled_at = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
