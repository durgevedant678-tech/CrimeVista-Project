from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.analytics_service import time_period_for
from ..services.filter_service import filtered_crimes
from .utils import filter_params

router = APIRouter()


@router.get("/crimes")
def crimes(
    params: dict = Depends(filter_params),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    rows = filtered_crimes(db, params)
    start = (page - 1) * page_size
    items = rows[start : start + page_size]
    return {
        "items": [
            {
                "id": row.crime_id,
                "crime_type": row.crime_type,
                "area": row.area,
                "severity": row.severity,
                "time_period": time_period_for(row.time) or "Unknown",
                "date": row.date.isoformat(),
                "description": row.description,
                "status": row.status,
                "latitude": row.latitude,
                "longitude": row.longitude,
            }
            for row in items
        ],
        "page": page,
        "pageSize": page_size,
        "total": len(rows),
    }
