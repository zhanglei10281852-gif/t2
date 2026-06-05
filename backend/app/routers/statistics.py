from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.material import Material
from app.models.warehouse import Warehouse
from app.models.inventory import InventoryRecord
from app.models.transfer import TransferOrder

router = APIRouter(prefix="/api/statistics", tags=["统计接口"])


@router.get("/warehouse-values")
def get_warehouse_values(db: Session = Depends(get_db)):
    warehouses = db.query(Warehouse).all()
    result = []
    
    for wh in warehouses:
        materials = db.query(Material).filter(Material.warehouse_id == wh.id).all()
        total_value = sum(m.quantity * m.unit_price for m in materials)
        used_capacity = sum(m.quantity * 0.01 for m in materials)
        
        result.append({
            "warehouse_id": wh.id,
            "warehouse_name": wh.name,
            "total_value": total_value,
            "used_capacity": used_capacity,
            "total_capacity": wh.capacity,
            "usage_rate": (used_capacity / wh.capacity * 100) if wh.capacity > 0 else 0
        })
    
    return result


@router.get("/category-distribution")
def get_category_distribution(db: Session = Depends(get_db)):
    categories = db.query(
        Material.category,
        func.sum(Material.quantity).label('total_quantity')
    ).group_by(Material.category).all()
    
    return [
        {"category": cat, "quantity": qty or 0}
        for cat, qty in categories
    ]


@router.get("/monthly-flow")
def get_monthly_flow(db: Session = Depends(get_db)):
    today = datetime.now()
    result = []
    
    for i in range(6):
        month_date = today - timedelta(days=i*30)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0)
        if i == 0:
            month_end = today
        else:
            next_month = month_date.replace(day=28) + timedelta(days=4)
            month_end = next_month - timedelta(days=next_month.day)
        
        in_records = db.query(InventoryRecord).filter(
            InventoryRecord.record_type == "in",
            InventoryRecord.created_at >= month_start,
            InventoryRecord.created_at <= month_end
        ).all()
        
        out_records = db.query(InventoryRecord).filter(
            InventoryRecord.record_type == "out",
            InventoryRecord.created_at >= month_start,
            InventoryRecord.created_at <= month_end
        ).all()
        
        total_in = sum(r.quantity for r in in_records)
        total_out = sum(r.quantity for r in out_records)
        
        result.append({
            "month": month_date.strftime("%Y-%m"),
            "total_in": total_in,
            "total_out": total_out
        })
    
    return result[::-1]


@router.get("/expiring-materials")
def get_expiring_materials(db: Session = Depends(get_db)):
    today = datetime.now().date()
    ninety_days_later = today + timedelta(days=90)
    
    materials = db.query(Material).filter(
        Material.expiry_date != None,
        Material.expiry_date <= ninety_days_later
    ).all()
    
    return [
        {
            "id": m.id,
            "code": m.code,
            "name": m.name,
            "category": m.category,
            "quantity": m.quantity,
            "expiry_date": m.expiry_date,
            "days_to_expiry": (m.expiry_date - today).days
        }
        for m in materials
    ]


@router.get("/transfer-completion-rate")
def get_transfer_completion_rate(db: Session = Depends(get_db)):
    total = db.query(TransferOrder).count()
    completed = db.query(TransferOrder).filter(
        TransferOrder.status == "completed"
    ).count()
    
    return {
        "total_transfers": total,
        "completed_transfers": completed,
        "completion_rate": (completed / total * 100) if total > 0 else 0
    }


@router.get("/total-value")
def get_total_value(db: Session = Depends(get_db)):
    materials = db.query(Material).all()
    total_value = sum(m.quantity * m.unit_price for m in materials)
    return {"total_value": total_value}
