from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Crime
from ..services.analytics_service import (
    SEVERITY_ORDER,
    TIME_PERIODS,
    area_location,
    build_kpis,
    comparison,
    counts,
    distribution,
    monthly,
    monthly_by,
)
from ..services.data_service import last_updated, total_record_count
from ..services.filter_service import filtered_crimes
from .utils import filter_params

router = APIRouter()


def envelope(rows, db):
    return {
        "recordCount": {"filtered": len(rows), "total": total_record_count(db)},
        "demoMode": False,
        "lastUpdated": last_updated(db),
    }


@router.get("/analytics/trends")
def trends(params: dict = Depends(filter_params), db: Session = Depends(get_db)):
    rows = filtered_crimes(db, params)
    return {
        **envelope(rows, db),
        "monthlyTrend": monthly(rows),
        "crimeTypeTrend": monthly_by(rows, "crime_type", "crime_type", 5),
        "severityTrend": monthly_by(rows, "severity", "severity", 4),
        "areaTrend": monthly_by(rows, "area", "area", 5),
        "timeOfDayDistribution": distribution(
            rows, "time_period", "time_period", order=TIME_PERIODS
        ),
        "comparison": comparison(rows),
    }


@router.get("/analytics/hotspots")
def hotspots(params: dict = Depends(filter_params), db: Session = Depends(get_db)):
    rows = filtered_crimes(db, params)
    ranked_areas = counts(rows, "area")[:15]
    maximum = ranked_areas[0][1] if ranked_areas else 0
    result = []
    for rank, (area, count) in enumerate(ranked_areas, start=1):
        area_rows = [row for row in rows if row.area == area]
        top_type = counts(area_rows, "crime_type", 1)
        high_count = sum(row.severity in {"High", "Critical"} for row in area_rows)
        location = area_location(area_rows)
        result.append(
            {
                "rank": rank,
                "area": area,
                "incident_count": count,
                "density_per_sq_km": None,
                "share_pct": round(count / len(rows) * 100, 1) if rows else None,
                "dominant_crime_type": top_type[0][0] if top_type else None,
                "high_severity_count": high_count,
                "risk_level": (
                    "Very high"
                    if count >= maximum * 0.75
                    else (
                        "High"
                        if count >= maximum * 0.5
                        else "Elevated" if count >= maximum * 0.3 else "Moderate"
                    )
                ),
                "latitude": location["latitude"] if location else None,
                "longitude": location["longitude"] if location else None,
            }
        )
    return {
        **envelope(rows, db),
        "hotspots": result,
        "crimeTypeBreakdown": distribution(rows, "crime_type", "crime_type", 10),
        "severityBreakdown": distribution(
            rows, "severity", "severity", order=SEVERITY_ORDER
        ),
    }


@router.get("/analytics/areas/{area}")
def area_profile(
    area: str, params: dict = Depends(filter_params), db: Session = Depends(get_db)
):
    if not db.query(Crime.crime_id).filter(Crime.area == area).first():
        raise HTTPException(status_code=404, detail=f'Area "{area}" was not found.')
    city_rows = filtered_crimes(db, params, ignore_area=True)
    rows = [row for row in city_rows if row.area == area]
    area_comparison = counts(city_rows, "area", 10)
    if area not in {value for value, _ in area_comparison}:
        area_comparison.append((area, sum(row.area == area for row in city_rows)))
    return {
        **envelope(rows, db),
        "area": area,
        "totalIncidents": len(rows),
        "kpis": [
            kpi
            for kpi in build_kpis(rows, total_record_count(db))
            if kpi["id"] not in {"top_area", "total_incidents"}
        ],
        "crimeTypeDistribution": distribution(rows, "crime_type", "crime_type", 10),
        "severityDistribution": distribution(
            rows, "severity", "severity", order=SEVERITY_ORDER
        ),
        "timeOfDayDistribution": distribution(
            rows, "time_period", "time_period", order=TIME_PERIODS
        ),
        "monthlyTrend": monthly(rows),
        "areaComparison": [
            {"area": name, "count": count} for name, count in area_comparison
        ],
        "location": area_location(rows),
    }
