/** Single source of truth for API paths (mirrors frontend/src/api/endpoints.ts in the original repo). */
export const ENDPOINTS = {
  health: '/health',
  authLogin: '/auth/login',
  authLogout: '/auth/logout',
  authSession: '/auth/session',
  filterOptions: '/filters/options',
  dashboardOverview: '/dashboard/overview',
  crimes: '/crimes',
  trends: '/analytics/trends',
  hotspots: '/analytics/hotspots',
  areaProfile: (area: string) => `/analytics/areas/${encodeURIComponent(area)}`,
  mapIncidents: '/map/incidents',
  uploadConfig: '/upload/config',
  upload: '/upload',
  uploadStatus: (id: string) => `/upload/${encodeURIComponent(id)}/status`,
  reports: '/reports',
  reportsGenerate: '/reports/generate',
  chat: '/chat'
} as const;

export const ENDPOINT_REGISTRY: Array<{method: string;path: string;purpose: string;auth: boolean;}> = [
{ method: 'GET', path: '/health', purpose: 'Service and database health', auth: false },
{ method: 'GET', path: '/filters/options', purpose: 'Filter values and dataset date range', auth: false },
{ method: 'GET', path: '/dashboard/overview', purpose: 'KPIs, insights and distributions', auth: false },
{ method: 'GET', path: '/crimes', purpose: 'Paginated incident records', auth: false },
{ method: 'GET', path: '/analytics/trends', purpose: 'Monthly and category trends, 90-day comparison', auth: false },
{ method: 'GET', path: '/analytics/hotspots', purpose: 'Ranked areas with relative risk level', auth: false },
{ method: 'GET', path: '/analytics/areas/{area}', purpose: 'Single-area profile vs city', auth: false },
{ method: 'GET', path: '/map/incidents', purpose: 'Geolocated incidents (max 3,000)', auth: false },
{ method: 'GET', path: '/upload/config', purpose: 'Accepted file rules', auth: false },
{ method: 'POST', path: '/upload', purpose: 'Replace dataset from CSV', auth: true },
{ method: 'GET', path: '/upload/{id}/status', purpose: 'Import progress', auth: true },
{ method: 'GET', path: '/reports', purpose: 'Generated report history', auth: true },
{ method: 'POST', path: '/reports/generate', purpose: 'Build PDF, Excel or CSV report', auth: true },
{ method: 'POST', path: '/chat', purpose: 'CrimeVista AI assistant', auth: false },
{ method: 'POST', path: '/auth/login', purpose: 'Administrator sign-in', auth: false }];