from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.analytics_service import (
    SEVERITY_ORDER,
    TIME_PERIODS,
    build_insights,
    build_kpis,
    distribution,
    monthly,
)
from ..services.data_service import last_updated, total_record_count
from ..services.filter_service import filtered_crimes
from .utils import filter_params

router = APIRouter()


@router.get("/dashboard/overview")
def dashboard_overview(
    params: dict = Depends(filter_params), db: Session = Depends(get_db)
):
    rows = filtered_crimes(db, params)
    return {
        "recordCount": {"filtered": len(rows), "total": total_record_count(db)},
        "demoMode": False,
        "lastUpdated": last_updated(db),
        "kpis": build_kpis(rows, total_record_count(db)),
        "insights": build_insights(rows),
        "charts": {
            "crimeTypeDistribution": distribution(rows, "crime_type", "crime_type", 8),
            "areaDistribution": distribution(rows, "area", "area", 10),
            "monthlyTrend": monthly(rows),
            "severityDistribution": distribution(
                rows, "severity", "severity", order=SEVERITY_ORDER
            ),
            "timeOfDayDistribution": distribution(
                rows, "time_period", "time_period", order=TIME_PERIODS
            ),
        },
    }
