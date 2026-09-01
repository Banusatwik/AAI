from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from backend.app.models.equipment import Equipment
from backend.app.models.policy import Policy, PolicyVersion
from backend.app.models.measurement import HistoricalMeasurement
from backend.app.schemas.equipment import EquipmentResponse, EquipmentCreate, EquipmentDetailResponse

router = APIRouter(prefix="/equipment", tags=["Equipment"])

@router.get("", response_model=List[EquipmentDetailResponse])
def list_equipment(db: Session = Depends(get_db)):
    equipments = db.query(Equipment).all()
    results = []
    
    for eq in equipments:
        # Find active policy
        policy = db.query(Policy).filter(Policy.equipment_type == eq.equipment_type).first()
        active_ver = None
        if policy:
            active_ver = db.query(PolicyVersion).filter(
                PolicyVersion.policy_id == policy.id,
                PolicyVersion.is_active == True
            ).first()

        # Measurement count & latest telemetry
        meas_count = db.query(HistoricalMeasurement).filter(HistoricalMeasurement.equipment_id == eq.id).count()
        latest_meas = db.query(HistoricalMeasurement).filter(
            HistoricalMeasurement.equipment_id == eq.id
        ).order_by(HistoricalMeasurement.timestamp.desc()).first()

        latest_dict = None
        if latest_meas:
            latest_dict = {
                "rpm": latest_meas.rpm,
                "pressure": latest_meas.pressure,
                "temperature": latest_meas.temperature,
                "vibration": latest_meas.vibration,
                "flow_rate": latest_meas.flow_rate,
                "bearing_temperature": latest_meas.bearing_temperature,
                "power_kw": latest_meas.power_kw,
                "efficiency_pct": latest_meas.efficiency_pct,
                "timestamp": latest_meas.timestamp
            }

        results.append(EquipmentDetailResponse(
            id=eq.id,
            code=eq.code,
            name=eq.name,
            equipment_type=eq.equipment_type,
            model_number=eq.model_number,
            location=eq.location,
            power_kw=eq.power_kw,
            rated_speed_rpm=eq.rated_speed_rpm,
            status=eq.status,
            created_at=eq.created_at,
            active_policy_code=policy.code if policy else None,
            active_policy_version=active_ver.version if active_ver else None,
            measurement_count=meas_count,
            latest_measurements=latest_dict
        ))
    
    return results

@router.get("/{equipment_id_or_code}", response_model=EquipmentDetailResponse)
def get_equipment(equipment_id_or_code: str, db: Session = Depends(get_db)):
    if equipment_id_or_code.isdigit():
        eq = db.query(Equipment).filter(Equipment.id == int(equipment_id_or_code)).first()
    else:
        eq = db.query(Equipment).filter(
            (Equipment.code == equipment_id_or_code) | (Equipment.code == equipment_id_or_code.upper())
        ).first()

    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")

    policy = db.query(Policy).filter(Policy.equipment_type == eq.equipment_type).first()
    active_ver = None
    if policy:
        active_ver = db.query(PolicyVersion).filter(
            PolicyVersion.policy_id == policy.id,
            PolicyVersion.is_active == True
        ).first()

    meas_count = db.query(HistoricalMeasurement).filter(HistoricalMeasurement.equipment_id == eq.id).count()
    latest_meas = db.query(HistoricalMeasurement).filter(
        HistoricalMeasurement.equipment_id == eq.id
    ).order_by(HistoricalMeasurement.timestamp.desc()).first()

    latest_dict = None
    if latest_meas:
        latest_dict = {
            "rpm": latest_meas.rpm,
            "pressure": latest_meas.pressure,
            "temperature": latest_meas.temperature,
            "vibration": latest_meas.vibration,
            "flow_rate": latest_meas.flow_rate,
            "bearing_temperature": latest_meas.bearing_temperature,
            "power_kw": latest_meas.power_kw,
            "efficiency_pct": latest_meas.efficiency_pct,
            "timestamp": latest_meas.timestamp
        }

    return EquipmentDetailResponse(
        id=eq.id,
        code=eq.code,
        name=eq.name,
        equipment_type=eq.equipment_type,
        model_number=eq.model_number,
        location=eq.location,
        power_kw=eq.power_kw,
        rated_speed_rpm=eq.rated_speed_rpm,
        status=eq.status,
        created_at=eq.created_at,
        active_policy_code=policy.code if policy else None,
        active_policy_version=active_ver.version if active_ver else None,
        measurement_count=meas_count,
        latest_measurements=latest_dict
    )

@router.post("", response_model=EquipmentResponse)
def create_equipment(payload: EquipmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Equipment).filter(Equipment.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Equipment code already exists")

    eq = Equipment(
        code=payload.code.upper(),
        name=payload.name,
        equipment_type=payload.equipment_type,
        model_number=payload.model_number,
        location=payload.location,
        power_kw=payload.power_kw,
        rated_speed_rpm=payload.rated_speed_rpm,
        status=payload.status or "OPERATIONAL"
    )
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return eq
