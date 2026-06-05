from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), index=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    specification = Column(String(200))
    unit = Column(String(20), nullable=False)
    unit_price = Column(Float, nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    safety_stock = Column(Integer, nullable=False, default=0)
    expiry_date = Column(Date)

    warehouse = relationship("Warehouse")
