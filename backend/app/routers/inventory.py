from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.material import Material
from app.models.inventory import InventoryRecord
from app.schemas.inventory import InventoryInCreate, InventoryOutCreate, InventoryRecord as InventorySchema

router = APIRouter(prefix="/api/inventory", tags=["出入库管理"])


@router.get("/records", response_model=List[InventorySchema])
def get_inventory_records(
    record_type: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(InventoryRecord)
    if record_type:
        query = query.filter(InventoryRecord.record_type == record_type)
    if warehouse_id:
        query = query.filter(InventoryRecord.warehouse_id == warehouse_id)
    return query.order_by(InventoryRecord.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/in")
def stock_in(data: InventoryInCreate, db: Session = Depends(get_db)):
    for item in data.materials:
        material = db.query(Material).filter(
            Material.code == item.material_code,
            Material.warehouse_id == data.warehouse_id
        ).first()
        if not material:
            raise HTTPException(status_code=404, detail=f"物资 {item.material_code} 不存在于该仓库")
        
        material.quantity += item.quantity
        
        record = InventoryRecord(
            record_type="in",
            order_no=data.order_no,
            warehouse_id=data.warehouse_id,
            material_code=material.code,
            material_name=material.name,
            quantity=item.quantity,
            record_date=data.record_date,
            handler=data.handler
        )
        db.add(record)
    
    db.commit()
    return {"message": "入库成功"}


@router.post("/out")
def stock_out(data: InventoryOutCreate, db: Session = Depends(get_db)):
    for item in data.materials:
        material = db.query(Material).filter(
            Material.code == item.material_code,
            Material.warehouse_id == data.warehouse_id
        ).first()
        if not material:
            raise HTTPException(status_code=404, detail=f"物资 {item.material_code} 不存在于该仓库")
        
        if material.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"物资 {material.name} 库存不足，当前库存: {material.quantity}")
        
        material.quantity -= item.quantity
        
        record = InventoryRecord(
            record_type="out",
            order_no=data.order_no,
            warehouse_id=data.warehouse_id,
            material_code=material.code,
            material_name=material.name,
            quantity=item.quantity,
            record_date=data.record_date,
            handler=data.handler,
            department=data.department,
            purpose=data.purpose
        )
        db.add(record)
    
    db.commit()
    return {"message": "出库成功"}
