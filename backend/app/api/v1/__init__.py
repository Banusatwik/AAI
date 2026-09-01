from fastapi import APIRouter
from backend.app.api.v1.evaluate import router as evaluate_router
from backend.app.api.v1.equipment import router as equipment_router
from backend.app.api.v1.policies import router as policies_router
from backend.app.api.v1.gaps import router as gaps_router
from backend.app.api.v1.analytics import router as analytics_router
from backend.app.api.v1.optimization import router as optimization_router
from backend.app.api.v1.dashboard import router as dashboard_router
from backend.app.api.v1.audit import router as audit_router

api_router = APIRouter()
api_router.include_router(evaluate_router)
api_router.include_router(equipment_router)
api_router.include_router(policies_router)
api_router.include_router(gaps_router)
api_router.include_router(analytics_router)
api_router.include_router(optimization_router)
api_router.include_router(dashboard_router)
api_router.include_router(audit_router)
