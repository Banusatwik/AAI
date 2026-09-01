import datetime
import random
import numpy as np
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.models import (
    Equipment, Policy, PolicyVersion, PolicyClause, PolicyThreshold,
    RiskScoringRule, HistoricalMeasurement, PolicyGap, User, AuditLog
)

def seed_database(db: Session):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Check if database is already seeded
    if db.query(Equipment).count() > 0:
        print("[SEED] Database already contains equipment data. Skipping initial seed.")
        return

    print("[SEED] Seeding industrial equipment...")
    
    # 1. Equipment
    equipments = [
        Equipment(
            code="P-101",
            name="Primary Feed Centrifugal Pump",
            equipment_type="Centrifugal Pump",
            model_number="Sulzer OH2-150-330",
            location="Plant Section 4 - Hydrocracker Unit",
            power_kw=90.0,
            rated_speed_rpm=2950.0,
            status="OPERATIONAL"
        ),
        Equipment(
            code="P-102",
            name="Secondary Booster Pump",
            equipment_type="Centrifugal Pump",
            model_number="Flowserve Mark 3 ANSI",
            location="Plant Section 2 - Distillation Area",
            power_kw=75.0,
            rated_speed_rpm=2900.0,
            status="OPERATIONAL"
        ),
        Equipment(
            code="C-201",
            name="Hydrogen Recycled Gas Compressor",
            equipment_type="Reciprocating Compressor",
            model_number="Dresser-Rand HOS-4",
            location="Plant Section 5 - Hydrogen Reformer",
            power_kw=450.0,
            rated_speed_rpm=1780.0,
            status="OPERATIONAL"
        ),
        Equipment(
            code="C-202",
            name="Syngas Compression Train Unit",
            equipment_type="Reciprocating Compressor",
            model_number="Ariel JGK/4",
            location="Plant Section 3 - Synthesis Loop",
            power_kw=520.0,
            rated_speed_rpm=1800.0,
            status="MAINTENANCE"
        ),
        Equipment(
            code="T-301",
            name="High-Pressure Cogeneration Gas Turbine",
            equipment_type="Gas Turbine",
            model_number="Solar Taurus 60",
            location="Plant Power House - Unit A",
            power_kw=5200.0,
            rated_speed_rpm=6000.0,
            status="OPERATIONAL"
        ),
    ]
    for eq in equipments:
        db.add(eq)
    db.commit()
    for eq in equipments:
        db.refresh(eq)

    print("[SEED] Seeding policies and versions...")
    
    # 2. Safety Policies
    # Centrifugal Pump Policy with v1.0 and v2.0
    pump_policy = Policy(
        code="MECH-PUMP-001",
        name="Centrifugal Pump Operational Safety & Vibration Policy",
        equipment_type="Centrifugal Pump",
        owner="Mechanical Reliability & Safety Team",
        description="Defines mandatory hard operating boundaries, vibration criteria (ISO 10816-3), and thermal thresholds for continuous service pumps."
    )
    db.add(pump_policy)
    db.commit()
    db.refresh(pump_policy)

    # Pump Policy Version 1.0 (Historical / Inactive)
    pv1_pump = PolicyVersion(
        policy_id=pump_policy.id,
        version="1.0",
        is_active=False,
        effective_date=datetime.datetime(2024, 1, 1),
        expiration_date=datetime.datetime(2026, 6, 30),
        change_summary="Initial baseline operating limits (Max Vibration 5.0 mm/s, Max RPM 3000)."
    )
    db.add(pv1_pump)
    db.commit()
    db.refresh(pv1_pump)

    # v1.0 Thresholds
    db.add_all([
        PolicyThreshold(policy_version_id=pv1_pump.id, parameter="vibration", unit="mm/s", min_val=0.0, max_val=5.0, normal_min=0.0, normal_max=4.0, warning_val=4.0, critical_val=4.8, is_mandatory=True, clause_reference="4.1.1"),
        PolicyThreshold(policy_version_id=pv1_pump.id, parameter="rpm", unit="RPM", min_val=1500.0, max_val=3000.0, normal_min=2000.0, normal_max=2900.0, warning_val=2900.0, critical_val=2980.0, is_mandatory=True, clause_reference="4.1.2"),
        PolicyThreshold(policy_version_id=pv1_pump.id, parameter="bearing_temperature", unit="°C", min_val=10.0, max_val=85.0, normal_min=20.0, normal_max=75.0, warning_val=75.0, critical_val=82.0, is_mandatory=True, clause_reference="4.1.3"),
    ])

    # Pump Policy Version 2.0 (Active)
    pv2_pump = PolicyVersion(
        policy_id=pump_policy.id,
        version="2.0",
        is_active=True,
        effective_date=datetime.datetime(2026, 7, 1),
        expiration_date=None,
        change_summary="Tightened maximum vibration threshold to 4.5 mm/s and max continuous speed to 2850 RPM in accordance with updated API 610 12th Ed."
    )
    db.add(pv2_pump)
    db.commit()
    db.refresh(pv2_pump)

    # v2.0 Clauses
    db.add_all([
        PolicyClause(policy_version_id=pv2_pump.id, clause_number="4.2.1", title="Maximum Allowable Vibration Velocity (ISO 10816-3 Zone C/D Boundary)", text_content="Overall RMS vibration velocity on bearing housings must not exceed 4.5 mm/s under any continuous operating regime. Warning advisory is issued at 3.5 mm/s.", is_mandatory=True),
        PolicyClause(policy_version_id=pv2_pump.id, clause_number="4.2.2", title="Shaft Speed Limitations", text_content="Maximum continuous operational shaft speed is capped at 2850 RPM. Speeds exceeding 2850 RPM pose critical fatigue risk to mechanical seals and impeller geometry.", is_mandatory=True),
        PolicyClause(policy_version_id=pv2_pump.id, clause_number="4.2.3", title="Hydrodynamic Bearing Thermal Limits", text_content="Bearing shell temperatures must remain below 80.0°C. Warning alarm triggers at 72.0°C. Excursions above 80°C result in lubricant film collapse.", is_mandatory=True),
        PolicyClause(policy_version_id=pv2_pump.id, clause_number="4.2.4", title="Discharge Pressure & Hydraulic Flow Stability", text_content="Discharge pressure must not exceed 15.0 bar. Operating flow rate must remain between minimum continuous stable flow (60 m³/h) and maximum rated flow (140 m³/h) to prevent cavitation.", is_mandatory=True),
    ])

    # v2.0 Thresholds (Hard Limits & Warning Bands)
    db.add_all([
        PolicyThreshold(policy_version_id=pv2_pump.id, parameter="vibration", unit="mm/s", min_val=0.0, max_val=4.5, normal_min=0.0, normal_max=3.5, warning_val=3.5, critical_val=4.2, is_mandatory=True, clause_reference="4.2.1", description="API 610 Bearing housing RMS vibration velocity"),
        PolicyThreshold(policy_version_id=pv2_pump.id, parameter="rpm", unit="RPM", min_val=1800.0, max_val=2850.0, normal_min=2200.0, normal_max=2750.0, warning_val=2750.0, critical_val=2820.0, is_mandatory=True, clause_reference="4.2.2", description="Maximum continuous shaft rotational speed"),
        PolicyThreshold(policy_version_id=pv2_pump.id, parameter="bearing_temperature", unit="°C", min_val=15.0, max_val=80.0, normal_min=30.0, normal_max=70.0, warning_val=72.0, critical_val=77.0, is_mandatory=True, clause_reference="4.2.3", description="Journal and thrust bearing metal temperature"),
        PolicyThreshold(policy_version_id=pv2_pump.id, parameter="temperature", unit="°C", min_val=15.0, max_val=85.0, normal_min=30.0, normal_max=70.0, warning_val=75.0, critical_val=80.0, is_mandatory=False, clause_reference="4.2.3", description="General fluid / casing temperature"),
        PolicyThreshold(policy_version_id=pv2_pump.id, parameter="pressure", unit="bar", min_val=2.0, max_val=15.0, normal_min=8.0, normal_max=13.5, warning_val=13.5, critical_val=14.5, is_mandatory=True, clause_reference="4.2.4", description="Pump discharge flange hydraulic pressure"),
        PolicyThreshold(policy_version_id=pv2_pump.id, parameter="flow_rate", unit="m³/h", min_val=60.0, max_val=140.0, normal_min=80.0, normal_max=130.0, warning_val=132.0, critical_val=138.0, is_mandatory=True, clause_reference="4.2.4", description="Process liquid volumetric flow rate"),
        PolicyThreshold(policy_version_id=pv2_pump.id, parameter="power_kw", unit="kW", min_val=10.0, max_val=95.0, normal_min=40.0, normal_max=82.0, warning_val=85.0, critical_val=92.0, is_mandatory=False, clause_reference="4.2.4", description="Motor electrical power draw"),
    ])

    # Reciprocating Compressor Policy
    comp_policy = Policy(
        code="MECH-COMP-002",
        name="Reciprocating Compressor Mechanical Safety Standard",
        equipment_type="Reciprocating Compressor",
        owner="Compressor Reliability & Integrity Section",
        description="Operational limits for high-pressure reciprocating gas compression units."
    )
    db.add(comp_policy)
    db.commit()
    db.refresh(comp_policy)

    pv1_comp = PolicyVersion(
        policy_id=comp_policy.id,
        version="1.0",
        is_active=True,
        effective_date=datetime.datetime(2025, 3, 1),
        change_summary="Baseline release for reciprocating hydrogen and syngas compression."
    )
    db.add(pv1_comp)
    db.commit()
    db.refresh(pv1_comp)

    db.add_all([
        PolicyClause(policy_version_id=pv1_comp.id, clause_number="3.1.1", title="Discharge Pressure Envelope", text_content="Maximum allowable working discharge pressure is 45.0 bar to prevent cylinder rupture.", is_mandatory=True),
        PolicyClause(policy_version_id=pv1_comp.id, clause_number="3.1.2", title="Crankcase Lube Oil Pressure", text_content="Minimum forced lubrication pressure must remain above 2.0 bar at all times during operation.", is_mandatory=True),
        PolicyThreshold(policy_version_id=pv1_comp.id, parameter="pressure", unit="bar", min_val=5.0, max_val=45.0, normal_min=15.0, normal_max=38.0, warning_val=40.0, critical_val=43.0, is_mandatory=True, clause_reference="3.1.1"),
        PolicyThreshold(policy_version_id=pv1_comp.id, parameter="lubrication_pressure", unit="bar", min_val=2.0, max_val=8.0, normal_min=3.0, normal_max=6.0, warning_val=2.5, critical_val=2.2, is_mandatory=True, clause_reference="3.1.2"),
        PolicyThreshold(policy_version_id=pv1_comp.id, parameter="vibration", unit="mm/s", min_val=0.0, max_val=6.0, normal_min=0.0, normal_max=4.2, warning_val=4.5, critical_val=5.5, is_mandatory=True, clause_reference="3.1.1"),
        PolicyThreshold(policy_version_id=pv1_comp.id, parameter="rpm", unit="RPM", min_val=800.0, max_val=1800.0, normal_min=1200.0, normal_max=1750.0, warning_val=1760.0, critical_val=1790.0, is_mandatory=True, clause_reference="3.1.1"),
        PolicyThreshold(policy_version_id=pv1_comp.id, parameter="temperature", unit="°C", min_val=10.0, max_val=110.0, normal_min=30.0, normal_max=95.0, warning_val=98.0, critical_val=105.0, is_mandatory=True, clause_reference="3.1.1"),
    ])

    # Gas Turbine Policy
    turb_policy = Policy(
        code="MECH-TURB-003",
        name="Industrial Gas Turbine Operational Safety Policy",
        equipment_type="Gas Turbine",
        owner="Turbomachinery Operations Section",
        description="High-speed rotor dynamics and turbine exhaust temperature containment rules."
    )
    db.add(turb_policy)
    db.commit()
    db.refresh(turb_policy)

    pv1_turb = PolicyVersion(
        policy_id=turb_policy.id,
        version="1.0",
        is_active=True,
        effective_date=datetime.datetime(2025, 6, 1),
        change_summary="Initial operational limit release for Taurus 60 turbine fleet."
    )
    db.add(pv1_turb)
    db.commit()
    db.refresh(pv1_turb)

    db.add_all([
        PolicyClause(policy_version_id=pv1_turb.id, clause_number="5.1.1", title="Rotor Shaft Vibration Limits", text_content="Shaft displacement/velocity vibration must remain below 3.8 mm/s.", is_mandatory=True),
        PolicyClause(policy_version_id=pv1_turb.id, clause_number="5.1.2", title="Exhaust Gas Temperature (EGT)", text_content="Exhaust gas thermocouple average must not exceed 580.0°C.", is_mandatory=True),
        PolicyThreshold(policy_version_id=pv1_turb.id, parameter="rpm", unit="RPM", min_val=3000.0, max_val=6200.0, normal_min=5000.0, normal_max=6000.0, warning_val=6050.0, critical_val=6150.0, is_mandatory=True, clause_reference="5.1.1"),
        PolicyThreshold(policy_version_id=pv1_turb.id, parameter="vibration", unit="mm/s", min_val=0.0, max_val=3.8, normal_min=0.0, normal_max=2.8, warning_val=3.0, critical_val=3.5, is_mandatory=True, clause_reference="5.1.1"),
        PolicyThreshold(policy_version_id=pv1_turb.id, parameter="temperature", unit="°C", min_val=20.0, max_val=580.0, normal_min=300.0, normal_max=540.0, warning_val=550.0, critical_val=570.0, is_mandatory=True, clause_reference="5.1.2"),
        PolicyThreshold(policy_version_id=pv1_turb.id, parameter="power_kw", unit="kW", min_val=500.0, max_val=5500.0, normal_min=2000.0, normal_max=5200.0, warning_val=5300.0, critical_val=5450.0, is_mandatory=False, clause_reference="5.1.2"),
    ])
    db.commit()

    print("[SEED] Seeding configurable risk scoring rules...")
    
    # 3. Configurable Risk Scoring Rules in DB
    rules = [
        RiskScoringRule(rule_code="RULE-VIB-WARN", parameter="vibration", condition="warning_threshold_exceeded", threshold_value=None, score_points=20.0, category="VIBRATION", description="Vibration exceeds warning threshold (+20 pts)"),
        RiskScoringRule(rule_code="RULE-VIB-CRIT", parameter="vibration", condition="critical_threshold_exceeded", threshold_value=None, score_points=40.0, category="VIBRATION", description="Vibration reaches critical threshold (+40 pts)"),
        RiskScoringRule(rule_code="RULE-BEARING-WARN", parameter="bearing_temperature", condition="warning_threshold_exceeded", threshold_value=None, score_points=20.0, category="THERMAL", description="Bearing temperature exceeds warning limit (+20 pts)"),
        RiskScoringRule(rule_code="RULE-BEARING-CRIT", parameter="bearing_temperature", condition="critical_threshold_exceeded", threshold_value=None, score_points=35.0, category="THERMAL", description="Bearing temperature reaches critical limit (+35 pts)"),
        RiskScoringRule(rule_code="RULE-PRESS-MAX", parameter="pressure", condition="warning_threshold_exceeded", threshold_value=None, score_points=25.0, category="PRESSURE", description="Discharge pressure in warning/excessive band (+25 pts)"),
        RiskScoringRule(rule_code="RULE-PROB-ELEV", parameter="vibration", condition="prob_gte", threshold_value=8.0, score_points=20.0, category="PROBABILITY", description="Historical failure probability >= 8.0% (+20 pts)"),
        RiskScoringRule(rule_code="RULE-PROB-CRIT", parameter="vibration", condition="prob_gte", threshold_value=18.0, score_points=30.0, category="PROBABILITY", description="Historical failure probability >= 18.0% (+30 pts)"),
        RiskScoringRule(rule_code="RULE-ZSCORE-ANOM", parameter="vibration", condition="zscore_gt", threshold_value=2.0, score_points=15.0, category="STATISTICAL", description="Vibration Z-Score > 2.0σ statistical anomaly (+15 pts)"),
        RiskScoringRule(rule_code="RULE-TEMP-ZSCORE", parameter="bearing_temperature", condition="zscore_gt", threshold_value=2.0, score_points=15.0, category="STATISTICAL", description="Bearing temp Z-Score > 2.0σ statistical anomaly (+15 pts)"),
    ]
    db.add_all(rules)
    db.commit()

    print("[SEED] Seeding 600+ realistic historical measurements across 5 assets...")
    
    # 4. 600+ Historical Measurements across assets
    # Base timestamp starting 60 days ago
    start_time = datetime.datetime.utcnow() - datetime.timedelta(days=60)
    measurements = []

    for eq in equipments:
        eq_id = eq.id
        eq_code = eq.code

        # Generate ~120 measurements per equipment (Total: ~600)
        for i in range(130):
            t_stamp = start_time + datetime.timedelta(hours=i*11 + random.randint(0, 3))
            
            # Baseline normal distribution with periodic anomaly spikes
            is_anomaly = False
            failure_occurred = False
            failure_mode = None
            notes = "Routine telemetry scan (Synthetic/Demo data)"

            if eq_code in ["P-101", "P-102"]:
                # Normal centrifugal pump behavior
                rpm = float(np.random.normal(2650.0, 75.0))
                pressure = float(np.random.normal(11.5, 0.8))
                temp = float(np.random.normal(55.0, 4.0))
                bearing_temp = float(np.random.normal(62.0, 3.5))
                vibration = float(np.random.normal(2.6, 0.45))
                flow = float(np.random.normal(115.0, 8.0))
                power = float(np.random.normal(70.0, 4.0))
                eff = float(np.random.normal(84.0, 2.0))
                lube = None

                # Inject ~12% elevated vibration/thermal events and ~4% actual historical failure trips
                rand_event = random.random()
                if rand_event < 0.05:
                    # Failure event: Bearing Seizure / Overheating
                    bearing_temp = float(np.random.uniform(79.0, 86.0))
                    vibration = float(np.random.uniform(4.4, 5.4))
                    failure_occurred = True
                    is_anomaly = True
                    failure_mode = "Bearing Overheating & Seizure"
                    notes = "Emergency shutdown triggered by high bearing temperature and severe vibration."
                elif rand_event < 0.12:
                    # High vibration excursion without trip
                    vibration = float(np.random.uniform(3.8, 4.6))
                    rpm = float(np.random.uniform(2820.0, 2920.0))
                    is_anomaly = True
                    notes = "Transient harmonic resonance during peak throughput."
                elif rand_event < 0.16:
                    # Cavitation excursion
                    flow = float(np.random.uniform(132.0, 142.0))
                    vibration = float(np.random.uniform(3.6, 4.3))
                    pressure = float(np.random.uniform(8.5, 9.5))
                    is_anomaly = True
                    if random.random() < 0.35:
                        failure_occurred = True
                        failure_mode = "Cavitation Impeller Degradation"
                        notes = "Impeller erosion and flow instability failure event."

            elif eq_code in ["C-201", "C-202"]:
                # Compressor baseline
                rpm = float(np.random.normal(1550.0, 60.0))
                pressure = float(np.random.normal(32.0, 2.5))
                temp = float(np.random.normal(78.0, 5.0))
                bearing_temp = float(np.random.normal(68.0, 4.0))
                vibration = float(np.random.normal(3.2, 0.5))
                flow = float(np.random.normal(2400.0, 150.0))
                power = float(np.random.normal(380.0, 20.0))
                eff = float(np.random.normal(81.0, 2.5))
                lube = float(np.random.normal(4.2, 0.4))

                rand_event = random.random()
                if rand_event < 0.05:
                    failure_occurred = True
                    is_anomaly = True
                    lube = float(np.random.uniform(1.6, 1.9))
                    vibration = float(np.random.uniform(5.5, 6.5))
                    failure_mode = "Lube Oil Pressure Drop Trip"
                    notes = "Lube pump failure caused trip."

            else: # T-301 Turbine
                rpm = float(np.random.normal(5600.0, 120.0))
                pressure = float(np.random.normal(18.0, 1.0))
                temp = float(np.random.normal(490.0, 20.0))
                bearing_temp = float(np.random.normal(72.0, 3.0))
                vibration = float(np.random.normal(2.1, 0.3))
                flow = float(np.random.normal(8500.0, 300.0))
                power = float(np.random.normal(4600.0, 200.0))
                eff = float(np.random.normal(36.0, 1.5))
                lube = float(np.random.normal(5.0, 0.3))

                rand_event = random.random()
                if rand_event < 0.04:
                    failure_occurred = True
                    is_anomaly = True
                    temp = float(np.random.uniform(575.0, 595.0))
                    vibration = float(np.random.uniform(3.6, 4.2))
                    failure_mode = "Exhaust Gas Thermal Excursion Trip"
                    notes = "High EGT spread caused trip."

            measurements.append(HistoricalMeasurement(
                equipment_id=eq_id,
                timestamp=t_stamp,
                rpm=round(rpm, 1) if rpm is not None else None,
                pressure=round(pressure, 2) if pressure is not None else None,
                temperature=round(temp, 1) if temp is not None else None,
                vibration=round(vibration, 2) if vibration is not None else None,
                flow_rate=round(flow, 1) if flow is not None else None,
                power_kw=round(power, 1) if power is not None else None,
                efficiency_pct=round(eff, 1) if eff is not None else None,
                bearing_temperature=round(bearing_temp, 1) if bearing_temp is not None else None,
                lubrication_pressure=round(lube, 2) if lube is not None else None,
                is_anomaly=is_anomaly,
                failure_occurred=failure_occurred,
                failure_mode=failure_mode,
                notes=notes
            ))

    db.add_all(measurements)
    db.commit()

    print(f"[SEED] Successfully added {len(measurements)} historical mechanical records.")

    # 5. Pre-seed a known Policy Gap for shaft_misalignment
    gap = PolicyGap(
        parameter="shaft_misalignment",
        equipment_type="Centrifugal Pump",
        equipment_code="P-101",
        operation="Run",
        occurrence_count=4,
        status="OPEN",
        owner="Mechanical Safety Team",
        resolution_notes="Awaiting engineering committee formulation of laser alignment tolerance standards."
    )
    db.add(gap)

    # 6. Pre-seed Default Users
    users = [
        User(username="operator_john", email="john.op@plant.local", full_name="John Doe (Lead Operator)", role="OPERATOR"),
        User(username="safety_dr_sarah", email="sarah.safety@plant.local", full_name="Dr. Sarah Jenkins (Chief Safety Engineer)", role="SAFETY_ENGINEER"),
        User(username="admin_alex", email="alex.admin@plant.local", full_name="Alex Rivera (System Administrator)", role="ADMIN"),
    ]
    db.add_all(users)
    db.commit()

    print("[SEED] Database seeding complete!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
