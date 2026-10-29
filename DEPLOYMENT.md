# CrimeVista deployment guide

## Architecture

CrimeVista is configured as a single-service deployment:

- One Render Web Service runs the FastAPI application.
- The same service serves the built React frontend from `frontend/dist`.
- One Render PostgreSQL service provides the production database.
- The API receives `DATABASE_URL` from Render and uses it in production.

## Render configuration

Create a Render Web Service with the following settings:

- Build Command:
  ```bash
  cd backend && python -m pip install -r requirements.txt && cd ../frontend && npm install && npm run build
  ```
- Start Command:
  ```bash
  cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- Health Check Path: `/api/health`
- Auto-Deploy: enabled

Attach a PostgreSQL database to the service and copy the provided `DATABASE_URL` into the Render environment variables.

## Required environment variables

Set these variables in the Render service:

```bash
APP_ENV=production
DATABASE_URL=postgresql+psycopg://<user>:<password>@<host>:<port>/<database>
API_ADMIN_TOKEN=<random-long-secret>
ADMIN_USERNAME=<administrator-login-name>
ADMIN_PASSWORD=<strong-administrator-password>
FRONTEND_URL=https://<your-render-app>.onrender.com
CORS_ORIGINS=https://<your-render-app>.onrender.com
DATASET_PATH=/opt/render/project/src/backend/data/initial/your_city_crime_data.csv
```

Notes:

- `API_ADMIN_TOKEN` is required in production and remains server-side; it signs the administrator session and supports direct bearer-authenticated API use.
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` provision the single administrator login. There is no public registration.
- Sign-in issues a 30-day `HttpOnly`, `Secure`, `SameSite=Strict` cookie. The browser never stores the API token or administrator password.
- Set all three authentication variables in Render before deploying the new login flow. Then sign in from Settings once per browser.
- CSV upload returns immediately with a queued upload ID; the UI polls the protected status endpoint while the backend validates and replaces the dataset. Do not start another upload until the current one finishes.
- `FRONTEND_URL` and `CORS_ORIGINS` should point to the public Render URL.
- If you use same-origin hosting, a single service origin is often enough; `CORS_ORIGINS` remains optional for local dev.

## Startup behavior

The app performs the following startup actions:

1. Resolves the database URL from `DATABASE_URL` or PostgreSQL environment values.
2. Creates tables automatically via SQLAlchemy metadata.
3. Checks for existing crime records.
4. Imports the bundled dataset only when the database is empty.
5. Serves the frontend from `/` and keeps `/api/*` endpoints reachable.

## Health checks

The Render health check expects:

- `GET /api/health`
- HTTP 200 response
- A `status: "ok"` body

## Local fallback

Local development is still supported by leaving `APP_ENV` unset or set to `development`, which allows an SQLite fallback when no database URL is configured.

Do not rely on SQLite for production workloads.
postgresql://crimevista_user:PdhxCm2ZoZuSr8ZaSECnCMlqgDGyWc1Q@dpg-db0lslmgekts73a9at9g-a/crimevista