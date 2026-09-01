import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.api.v1 import api_router
from backend.app.seed import seed_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("MechanicalSafetyApp")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Mechanical Safety Decision System database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        logger.error(f"Error during database initialization/seeding: {e}")
    finally:
        db.close()
    logger.info("Mechanical Safety Decision System backend ready.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Agentic AI Mechanical Safety & Operations Decision System with Deterministic Policy Enforcement",
    lifespan=lifespan
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API endpoints under /api
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": "Mechanical Safety & Operations Decision System",
        "status": "OPERATIONAL",
        "version": settings.VERSION,
        "api_docs": "/docs",
        "endpoints": {
            "evaluate": "/api/evaluate",
            "equipment": "/api/equipment",
            "policies": "/api/policies",
            "gaps": "/api/gaps",
            "dashboard": "/api/dashboard",
            "audit_logs": "/api/audit-logs"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
