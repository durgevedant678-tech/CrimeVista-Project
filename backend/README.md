# CrimeVista Backend

## Requirements

Python 3.10 or newer.

## Installation

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

## Dataset and database

The default dataset is a bundled demo file in this repository; on first startup the backend creates `data/crimevista.db` and imports valid rows using `crime_id` as the unique key. Later startups reuse the existing records without reimporting. Set `DATASET_PATH` or `DATABASE_URL` in `.env` to point to your own city dataset or a different database location.

To initialize manually, run `python scripts/initialize_data.py` from `backend/`.

## Start the backend

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

The first startup prints the number of records imported. API documentation is available at `http://localhost:8000/docs`.

## Frontend

From `frontend/`, run `npm install` and `npm run dev`. The default API URL is `http://localhost:8000/api`; override it with `VITE_API_BASE_URL` in `frontend/.env` when needed. The frontend does not fall back to mock data.

## Deployment

This backend is not designed to run directly on GitHub Pages because GitHub Pages only hosts static frontend files. The FastAPI API must be deployed to a Python-capable host such as Render, Railway, Fly.io, Azure App Service, or a VPS.

See the repository-root `DEPLOYMENT.md` for the hosting architecture and environment variable requirements.

## Endpoints

- `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/session`
- `GET /api/health`
- `GET /api/filters/options`
- `GET /api/dashboard/overview`
- `GET /api/crimes`
- `GET /api/analytics/trends`
- `GET /api/analytics/hotspots`
- `GET /api/analytics/areas/{area}`
- `GET /api/map/incidents`
- `GET /api/upload/config`
- `POST /api/upload` and `GET /api/upload/{upload_id}/status`
- `GET /api/reports`, `POST /api/reports/generate`, and `GET /api/reports/{report_id}/download`

Upload and report operations require an administrator session or a direct
`Authorization: Bearer <API_ADMIN_TOKEN>` credential. Configure
`API_ADMIN_TOKEN`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` on the backend.
There is no public registration; successful sign-in creates a 30-day secure
HttpOnly cookie.

All analytics and listing endpoints accept `start_date`, `end_date`, `crime_type`, `area`, `severity`, and `time_period`; `status`, `city`, and `police_station` are also supported. Multi-value parameters are comma-separated. Crime records accept `page` and `page_size` (maximum 100).

## Troubleshooting

- If startup says the CSV is missing, confirm its location or set an absolute `DATASET_PATH` in `.env`.
- If the frontend reports the API offline, start the backend on port 8000 and confirm `VITE_API_BASE_URL` ends in `/api`.
- If the browser blocks requests, add the frontend origin to comma-separated `CORS_ORIGINS` and restart the backend.