from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.data_service import last_updated, total_record_count

router = APIRouter()


@router.get("/health")
def health(db: Session = Depends(get_db)):
    total = total_record_count(db)
    return {
        "status": "ok",
        "databaseReady": total > 0,
        "demoMode": False,
        "lastUpdated": last_updated(db),
        "version": "1.0.0",
    }
