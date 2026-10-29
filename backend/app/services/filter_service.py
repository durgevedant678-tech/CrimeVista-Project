from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Crime

FILTER_FIELDS = {
    "crime_type": Crime.crime_type,
    "area": Crime.area,
    "severity": Crime.severity,
    "status": Crime.status,
    "city": Crime.city,
    "police_station": Crime.police_station,
}


def _values(value: str | None) -> list[str]:
    return [item.strip() for item in (value or "").split(",") if item.strip()]


def apply_filters(query, params: dict, ignore_area: bool = False):
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    try:
        if start_date:
            query = query.filter(Crime.date >= date.fromisoformat(str(start_date)))
        if end_date:
            query = query.filter(Crime.date <= date.fromisoformat(str(end_date)))
    except ValueError as error:
        raise HTTPException(
            status_code=422, detail="Dates must use YYYY-MM-DD format."
        ) from error

    for name, column in FILTER_FIELDS.items():
        if ignore_area and name == "area":
            continue
        values = _values(params.get(name))
        if values:
            query = query.filter(column.in_(values))

    periods = _values(params.get("time_period"))
    if periods:
        from .analytics_service import time_period_for

        matching_ids = [
            record.crime_id
            for record in query.all()
            if time_period_for(record.time) in periods
        ]
        query = query.filter(Crime.crime_id.in_(matching_ids))
    return query


def filtered_crimes(
    db: Session, params: dict | None = None, ignore_area: bool = False
) -> list[Crime]:
    query = apply_filters(db.query(Crime), params or {}, ignore_area=ignore_area)
    return query.order_by(Crime.date.asc(), Crime.crime_id.asc()).all()
