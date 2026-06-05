from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.transfer import TransferOrder, TransferMaterial
from app.models.material import Material
from app.models.warehouse import Warehouse
from app.schemas.transfer import TransferOrderCreate, TransferOrder as TransferSchema, TransferApproval, TransferConfirm

router = APIRouter(prefix="/api/transfers", tags=["调拨管理"])


def generate_transfer_no(db: Session) -> str:
    today = datetime.now().strftime("%Y%m%d")
    last_transfer = db.query(TransferOrder).filter(
        TransferOrder.transfer_no.like(f"DB{today}%")
    ).order_by(TransferOrder.transfer_no.desc()).first()
    
    if last_transfer:
        last_num = int(last_transfer.transfer_no[-4:])
        new_num = str(last_num + 1).zfill(4)
    else:
        new_num = "0001"
    
    return f"DB{today}{new_num}"


@router.get("/", response_model=List[TransferSchema])
def get_transfers(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(TransferOrder)
    if status:
        query = query.filter(TransferOrder.status == status)
    return query.order_by(TransferOrder.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{transfer_id}", response_model=TransferSchema)
def get_transfer(transfer_id: int, db: Session = Depends(get_db)):
    transfer = db.query(TransferOrder).filter(TransferOrder.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="调拨单不存在")
    return transfer


@router.post("/", response_model=TransferSchema)
def create_transfer(data: TransferOrderCreate, db: Session = Depends(get_db)):
    if data.from_warehouse_id == data.to_warehouse_id:
        raise HTTPException(status_code=400, detail="调入和调出仓库不能相同")
    
    for item in data.materials:
        material = db.query(Material).filter(
            Material.code == item.material_code,
            Material.warehouse_id == data.from_warehouse_id
        ).first()
        if not material:
            raise HTTPException(status_code=404, detail=f"调出仓库不存在物资 {item.material_code}")
        if material.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"物资 {material.name} 库存不足")
    
    transfer_no = generate_transfer_no(db)
    transfer = TransferOrder(
        transfer_no=transfer_no,
        from_warehouse_id=data.from_warehouse_id,
        to_warehouse_id=data.to_warehouse_id,
        initiator=data.initiator,
        status="pending"
    )
    db.add(transfer)
    db.flush()
    
    for item in data.materials:
        tm = TransferMaterial(
            transfer_order_id=transfer.id,
            material_code=item.material_code,
            material_name=item.material_name,
            quantity=item.quantity
        )
        db.add(tm)
    
    db.commit()
    db.refresh(transfer)
    return transfer


@router.post("/{transfer_id}/approve", response_model=TransferSchema)
def approve_transfer(transfer_id: int, data: TransferApproval, db: Session = Depends(get_db)):
    transfer = db.query(TransferOrder).filter(TransferOrder.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="调拨单不存在")
    if transfer.status != "pending":
        raise HTTPException(status_code=400, detail="只能审批待审批的调拨单")
    
    transfer.status = "approved"
    transfer.approver = data.approver
    transfer.approval_time = datetime.now()
    db.commit()
    db.refresh(transfer)
    return transfer


@router.post("/{transfer_id}/confirm-out", response_model=TransferSchema)
def confirm_out(transfer_id: int, db: Session = Depends(get_db)):
    transfer = db.query(TransferOrder).filter(TransferOrder.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="调拨单不存在")
    if transfer.status != "approved":
        raise HTTPException(status_code=400, detail="只能确认已审批的调拨单出库")
    
    for tm in transfer.materials:
        material = db.query(Material).filter(
            Material.code == tm.material_code,
            Material.warehouse_id == transfer.from_warehouse_id
        ).first()
        if material:
            material.quantity -= tm.quantity
    
    transfer.status = "out_confirmed"
    transfer.out_confirm_time = datetime.now()
    db.commit()
    db.refresh(transfer)
    return transfer


@router.post("/{transfer_id}/confirm-in", response_model=TransferSchema)
def confirm_in(transfer_id: int, db: Session = Depends(get_db)):
    transfer = db.query(TransferOrder).filter(TransferOrder.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="调拨单不存在")
    if transfer.status != "out_confirmed":
        raise HTTPException(status_code=400, detail="只能确认已出库的调拨单入库")
    
    for tm in transfer.materials:
        material = db.query(Material).filter(
            Material.code == tm.material_code,
            Material.warehouse_id == transfer.to_warehouse_id
        ).first()
        
        if material:
            material.quantity += tm.quantity
        else:
            from_material = db.query(Material).filter(
                Material.code == tm.material_code,
                Material.warehouse_id == transfer.from_warehouse_id
            ).first()
            if from_material:
                new_material = Material(
                    code=from_material.code,
                    name=from_material.name,
                    category=from_material.category,
                    specification=from_material.specification,
                    unit=from_material.unit,
                    unit_price=from_material.unit_price,
                    warehouse_id=transfer.to_warehouse_id,
                    quantity=tm.quantity,
                    safety_stock=from_material.safety_stock,
                    expiry_date=from_material.expiry_date
                )
                db.add(new_material)
    
    transfer.status = "completed"
    transfer.in_confirm_time = datetime.now()
    db.commit()
    db.refresh(transfer)
    return transfer
