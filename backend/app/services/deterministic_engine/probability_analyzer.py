import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models.measurement import HistoricalMeasurement
from backend.app.schemas.analytics import ParameterProbabilityResponse, ProbabilityBin
from backend.app.schemas.evaluation import ProbabilitySummaryItem
from backend.app.core.config import settings

class ProbabilityAnalyzer:
    """
    Probability Analysis Engine.
    Estimates empirical failure probabilities based on historical operating records.
    Explicitly flags INSUFFICIENT DATA when sample size is below threshold.
    """

    PARAM_FIELD_MAP = {
        "rpm": "rpm",
        "speed": "rpm",
        "pressure": "pressure",
        "temperature": "temperature",
        "temp": "temperature",
        "vibration": "vibration",
        "vib": "vibration",
        "flow_rate": "flow_rate",
        "flow": "flow_rate",
        "bearing_temperature": "bearing_temperature",
        "bearing_temp": "bearing_temperature",
        "lubrication_pressure": "lubrication_pressure"
    }

    @classmethod
    def estimate_probability_for_value(
        cls,
        db: Session,
        equipment_id: int,
        param_name: str,
        value: float
    ) -> ProbabilitySummaryItem:
        col_name = cls.PARAM_FIELD_MAP.get(param_name.lower())
        if not col_name:
            return ProbabilitySummaryItem(
                parameter=param_name,
                operating_value=value,
                estimated_failure_probability_pct=None,
                sample_size=0,
                historical_failures=0,
                is_insufficient_data=True,
                status_label="INSUFFICIENT_DATA"
            )

        # Retrieve all historical records
        records = db.query(HistoricalMeasurement).filter(
            HistoricalMeasurement.equipment_id == equipment_id
        ).all()

        valid_records = [r for r in records if getattr(r, col_name, None) is not None]
        total_sample = len(valid_records)

        if total_sample < settings.MIN_SAMPLE_SIZE_FOR_PROBABILITY:
            return ProbabilitySummaryItem(
                parameter=param_name,
                operating_value=value,
                estimated_failure_probability_pct=None,
                sample_size=total_sample,
                historical_failures=0,
                is_insufficient_data=True,
                status_label="INSUFFICIENT_DATA"
            )

        # Filter records in the neighborhood of the requested value (e.g. >= 0.9 * value or matching operational band)
        # Specifically, for parameters where higher is riskier (vibration, temp, pressure, rpm):
        # We look at historical records where parameter >= 0.85 * value
        band_records = [r for r in valid_records if float(getattr(r, col_name)) >= 0.85 * value]
        band_sample = len(band_records)

        # If localized band has too few samples, use a wider band or check overall risk in proximity
        if band_sample < 5:
            # Fall back to percentile-based neighborhood (+/- 15%)
            band_records = [
                r for r in valid_records 
                if 0.80 * value <= float(getattr(r, col_name)) <= 1.20 * value
            ]
            band_sample = len(band_records)

        if band_sample < 5:
            # Check if operating value is significantly above historical maximum
            max_hist = max(float(getattr(r, col_name)) for r in valid_records)
            if value > max_hist:
                # Extrapolated risk based on high-end records
                top_records = sorted(valid_records, key=lambda r: float(getattr(r, col_name)), reverse=True)[:15]
                top_failures = sum(1 for r in top_records if r.failure_occurred)
                prob = (top_failures / len(top_records)) * 100.0
                return ProbabilitySummaryItem(
                    parameter=param_name,
                    operating_value=value,
                    estimated_failure_probability_pct=round(prob, 1),
                    sample_size=len(top_records),
                    historical_failures=top_failures,
                    is_insufficient_data=False,
                    status_label="HISTORICAL_ESTIMATE (EXTRAPOLATED)"
                )
            else:
                return ProbabilitySummaryItem(
                    parameter=param_name,
                    operating_value=value,
                    estimated_failure_probability_pct=None,
                    sample_size=band_sample,
                    historical_failures=0,
                    is_insufficient_data=True,
                    status_label="INSUFFICIENT_DATA"
                )

        failures = sum(1 for r in band_records if r.failure_occurred)
        prob_pct = (failures / band_sample) * 100.0

        return ProbabilitySummaryItem(
            parameter=param_name,
            operating_value=value,
            estimated_failure_probability_pct=round(prob_pct, 1),
            sample_size=band_sample,
            historical_failures=failures,
            is_insufficient_data=False,
            status_label="HISTORICAL_ESTIMATE"
        )

    @classmethod
    def get_probability_distribution(
        cls,
        db: Session,
        equipment_id: int,
        equipment_code: str,
        param_name: str,
        unit: str = ""
    ) -> ParameterProbabilityResponse:
        col_name = cls.PARAM_FIELD_MAP.get(param_name.lower())
        if not col_name:
            return ParameterProbabilityResponse(
                equipment_code=equipment_code,
                parameter=param_name,
                unit=unit,
                total_observations=0,
                total_failures=0,
                overall_failure_rate_pct=0.0,
                is_insufficient_data=True,
                data_status_message="Unknown parameter or no data available.",
                bins=[]
            )

        records = db.query(HistoricalMeasurement).filter(
            HistoricalMeasurement.equipment_id == equipment_id
        ).all()

        valid_records = [r for r in records if getattr(r, col_name, None) is not None]
        total_obs = len(valid_records)
        total_failures = sum(1 for r in valid_records if r.failure_occurred)

        if total_obs < settings.MIN_SAMPLE_SIZE_FOR_PROBABILITY:
            return ParameterProbabilityResponse(
                equipment_code=equipment_code,
                parameter=param_name,
                unit=unit,
                total_observations=total_obs,
                total_failures=total_failures,
                overall_failure_rate_pct=0.0,
                is_insufficient_data=True,
                data_status_message="INSUFFICIENT DATA: Minimum sample size not met.",
                bins=[]
            )

        values = np.array([float(getattr(r, col_name)) for r in valid_records])
        min_v, max_v = float(np.min(values)), float(np.max(values))

        # Create 4-5 bins (e.g. Normal, Moderate, High, Critical)
        bin_edges = np.linspace(min_v, max_v + 1e-5, 5)
        bins_out: List[ProbabilityBin] = []

        labels = ["Low / Baseline", "Moderate Operating", "High Operating", "Critical / High-Stress"]

        for i in range(len(bin_edges) - 1):
            low = bin_edges[i]
            high = bin_edges[i+1]
            
            matched = [
                r for r in valid_records 
                if (low <= float(getattr(r, col_name)) < high) or (i == len(bin_edges)-2 and float(getattr(r, col_name)) >= low)
            ]
            count = len(matched)
            fails = sum(1 for r in matched if r.failure_occurred)
            prob = (fails / count * 100.0) if count > 0 else 0.0

            status = "NORMAL"
            if prob > 20.0:
                status = "CRITICAL"
            elif prob > 10.0:
                status = "HIGH_RISK"
            elif prob > 4.0:
                status = "ELEVATED"

            bins_out.append(ProbabilityBin(
                range_label=f"{labels[i]} ({round(low, 1)} - {round(high, 1)} {unit})",
                min_val=round(low, 2),
                max_val=round(high, 2),
                total_observations=count,
                failure_events=fails,
                failure_probability_pct=round(prob, 1),
                status=status if count >= 3 else "INSUFFICIENT_DATA"
            ))

        overall_rate = (total_failures / total_obs) * 100.0 if total_obs > 0 else 0.0

        return ParameterProbabilityResponse(
            equipment_code=equipment_code,
            parameter=param_name,
            unit=unit,
            total_observations=total_obs,
            total_failures=total_failures,
            overall_failure_rate_pct=round(overall_rate, 1),
            is_insufficient_data=False,
            data_status_message=None,
            bins=bins_out
        )
