import os
import re
from io import BytesIO

import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Session

from ..database import Base, SessionLocal, configured_dataset_path, engine
from ..models import Crime

DEFAULT_BATCH_SIZE = max(1, int(os.getenv("DB_BATCH_SIZE", "500")))

REQUIRED_COLUMNS = ["crime_id", "date", "area", "crime_type", "severity"]
CRIME_COLUMNS = [
    "crime_id",
    "date",
    "time",
    "datetime",
    "city",
    "area",
    "crime_type",
    "latitude",
    "longitude",
    "severity",
    "status",
    "victim_age",
    "victim_gender",
    "weapon_used",
    "police_station",
    "description",
    "source",
    "source_record_id",
]


def _clean(value):
    if value is None or pd.isna(value):
        return None
    text = str(value).strip()
    return None if text.lower() in {"", "nan", "none", "null", "nat"} else text


def strip_demo_markers(value):
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return text
    text = re.sub(r"(?i)[\-_\s]*demo[\-_\s]*", "", text)
    text = re.sub(r"[-_\s]{2,}", "-", text)
    text = text.strip("-_ ")
    return text or None


def _as_date(value):
    cleaned = _clean(value)
    parsed = pd.to_datetime(cleaned, errors="coerce") if cleaned else pd.NaT
    return None if pd.isna(parsed) else parsed.date()


def _as_datetime(value, day, clock):
    cleaned = _clean(value)
    parsed = pd.to_datetime(cleaned, errors="coerce") if cleaned else pd.NaT
    if pd.isna(parsed) and day:
        clock_value = _clean(clock)
        parsed = pd.to_datetime(
            f"{day.isoformat()} {clock_value or '00:00:00'}", errors="coerce"
        )
    return None if pd.isna(parsed) else parsed.to_pydatetime().replace(tzinfo=None)


def normalize_row(row: dict) -> tuple[dict | None, str | None]:
    values = {column: _clean(row.get(column)) for column in CRIME_COLUMNS}
    for key in ("crime_id", "source_record_id", "source", "description"):
        if values.get(key) is not None:
            values[key] = strip_demo_markers(values[key])
    missing = [column for column in REQUIRED_COLUMNS if not values[column]]
    if missing:
        return None, f"Missing required value(s): {', '.join(missing)}."

    parsed_date = _as_date(values["date"])
    if parsed_date is None:
        return None, "Invalid date; expected a recognizable date such as YYYY-MM-DD."

    def number(name):
        value = values[name]
        if value is None:
            return None
        try:
            return float(value)
        except ValueError:
            return None

    try:
        victim_age = (
            int(float(values["victim_age"]))
            if values["victim_age"] is not None
            else None
        )
    except ValueError:
        victim_age = None

    latitude = number("latitude")
    longitude = number("longitude")
    if latitude is not None and not -90 <= latitude <= 90:
        latitude = None
    if longitude is not None and not -180 <= longitude <= 180:
        longitude = None

    record = {
        **{
            key: values[key]
            for key in CRIME_COLUMNS
            if key not in {"date", "datetime", "latitude", "longitude", "victim_age"}
        },
        "date": parsed_date,
        "datetime": _as_datetime(values["datetime"], parsed_date, values["time"]),
        "latitude": latitude,
        "longitude": longitude,
        "victim_age": victim_age,
    }
    return record, None


def parse_csv(content: bytes) -> tuple[list[dict], int, list[str]]:
    try:
        frame = pd.read_csv(BytesIO(content), dtype=str, keep_default_na=False)
    except Exception as error:
        return [], 0, [f"Unable to read CSV: {error}"]
    frame.columns = [
        str(column).strip().lstrip("\ufeff").strip().casefold()
        for column in frame.columns
    ]
    missing = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing:
        return [], len(frame), [f"Missing required column(s): {', '.join(missing)}."]

    records: list[dict] = []
    errors: list[str] = []
    seen: set[str] = set()
    for index, row in frame.iterrows():
        record, error = normalize_row(row.to_dict())
        if error:
            errors.append(f"Row {index + 2}: {error}")
            continue
        if record["crime_id"] in seen:
            errors.append(
                f"Row {index + 2}: duplicate crime_id {record['crime_id']} in this file."
            )
            continue
        seen.add(record["crime_id"])
        records.append(record)
    return records, len(frame), errors


def sanitize_existing_demo_records(db: Session) -> int:
    updated = 0
    for row in db.query(Crime).all():
        cleaned_id = strip_demo_markers(row.crime_id)
        if cleaned_id and cleaned_id != row.crime_id:
            existing = db.query(Crime).filter(Crime.crime_id == cleaned_id).first()
            if existing is not None and existing.crime_id != row.crime_id:
                suffix = 2
                candidate = f"{cleaned_id}-{suffix}"
                while db.query(Crime).filter(Crime.crime_id == candidate).first():
                    suffix += 1
                    candidate = f"{cleaned_id}-{suffix}"
                cleaned_id = candidate
            row.crime_id = cleaned_id
            updated += 1
        for field in ("source_record_id", "source", "description"):
            value = getattr(row, field)
            cleaned_value = strip_demo_markers(value)
            if cleaned_value != value:
                setattr(row, field, cleaned_value)
                updated += 1
    db.commit()
    return updated


def _batch_insert_records(session: Session, records: list[dict], *, batch_size: int = DEFAULT_BATCH_SIZE) -> int:
    if not records:
        return 0

    dialect_name = session.bind.dialect.name if session.bind is not None else ""
    total_inserted = 0

    for index in range(0, len(records), batch_size):
        batch = records[index : index + batch_size]
        try:
            if dialect_name == "postgresql":
                stmt = postgresql.insert(Crime).values(batch).on_conflict_do_nothing(index_elements=["crime_id"])
                session.execute(stmt)
                total_inserted += len(batch)
            else:
                for record in batch:
                    existing = session.get(Crime, record["crime_id"])
                    if existing is None:
                        session.add(Crime(**record))
                        total_inserted += 1
                session.flush()
        except Exception as exc:
            raise RuntimeError(
                f"Database batch insertion failed for batch {index // batch_size + 1} "
                f"(records {index + 1}-{min(index + len(batch), len(records))} of {len(records)}): {exc}"
            ) from exc

    return total_inserted


def _load_and_insert_initial_dataset(session: Session) -> int:
    dataset = configured_dataset_path()
    if not dataset.is_file():
        raise FileNotFoundError(
            f"Crime dataset was not found: {dataset}. Set DATASET_PATH in backend/.env."
        )

    records, received, errors = parse_csv(dataset.read_bytes())
    if not records:
        raise ValueError(f"No valid crime records found in {dataset}. {errors[:3]}")

    dialect_name = session.bind.dialect.name if session.bind is not None else ""
    batches = (len(records) + DEFAULT_BATCH_SIZE - 1) // DEFAULT_BATCH_SIZE
    for batch_index in range(0, len(records), DEFAULT_BATCH_SIZE):
        batch = records[batch_index : batch_index + DEFAULT_BATCH_SIZE]
        print(f"Inserting initial dataset batch {batch_index // DEFAULT_BATCH_SIZE + 1}/{batches} ({len(batch)} rows)")
        if dialect_name == "postgresql":
            stmt = postgresql.insert(Crime).values(batch).on_conflict_do_nothing(index_elements=["crime_id"])
            session.execute(stmt)
        else:
            for record in batch:
                if session.get(Crime, record["crime_id"]) is None:
                    session.add(Crime(**record))
            session.flush()

    session.commit()
    loaded = session.scalar(select(func.count()).select_from(Crime)) or 0
    print(f"CrimeVista database initialized. Loaded {loaded} crime records from {dataset.name} ({received} rows).")
    if errors:
        print(f"Skipped {len(errors)} invalid or duplicate CSV rows.")
    return loaded


def initialize_database() -> int:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        try:
            existing = db.scalar(select(func.count()).select_from(Crime)) or 0
            if existing:
                sanitized = sanitize_existing_demo_records(db)
                if sanitized:
                    print(
                        f"CrimeVista database cleaned: removed demo markers from {sanitized} record fields."
                    )
                print(
                    f"CrimeVista database initialized. Using {existing} existing crime records."
                )
                return existing

            print("CrimeVista starting... Creating/verifying database tables...")
            print("Checking existing records...")
            if db.scalar(select(func.count()).select_from(Crime)) == 0:
                print("Existing records: 0")
                print("Loading initial dataset...")
                return _load_and_insert_initial_dataset(db)

            print(f"Existing records: {existing}")
            return existing
        except Exception:
            db.rollback()
            raise


def total_record_count(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(Crime)) or 0


def last_updated(db: Session) -> str | None:
    latest = db.scalar(select(func.max(Crime.datetime)))
    if latest is None:
        latest_date = db.scalar(select(func.max(Crime.date)))
        return latest_date.isoformat() if latest_date else None
    return latest.isoformat()


def insert_records(db: Session, records: list[dict], *, batch_size: int = DEFAULT_BATCH_SIZE) -> int:
    if not records:
        return 0
    before = total_record_count(db)
    dialect_name = db.bind.dialect.name if db.bind is not None else ""
    try:
        for index in range(0, len(records), batch_size):
            batch = records[index : index + batch_size]
            if dialect_name == "postgresql":
                db.execute(
                    postgresql.insert(Crime)
                    .values(batch)
                    .on_conflict_do_nothing(index_elements=["crime_id"]),
                )
            else:
                for record in batch:
                    if db.get(Crime, record["crime_id"]) is None:
                        db.add(Crime(**record))
                db.flush()
        db.commit()
    except Exception:
        db.rollback()
        raise
    return total_record_count(db) - before


def replace_records(db: Session, records: list[dict], *, batch_size: int = DEFAULT_BATCH_SIZE) -> tuple[int, int]:
    if not records:
        return 0, 0
    previous_count = total_record_count(db)
    dialect_name = db.bind.dialect.name if db.bind is not None else ""
    try:
        db.query(Crime).delete(synchronize_session=False)
        for index in range(0, len(records), batch_size):
            batch = records[index : index + batch_size]
            if dialect_name == "postgresql":
                db.execute(
                    postgresql.insert(Crime)
                    .values(batch)
                    .on_conflict_do_nothing(index_elements=["crime_id"]),
                )
            else:
                for record in batch:
                    db.add(Crime(**record))
                db.flush()
        db.commit()
    except Exception:
        db.rollback()
        raise
    return previous_count, total_record_count(db)
