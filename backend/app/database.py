import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()


def _resolve_database_url() -> str:
    configured_url = (
        os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
        or (
            "postgresql+psycopg://"
            f"{os.getenv('POSTGRES_USER', 'postgres')}:{os.getenv('POSTGRES_PASSWORD', 'postgres')}@"
            f"{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/"
            f"{os.getenv('POSTGRES_DB', 'crimevista')}"
            if all(
                os.getenv(var)
                for var in (
                    "POSTGRES_USER",
                    "POSTGRES_PASSWORD",
                    "POSTGRES_HOST",
                    "POSTGRES_DB",
                )
            )
            else None
        )
    )
    if configured_url:
        return configured_url.strip()

    if APP_ENV == "production":
        raise RuntimeError(
            "APP_ENV=production requires DATABASE_URL to be set for the Render PostgreSQL service."
        )

    return f"sqlite:///{(BASE_DIR / 'data' / 'crimevista.db').as_posix()}"


DATABASE_URL = _resolve_database_url()
url = make_url(DATABASE_URL)
if (
    url.get_backend_name() == "sqlite"
    and url.database not in (None, ":memory:")
    and not url.database.startswith("file:")
):
    database_path = Path(url.database)
    if not database_path.is_absolute():
        database_path = BASE_DIR / database_path
    database_path.parent.mkdir(parents=True, exist_ok=True)
    DATABASE_URL = url.set(database=str(database_path)).render_as_string(
        hide_password=False
    )


def _runtime_dir(env_name: str, local_default: str) -> Path:
    configured = os.getenv(env_name)
    if configured:
        return Path(configured).expanduser()
    if APP_ENV == "production":
        return Path(tempfile.gettempdir()) / "crimevista" / env_name.lower().replace("_dir", "")
    return BASE_DIR / local_default


uploads_dir = _runtime_dir("UPLOADS_DIR", "uploads")
reports_dir = _runtime_dir("REPORTS_DIR", "reports")
uploads_dir.mkdir(parents=True, exist_ok=True)
reports_dir.mkdir(parents=True, exist_ok=True)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
Base = declarative_base()


def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def configured_dataset_path() -> Path:
    default_path = BASE_DIR / "data" / "initial" / "nagpur_crime_data.csv"
    path = Path(os.getenv("DATASET_PATH", str(default_path)))
    return path if path.is_absolute() else (BASE_DIR / path).resolve()
