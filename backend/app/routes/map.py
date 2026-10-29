from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.filter_service import filtered_crimes
from .analytics import envelope
from .utils import filter_params

router = APIRouter()


@router.get("/map/incidents")
def map_incidents(params: dict = Depends(filter_params), db: Session = Depends(get_db)):
    rows = filtered_crimes(db, params)
    located = [
        row
        for row in rows
        if row.latitude is not None
        and row.longitude is not None
        and -90 <= row.latitude <= 90
        and -180 <= row.longitude <= 180
    ]
    return {
        **envelope(rows, db),
        "locationAvailable": bool(located),
        "missingLocationCount": len(rows) - len(located),
        "incidents": [
            {
                "id": row.crime_id,
                "crime_type": row.crime_type,
                "severity": row.severity,
                "area": row.area,
                "date": row.date.isoformat(),
                "description": row.description,
                "latitude": row.latitude,
                "longitude": row.longitude,
            }
            for row in located[:3000]
        ],
        "boundaries": [],
    }
