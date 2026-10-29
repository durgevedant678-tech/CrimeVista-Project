/**
 * Connection configuration.
 * - When the frontend is served by the FastAPI app (same origin, e.g. *.onrender.com) it uses `/api`.
 * - Elsewhere it targets the deployed CrimeVista API. If that is unreachable (offline, cold start,
 *   or CORS not configured for this origin), the client switches to the in-browser engine which
 *   runs the same analytics over the configured fallback dataset.
 */
const sameOrigin = typeof window !== 'undefined' && /onrender\.com$|localhost$|127\.0\.0\.1$/.test(window.location.hostname);

export const API_BASE_URL = sameOrigin ? '/api' : 'https://final-crimevista.onrender.com/api';

export const API_PROBE_TIMEOUT_MS = 6000;
export const API_REQUEST_TIMEOUT_MS = 30000;

export const DATASET_URLS = [
'https://raw.githubusercontent.com/vedant150705/final_crimevista/main/backend/data/initial/nagpur_crime_data.csv',
'https://raw.githubusercontent.com/vedant150705/final_crimevista/master/backend/data/initial/nagpur_crime_data.csv'];


/** Default map centre, [lng, lat], for the configured example dataset. */
export const NAGPUR_CENTER: [number, number] = [79.0849, 21.1458];