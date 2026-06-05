from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routers import warehouses, materials, inventory, transfers, alerts, statistics

Base.metadata.create_all(bind=engine)

app = FastAPI(title="应急物资调配管理平台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(warehouses.router)
app.include_router(materials.router)
app.include_router(inventory.router)
app.include_router(transfers.router)
app.include_router(alerts.router)
app.include_router(statistics.router)


@app.get("/")
def root():
    return {"message": "应急物资调配管理平台 API"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
