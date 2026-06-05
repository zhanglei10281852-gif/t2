from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.alert import Alert
from app.models.material import Material
from app.models.warehouse import Warehouse
from app.schemas.alert import Alert as AlertSchema, AlertHandle

router = APIRouter(prefix="/api/alerts", tags=["预警管理"])


def check_and_create_alerts(db: Session):
    today = datetime.now().date()
    
    db.query(Alert).filter(Alert.is_handled == False).delete()
    
    materials = db.query(Material).all()
    
    for material in materials:
        warehouse = db.query(Warehouse).filter(Warehouse.id == material.warehouse_id).first()
        warehouse_name = warehouse.name if warehouse else "未知"
        
        if material.quantity < material.safety_stock:
            alert = Alert(
                alert_type="stock_low",
                severity="warning",
                material_id=material.id,
                material_code=material.code,
                material_name=material.name,
                warehouse_id=material.warehouse_id,
                warehouse_name=warehouse_name,
                message=f"库存低于安全库存量，当前: {material.quantity}，安全库存: {material.safety_stock}",
                current_quantity=material.quantity,
                safety_stock=material.safety_stock
            )
            db.add(alert)
        
        if material.expiry_date:
            days_to_expiry = (material.expiry_date - today).days
            
            if days_to_expiry < 0:
                alert = Alert(
                    alert_type="expired",
                    severity="danger",
                    material_id=material.id,
                    material_code=material.code,
                    material_name=material.name,
                    warehouse_id=material.warehouse_id,
                    warehouse_name=warehouse_name,
                    message=f"物资已过期，过期日期: {material.expiry_date}",
                    expiry_date=material.expiry_date
                )
                db.add(alert)
            elif days_to_expiry <= 90:
                alert = Alert(
                    alert_type="expiring_soon",
                    severity="caution",
                    material_id=material.id,
                    material_code=material.code,
                    material_name=material.name,
                    warehouse_id=material.warehouse_id,
                    warehouse_name=warehouse_name,
                    message=f"物资将在{days_to_expiry}天后过期，过期日期: {material.expiry_date}",
                    expiry_date=material.expiry_date
                )
                db.add(alert)
    
    db.commit()


@router.get("/", response_model=List[AlertSchema])
def get_alerts(
    is_handled: Optional[bool] = None,
    severity: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    check_and_create_alerts(db)
    
    query = db.query(Alert)
    if is_handled is not None:
        query = query.filter(Alert.is_handled == is_handled)
    if severity:
        query = query.filter(Alert.severity == severity)
    
    severity_order = {"danger": 0, "warning": 1, "caution": 2}
    alerts = query.all()
    alerts.sort(key=lambda x: (severity_order.get(x.severity, 99), x.created_at))
    
    return alerts[skip:skip+limit]


@router.get("/count")
def get_unhandled_alerts_count(db: Session = Depends(get_db)):
    check_and_create_alerts(db)
    count = db.query(Alert).filter(Alert.is_handled == False).count()
    return {"count": count}


@router.post("/{alert_id}/handle", response_model=AlertSchema)
def handle_alert(alert_id: int, data: AlertHandle, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="预警不存在")
    
    alert.is_handled = True
    alert.handle_result = data.handle_result
    alert.handled_at = datetime.now()
    db.commit()
    db.refresh(alert)
    return alert
