# CrimeVista

CrimeVista is a single-service FastAPI + React analytics dashboard for crime data. The backend exposes the API and serves the built frontend from the same deployment origin, which makes it suitable for Render-hosted deployments.

## Local development

1. Create the backend virtual environment:
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   Copy-Item .env.example .env
   ```
2. Start the API locally:
   ```powershell
   cd backend
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
3. Start the frontend:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

The frontend uses `/api` as the default backend URL. The local dev server proxies API requests to the backend process for a smooth single-origin workflow.

## Production deployment

This project is designed for a single Render Web Service with one PostgreSQL instance. The FastAPI app serves the built frontend and the database is PostgreSQL-backed in production.

Required environment variables:

- `APP_ENV=production`
- `DATABASE_URL` (Render-managed Postgres URL)
- `API_ADMIN_TOKEN` (server-side secret required for protected admin/upload endpoints)
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` (server-provisioned administrator login; there is no public registration)
- `FRONTEND_URL` (public frontend origin, optional in same-origin deployments)
- `CORS_ORIGINS` (comma-separated list of approved origins)
- `DATASET_PATH` (optional if the default bundled dataset is used)

Render will set the runtime port at `$PORT`; the app must bind to `0.0.0.0:$PORT`.
The browser signs in once and uses a 30-day secure, HttpOnly session cookie; it does not store the API token.

## Deployment docs

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Render-specific configuration and startup details.

## Notes

- Local development may still use SQLite if `APP_ENV` is not `production` and `DATABASE_URL` is unset.
- Production must not silently fall back to SQLite if `DATABASE_URL` is missing.
- The backend serves the built frontend at `/`, while API routes remain available under `/api`.
