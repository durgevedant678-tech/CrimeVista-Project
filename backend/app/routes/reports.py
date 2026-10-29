from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ReportGenerateRequest
from ..security import require_api_token
from ..services.report_service import find_report, generate_report, list_reports

router = APIRouter()


@router.get("/reports")
def reports(_token: str = Depends(require_api_token)):
    return list_reports()


@router.post("/reports/generate")
def create_report(
    request: ReportGenerateRequest,
    db: Session = Depends(get_db),
    _token: str = Depends(require_api_token),
):
    return generate_report(db, request)


@router.get("/reports/{report_id}/download")
def download_report(report_id: str, _token: str = Depends(require_api_token)):
    report = find_report(report_id)
    if report is None or not Path(report["_path"]).is_file():
        raise HTTPException(status_code=404, detail="Report file not found.")
    return FileResponse(report["_path"], filename=Path(report["_path"]).name)
