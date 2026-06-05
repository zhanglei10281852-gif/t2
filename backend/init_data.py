from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.warehouse import Warehouse
from app.models.material import Material
from datetime import date, timedelta

Base.metadata.create_all(bind=engine)

WAREHOUSES = [
    {"name": "城东应急仓库", "address": "城东区平安路128号", "manager_name": "张三", "manager_phone": "13800138001", "capacity": 1000.0},
    {"name": "城西应急仓库", "address": "城西区建设街56号", "manager_name": "李四", "manager_phone": "13800138002", "capacity": 800.0},
    {"name": "城南应急仓库", "address": "城南区开发大道200号", "manager_name": "王五", "manager_phone": "13800138003", "capacity": 1200.0},
    {"name": "城北应急仓库", "address": "城北区工业路88号", "manager_name": "赵六", "manager_phone": "13800138004", "capacity": 900.0},
    {"name": "中心应急仓库", "address": "市中心人民广场北侧", "manager_name": "钱七", "manager_phone": "13800138005", "capacity": 1500.0},
]

MATERIALS = [
    {"code": "FX0001", "name": "防汛沙袋", "category": "防汛类", "specification": "50*80cm", "unit": "条", "unit_price": 15.0, "warehouse_id": 1, "quantity": 500, "safety_stock": 200},
    {"code": "FX0002", "name": "雨衣", "category": "防汛类", "specification": "XL码", "unit": "件", "unit_price": 45.0, "warehouse_id": 1, "quantity": 200, "safety_stock": 100},
    {"code": "FX0003", "name": "雨靴", "category": "防汛类", "specification": "42码", "unit": "双", "unit_price": 65.0, "warehouse_id": 1, "quantity": 150, "safety_stock": 80},
    {"code": "KZ0001", "name": "帐篷", "category": "抗震类", "specification": "4*6m", "unit": "顶", "unit_price": 1200.0, "warehouse_id": 2, "quantity": 100, "safety_stock": 50},
    {"code": "KZ0002", "name": "折叠床", "category": "抗震类", "specification": "单人", "unit": "张", "unit_price": 280.0, "warehouse_id": 2, "quantity": 300, "safety_stock": 150},
    {"code": "XF0001", "name": "灭火器", "category": "消防类", "specification": "4kg干粉", "unit": "具", "unit_price": 85.0, "warehouse_id": 3, "quantity": 200, "safety_stock": 100},
    {"code": "XF0002", "name": "消防水带", "category": "消防类", "specification": "65mm*20m", "unit": "条", "unit_price": 120.0, "warehouse_id": 3, "quantity": 100, "safety_stock": 50},
    {"code": "YL0001", "name": "急救箱", "category": "医疗类", "specification": "标准配置", "unit": "个", "unit_price": 350.0, "warehouse_id": 4, "quantity": 150, "safety_stock": 80},
    {"code": "YL0002", "name": "口罩", "category": "医疗类", "specification": "N95", "unit": "只", "unit_price": 2.5, "warehouse_id": 4, "quantity": 5000, "safety_stock": 2000, "expiry_date": date.today() + timedelta(days=60)},
    {"code": "SH0001", "name": "矿泉水", "category": "生活保障类", "specification": "550ml*24瓶", "unit": "箱", "unit_price": 36.0, "warehouse_id": 5, "quantity": 1000, "safety_stock": 500, "expiry_date": date.today() + timedelta(days=180)},
    {"code": "SH0002", "name": "方便面", "category": "生活保障类", "specification": "12桶/箱", "unit": "箱", "unit_price": 48.0, "warehouse_id": 5, "quantity": 800, "safety_stock": 400, "expiry_date": date.today() + timedelta(days=90)},
    {"code": "TX0001", "name": "对讲机", "category": "通信类", "specification": "专业级", "unit": "台", "unit_price": 580.0, "warehouse_id": 5, "quantity": 100, "safety_stock": 50},
]

def init_data():
    db: Session = SessionLocal()
    
    try:
        if db.query(Warehouse).count() == 0:
            for wh in WAREHOUSES:
                db_wh = Warehouse(**wh)
                db.add(db_wh)
            db.commit()
            print("仓库数据初始化完成")
        
        if db.query(Material).count() == 0:
            for mat in MATERIALS:
                db_mat = Material(**mat)
                db.add(db_mat)
            db.commit()
            print("物资数据初始化完成")
        
        print("数据初始化完成")
    except Exception as e:
        print(f"初始化失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_data()
