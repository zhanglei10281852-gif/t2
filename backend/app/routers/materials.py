from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.material import Material
from app.models.warehouse import Warehouse
from app.schemas.material import MaterialCreate, MaterialUpdate, Material as MaterialSchema
import csv
import io
from datetime import datetime

router = APIRouter(prefix="/api/materials", tags=["物资台账"])

CATEGORY_CODES = {
    "防汛类": "FX",
    "抗震类": "KZ",
    "消防类": "XF",
    "医疗类": "YL",
    "生活保障类": "SH",
    "通信类": "TX"
}


def generate_material_code(category: str, db: Session) -> str:
    prefix = CATEGORY_CODES.get(category, "QT")
    last_material = db.query(Material).filter(
        Material.code.like(f"{prefix}%")
    ).order_by(Material.code.desc()).first()
    
    if last_material:
        last_num = int(last_material.code[-4:])
        new_num = str(last_num + 1).zfill(4)
    else:
        new_num = "0001"
    
    return f"{prefix}{new_num}"


@router.get("/", response_model=List[MaterialSchema])
def get_materials(
    warehouse_id: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Material)
    if warehouse_id:
        query = query.filter(Material.warehouse_id == warehouse_id)
    if category:
        query = query.filter(Material.category == category)
    if search:
        query = query.filter(Material.name.contains(search))
    return query.offset(skip).limit(limit).all()


@router.get("/{material_id}", response_model=MaterialSchema)
def get_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="物资不存在")
    return material


@router.get("/code/{code}", response_model=MaterialSchema)
def get_material_by_code(code: str, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.code == code).first()
    if not material:
        raise HTTPException(status_code=404, detail="物资不存在")
    return material


@router.post("/", response_model=MaterialSchema)
def create_material(material: MaterialCreate, db: Session = Depends(get_db)):
    code = generate_material_code(material.category, db)
    db_material = Material(code=code, **material.model_dump())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


@router.put("/{material_id}", response_model=MaterialSchema)
def update_material(material_id: int, material: MaterialUpdate, db: Session = Depends(get_db)):
    db_material = db.query(Material).filter(Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="物资不存在")
    update_data = material.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_material, key, value)
    db.commit()
    db.refresh(db_material)
    return db_material


@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    db_material = db.query(Material).filter(Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="物资不存在")
    db.delete(db_material)
    db.commit()
    return {"message": "删除成功"}


@router.post("/import")
def import_materials(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="请上传CSV文件")
    
    content = file.file.read().decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(content))
    
    imported = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):
        try:
            warehouse = db.query(Warehouse).filter(
                Warehouse.name == row['仓库名称']
            ).first()
            if not warehouse:
                errors.append(f"第{row_num}行: 仓库 '{row['仓库名称']}' 不存在")
                continue
            
            expiry_date = None
            if row.get('保质期截止日期'):
                try:
                    expiry_date = datetime.strptime(row['保质期截止日期'], '%Y-%m-%d').date()
                except:
                    pass
            
            material_data = MaterialCreate(
                name=row['名称'],
                category=row['类别'],
                specification=row.get('规格型号', ''),
                unit=row['单位'],
                unit_price=float(row['采购单价']),
                warehouse_id=warehouse.id,
                quantity=int(row.get('库存数量', 0)),
                safety_stock=int(row.get('安全库存量', 0)),
                expiry_date=expiry_date
            )
            
            code = generate_material_code(material_data.category, db)
            db_material = Material(code=code, **material_data.model_dump())
            db.add(db_material)
            imported += 1
        except Exception as e:
            errors.append(f"第{row_num}行: {str(e)}")
    
    db.commit()
    return {"imported": imported, "errors": errors}
