from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.equipment import Equipment
from backend.app.schemas.analytics import ParameterStatsResponse, ParameterProbabilityResponse
from backend.app.services.deterministic_engine.statistical_analyzer import StatisticalAnalyzer
from backend.app.services.deterministic_engine.probability_analyzer import ProbabilityAnalyzer

router = APIRouter(prefix="", tags=["Analytics"])

def resolve_equipment(db: Session, equipment_id_or_code: str) -> Equipment:
    if equipment_id_or_code.isdigit():
        eq = db.query(Equipment).filter(Equipment.id == int(equipment_id_or_code)).first()
    else:
        eq = db.query(Equipment).filter(
            (Equipment.code == equipment_id_or_code) | (Equipment.code == equipment_id_or_code.upper())
        ).first()

    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return eq

PARAM_UNITS = {
    "vibration": "mm/s",
    "rpm": "RPM",
    "pressure": "bar",
    "temperature": "°C",
    "bearing_temperature": "°C",
    "flow_rate": "m³/h",
    "power_kw": "kW",
    "efficiency_pct": "%",
    "lubrication_pressure": "bar"
}

@router.get("/statistics/{equipment_id_or_code}/{parameter}", response_model=ParameterStatsResponse)
def get_parameter_statistics(
    equipment_id_or_code: str,
    parameter: str,
    db: Session = Depends(get_db)
):
    eq = resolve_equipment(db, equipment_id_or_code)
    unit = PARAM_UNITS.get(parameter.lower(), "")
    stats = StatisticalAnalyzer.compute_stats_for_parameter(db, eq.id, parameter, unit)
    
    if not stats:
        return ParameterStatsResponse(
            equipment_code=eq.code,
            equipment_type=eq.equipment_type,
            parameter=parameter,
            unit=unit,
            sample_size=0,
            mean=0.0,
            median=0.0,
            std_dev=0.0,
            variance=0.0,
            min_value=0.0,
            max_value=0.0,
            p50=0.0,
            p90=0.0,
            p95=0.0,
            p99=0.0,
            trend="STABLE",
            is_insufficient_data=True,
            time_series=[]
        )

    stats.equipment_code = eq.code
    stats.equipment_type = eq.equipment_type
    return stats

@router.get("/probability/{equipment_id_or_code}/{parameter}", response_model=ParameterProbabilityResponse)
def get_parameter_probability(
    equipment_id_or_code: str,
    parameter: str,
    db: Session = Depends(get_db)
):
    eq = resolve_equipment(db, equipment_id_or_code)
    unit = PARAM_UNITS.get(parameter.lower(), "")
    prob_resp = ProbabilityAnalyzer.get_probability_distribution(db, eq.id, eq.code, parameter, unit)
    return prob_resp
