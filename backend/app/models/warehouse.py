from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    address = Column(String(255), nullable=False)
    manager_name = Column(String(50), nullable=False)
    manager_phone = Column(String(20), nullable=False)
    capacity = Column(Float, nullable=False)
