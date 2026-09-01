import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.measurement import HistoricalMeasurement
from backend.app.schemas.analytics import ParameterStatsResponse, TimeSeriesPoint
from backend.app.schemas.evaluation import StatisticalSummaryItem
from backend.app.core.config import settings

class StatisticalAnalyzer:
    """
    Statistical Analysis Engine.
    Calculates historical mean, median, standard deviation, percentiles, variance,
    moving averages, trends, and Z-scores to identify abnormal operating conditions.
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
        "power_kw": "power_kw",
        "power": "power_kw",
        "bearing_temperature": "bearing_temperature",
        "bearing_temp": "bearing_temperature",
        "lubrication_pressure": "lubrication_pressure",
        "lube_pressure": "lubrication_pressure",
        "efficiency_pct": "efficiency_pct",
        "efficiency": "efficiency_pct"
    }

    @classmethod
    def get_measurements_series(cls, db: Session, equipment_id: int, param_name: str) -> List[HistoricalMeasurement]:
        col_name = cls.PARAM_FIELD_MAP.get(param_name.lower())
        if not col_name:
            return []
        
        records = db.query(HistoricalMeasurement).filter(
            HistoricalMeasurement.equipment_id == equipment_id
        ).order_by(HistoricalMeasurement.timestamp.asc()).all()
        
        return [r for r in records if getattr(r, col_name, None) is not None]

    @classmethod
    def compute_stats_for_parameter(
        cls,
        db: Session,
        equipment_id: int,
        param_name: str,
        unit: str = ""
    ) -> Optional[ParameterStatsResponse]:
        records = cls.get_measurements_series(db, equipment_id, param_name)
        col_name = cls.PARAM_FIELD_MAP.get(param_name.lower())
        if not col_name or len(records) < 3:
            return None

        values = [float(getattr(r, col_name)) for r in records]
        arr = np.array(values)

        mean_val = float(np.mean(arr))
        median_val = float(np.median(arr))
        std_val = float(np.std(arr, ddof=1)) if len(arr) > 1 else 0.0
        var_val = float(np.var(arr, ddof=1)) if len(arr) > 1 else 0.0
        min_val = float(np.min(arr))
        max_val = float(np.max(arr))
        p50 = float(np.percentile(arr, 50))
        p90 = float(np.percentile(arr, 90))
        p95 = float(np.percentile(arr, 95))
        p99 = float(np.percentile(arr, 99))

        # Determine Trend via linear regression slope of last 30 points
        trend = "STABLE"
        if len(arr) >= 5:
            recent = arr[-30:] if len(arr) >= 30 else arr
            x = np.arange(len(recent))
            slope, _ = np.polyfit(x, recent, 1)
            if slope > (0.02 * (std_val if std_val > 0 else 1.0)):
                trend = "INCREASING"
            elif slope < (-0.02 * (std_val if std_val > 0 else 1.0)):
                trend = "DECREASING"

        # Moving average for time series (window=5)
        window = 5
        moving_avgs = np.convolve(arr, np.ones(window)/window, mode='valid')
        pad_size = len(arr) - len(moving_avgs)
        padded_ma = [None] * pad_size + [round(float(v), 2) for v in moving_avgs]

        time_series: List[TimeSeriesPoint] = []
        for i, r in enumerate(records):
            time_series.append(TimeSeriesPoint(
                timestamp=r.timestamp,
                value=round(float(getattr(r, col_name)), 2),
                is_anomaly=bool(r.is_anomaly),
                failure_occurred=bool(r.failure_occurred),
                moving_avg=padded_ma[i]
            ))

        return ParameterStatsResponse(
            equipment_code="",
            equipment_type="",
            parameter=param_name,
            unit=unit,
            sample_size=len(arr),
            mean=round(mean_val, 2),
            median=round(median_val, 2),
            std_dev=round(std_val, 2),
            variance=round(var_val, 2),
            min_value=round(min_val, 2),
            max_value=round(max_val, 2),
            p50=round(p50, 2),
            p90=round(p90, 2),
            p95=round(p95, 2),
            p99=round(p99, 2),
            trend=trend,
            is_insufficient_data=(len(arr) < settings.MIN_SAMPLE_SIZE_FOR_PROBABILITY),
            time_series=time_series
        )

    @classmethod
    def evaluate_request_parameters(
        cls,
        db: Session,
        equipment_id: int,
        parameters: Dict[str, float]
    ) -> List[StatisticalSummaryItem]:
        summaries: List[StatisticalSummaryItem] = []
        
        for param, val in parameters.items():
            col_name = cls.PARAM_FIELD_MAP.get(param.lower())
            if not col_name:
                continue
            
            records = cls.get_measurements_series(db, equipment_id, param)
            if len(records) < 3:
                continue
            
            values = [float(getattr(r, col_name)) for r in records]
            arr = np.array(values)
            mean_val = float(np.mean(arr))
            std_val = float(np.std(arr, ddof=1)) if len(arr) > 1 else 0.001
            median_val = float(np.median(arr))
            p95 = float(np.percentile(arr, 95))
            min_val = float(np.min(arr))
            max_val = float(np.max(arr))

            # Z-Score Calculation: Z = (x - mean) / std_dev
            z_score = 0.0
            if std_val > 1e-6:
                z_score = (val - mean_val) / std_val

            is_abnormal = abs(z_score) >= 2.0 or val > p95

            summaries.append(StatisticalSummaryItem(
                parameter=param,
                current_value=round(val, 2),
                historical_mean=round(mean_val, 2),
                historical_median=round(median_val, 2),
                historical_std_dev=round(std_val, 2),
                p95=round(p95, 2),
                historical_min=round(min_val, 2),
                historical_max=round(max_val, 2),
                z_score=round(z_score, 2),
                is_abnormal=is_abnormal
            ))

        return summaries
