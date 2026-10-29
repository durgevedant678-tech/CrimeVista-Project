import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .database import BASE_DIR
from .services.data_service import initialize_database
from .routes import analytics, auth, chat, crimes, dashboard, filters, health, map, reports, upload

load_dotenv(BASE_DIR / ".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="CrimeVista API", version="1.0.0", lifespan=lifespan)
configured_origins = [
    origin.strip()
    for value in (os.getenv("FRONTEND_URL"), os.getenv("CORS_ORIGINS"))
    if value
    for origin in value.split(",")
    if origin.strip()
]
origins = list(dict.fromkeys(configured_origins)) or [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type"],
)


for route_module in (
    health,
    auth,
    filters,
    dashboard,
    crimes,
    analytics,
    map,
    upload,
    reports,
    chat,
):
    app.include_router(route_module.router, prefix="/api")

app.include_router(health.router)

FRONTEND_DIST_DIR = (BASE_DIR.parent / "frontend" / "dist").resolve()


def _serve_frontend_index() -> FileResponse:
    index_path = FRONTEND_DIST_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found.")
    return FileResponse(index_path)


@app.get("/", include_in_schema=False)
async def serve_frontend_root():
    return _serve_frontend_index()


@app.get("/{path:path}", include_in_schema=False)
async def serve_frontend_fallback(request: Request, path: str):
    request_path = request.url.path
    if request_path.startswith("/api") or request_path.startswith("/docs") or request_path.startswith("/redoc") or request_path.startswith("/openapi"):
        raise HTTPException(status_code=404, detail="Not found")

    if request_path == "/":
        return _serve_frontend_index()

    candidate = (FRONTEND_DIST_DIR / path).resolve()
    if candidate.is_file() and candidate.is_relative_to(FRONTEND_DIST_DIR):
        return FileResponse(candidate)

    return _serve_frontend_index()
