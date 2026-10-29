import logging
import os
import threading
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile

from ..database import SessionLocal
from ..security import require_api_token
from ..services.data_service import REQUIRED_COLUMNS, parse_csv, replace_records

router = APIRouter()
UPLOADS: dict[str, dict] = {}
MAX_FILE_SIZE = 25 * 1024 * 1024
logger = logging.getLogger(__name__)
UPLOAD_LOCK = threading.Lock()


def process_upload(upload_id: str, filename: str, content: bytes) -> None:
    upload_status = UPLOADS[upload_id]
    try:
        upload_status.update(stage="validating")
        records, received, errors = parse_csv(content)
        if not records and received == 0:
            upload_status.update(
                stage="failed",
                rowsReceived=received,
                rowsImported=0,
                rowsRejected=0,
                analysisStatus="failed",
                errors=errors or ["The CSV contains no rows."],
            )
            return

        upload_status.update(
            stage="processing",
            rowsReceived=received,
            validRecords=len(records),
            rowsRejected=received - len(records),
            errors=errors[:100],
        )

        detected_areas = sorted({record["area"] for record in records})
        if records:
            with SessionLocal() as db:
                removed, imported = replace_records(db, records)
        else:
            removed, imported = 0, 0

        messages = []
        if records:
            messages.append(
                f"Replaced {removed} existing records with {imported} valid records."
            )
        else:
            messages.append(
                "No valid records found; the existing dataset was left unchanged."
            )
        if imported:
            messages.append(f"Imported {imported} valid records into the active dataset.")
        if not detected_areas:
            detected_areas = ["Unassigned"]

        upload_status.update(
            stage="completed",
            fileName=filename,
            areas=detected_areas,
            detectedArea=detected_areas[0] if len(detected_areas) == 1 else None,
            validRecords=len(records),
            rowsReceived=received,
            rowsImported=imported,
            rowsRejected=received - len(records),
            analysisStatus="completed" if records else "failed",
            messages=messages,
            errors=errors[:100],
        )
    except Exception:
        logger.exception("CSV upload processing failed (upload_id=%s)", upload_id)
        upload_status.update(
            stage="failed",
            analysisStatus="failed",
            messages=[],
            errors=["Import failed while updating the dataset. Check backend logs."],
        )
    finally:
        UPLOAD_LOCK.release()


@router.get("/upload/config")
def upload_config():
    return {
        "acceptedExtensions": [".csv"],
        "maxFileSizeMb": 25,
        "requiredColumns": REQUIRED_COLUMNS,
        "requiresAuth": bool(os.getenv("API_ADMIN_TOKEN", "").strip()),
    }


@router.post("/upload")
async def upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    _token: str = Depends(require_api_token),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=415, detail="Only CSV files are accepted.")
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, detail="File exceeds the 25 MB upload limit."
        )
    if not UPLOAD_LOCK.acquire(blocking=False):
        raise HTTPException(
            status_code=409,
            detail="Another dataset upload is already being processed.",
        )

    upload_id = f"upl_{uuid.uuid4().hex[:12]}"
    status = {
        "uploadId": upload_id,
        "fileName": os.path.basename(file.filename),
        "stage": "queued",
        "areas": [],
        "detectedArea": None,
        "validRecords": None,
        "rowsReceived": None,
        "rowsImported": None,
        "rowsRejected": None,
        "analysisStatus": "pending",
        "messages": [],
        "errors": [],
    }
    UPLOADS[upload_id] = status
    background_tasks.add_task(
        process_upload, upload_id, status["fileName"], content
    )
    return status


@router.get("/upload/{upload_id}/status")
def upload_status(upload_id: str, _token: str = Depends(require_api_token)):
    status = UPLOADS.get(upload_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Upload not found.")
    return status
