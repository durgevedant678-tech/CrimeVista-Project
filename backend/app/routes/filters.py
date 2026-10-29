from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Crime
from ..services.analytics_service import TIME_PERIODS

router = APIRouter()


@router.get("/filters/options")
def filter_options(db: Session = Depends(get_db)):
    def values(column):
        return [
            row[0]
            for row in db.query(column)
            .filter(column.isnot(None))
            .distinct()
            .order_by(column)
            .all()
            if row[0]
        ]

    dates = [
        row[0] for row in db.query(Crime.date).filter(Crime.date.isnot(None)).all()
    ]
    return {
        "crimeTypes": values(Crime.crime_type),
        "areas": values(Crime.area),
        "severities": values(Crime.severity),
        "timePeriods": TIME_PERIODS,
        "dateRange": {
            "min": min(dates).isoformat() if dates else None,
            "max": max(dates).isoformat() if dates else None,
        },
        "additional": [
            {"key": "status", "label": "Status", "options": values(Crime.status)},
            {
                "key": "police_station",
                "label": "Police station",
                "options": values(Crime.police_station),
            },
        ],
    }
