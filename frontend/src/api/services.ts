import type {
  AreaProfile,
  CrimeFilters,
  CrimeMapData,
  CrimeRecord,
  DashboardOverview,
  FilterOptions,
  HealthStatus,
  HotspotsData,
  Paginated,
  TrendsData } from
'../types/crime';
import type {
  ChatRequest,
  ChatResponse,
  ReportRequest,
  ReportResult,
  UploadConfig,
  UploadStatus } from
'../types/operations';
import {
  toCategoryCounts,
  toHotspots,
  toInsights,
  toKpis,
  toMeta,
  toMultiSeries,
  toQueryParams,
  toTimeSeries } from
'./adapters';
import { apiRequest } from './client';
import { ENDPOINTS } from './endpoints';

type Raw = Record<string, any>;

export const dashboardApi = {
  async getOverview(filters: CrimeFilters): Promise<DashboardOverview> {
    const raw = await apiRequest<Raw>('GET', ENDPOINTS.dashboardOverview, { params: toQueryParams(filters) });
    const charts = raw.charts ?? {};
    return {
      meta: toMeta(raw),
      kpis: toKpis(raw.kpis),
      insights: toInsights(raw.insights),
      crimeTypes: toCategoryCounts(charts.crimeTypeDistribution),
      areas: toCategoryCounts(charts.areaDistribution),
      monthly: toTimeSeries(charts.monthlyTrend),
      severity: toCategoryCounts(charts.severityDistribution),
      timeOfDay: toCategoryCounts(charts.timeOfDayDistribution)
    };
  },
  async getFilterOptions(): Promise<FilterOptions> {
    const raw = await apiRequest<Raw>('GET', ENDPOINTS.filterOptions);
    const status = (raw.additional ?? []).find((item: Raw) => item.key === 'status');
    return {
      crimeTypes: raw.crimeTypes ?? [],
      areas: raw.areas ?? [],
      severities: raw.severities ?? [],
      timePeriods: raw.timePeriods ?? [],
      dateRange: { min: raw.dateRange?.min ?? null, max: raw.dateRange?.max ?? null },
      statuses: status?.options ?? []
    };
  },
  async getHealth(): Promise<HealthStatus> {
    const raw = await apiRequest<Raw>('GET', ENDPOINTS.health);
    return {
      status: String(raw.status ?? 'unknown'),
      databaseReady: Boolean(raw.databaseReady),
      lastUpdated: raw.lastUpdated ?? null,
      version: String(raw.version ?? '')
    };
  }
};

export const crimeApi = {
  async getRecords(filters: CrimeFilters, page: number, pageSize: number): Promise<Paginated<CrimeRecord>> {
    const raw = await apiRequest<Raw>('GET', ENDPOINTS.crimes, {
      params: { ...toQueryParams(filters), page: String(page), page_size: String(pageSize) }
    });
    return {
      page: raw.page,
      pageSize: raw.pageSize,
      total: raw.total,
      items: (raw.items ?? []).map((item: Raw) => ({
        id: item.id,
        crimeType: item.crime_type,
        area: item.area,
        severity: item.severity,
        timePeriod: item.time_period ?? null,
        date: item.date,
        description: item.description ?? null,
        status: item.status ?? null,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null
      }))
    };
  }
};

export const analyticsApi = {
  async getTrends(filters: CrimeFilters): Promise<TrendsData> {
    const raw = await apiRequest<Raw>('GET', ENDPOINTS.trends, { params: toQueryParams(filters) });
    const comparison = raw.comparison;
    return {
      meta: toMeta(raw),
      monthly: toTimeSeries(raw.monthlyTrend),
      crimeTypeTrend: toMultiSeries(raw.crimeTypeTrend, 'crime_type'),
      severityTrend: toMultiSeries(raw.severityTrend, 'severity'),
      areaTrend: toMultiSeries(raw.areaTrend, 'area'),
      timeOfDay: toCategoryCounts(raw.timeOfDayDistribution),
      comparison: comparison ?
      {
        currentLabel: comparison.current_label,
        previousLabel: comparison.previous_label,
        currentCount: comparison.current_count,
        previousCount: comparison.previous_count,
        changePct: comparison.change_pct
      } :
      null
    };
  },
  async getHotspots(filters: CrimeFilters): Promise<HotspotsData> {
    const raw = await apiRequest<Raw>('GET', ENDPOINTS.hotspots, { params: toQueryParams(filters) });
    return {
      meta: toMeta(raw),
      hotspots: toHotspots(raw.hotspots),
      crimeTypeBreakdown: toCategoryCounts(raw.crimeTypeBreakdown),
      severityBreakdown: toCategoryCounts(raw.severityBreakdown)
    };
  },
  async getAreaProfile(area: string, filters: CrimeFilters): Promise<AreaProfile> {
    const { area: _ignored, ...params } = toQueryParams(filters);
    const raw = await apiRequest<Raw>('GET', ENDPOINTS.areaProfile(area), { params });
    return {
      meta: toMeta(raw),
      area: raw.area,
      totalIncidents: raw.totalIncidents,
      kpis: toKpis(raw.kpis),
      crimeTypes: toCategoryCounts(raw.crimeTypeDistribution),
      severity: toCategoryCounts(raw.severityDistribution),
      timeOfDay: toCategoryCounts(raw.timeOfDayDistribution),
      monthly: toTimeSeries(raw.monthlyTrend),
      areaComparison: toCategoryCounts(raw.areaComparison),
      location: raw.location ?? null
    };
  }
};

export const mapApi = {
  async getCrimeMap(filters: CrimeFilters): Promise<CrimeMapData> {
    const raw = await apiRequest<Raw>('GET', ENDPOINTS.mapIncidents, { params: toQueryParams(filters) });
    return {
      meta: toMeta(raw),
      locationAvailable: Boolean(raw.locationAvailable),
      missingLocationCount: Number(raw.missingLocationCount ?? 0),
      incidents: (raw.incidents ?? []).
      filter((item: Raw) => typeof item.latitude === 'number' && typeof item.longitude === 'number').
      map((item: Raw) => ({
        id: item.id,
        crimeType: item.crime_type,
        severity: item.severity,
        area: item.area,
        date: item.date,
        description: item.description ?? null,
        latitude: item.latitude,
        longitude: item.longitude
      }))
    };
  }
};

export const uploadApi = {
  getConfig: () => apiRequest<UploadConfig>('GET', ENDPOINTS.uploadConfig),
  uploadFile(file: File): Promise<UploadStatus> {
    const form = new FormData();
    form.append('file', file);
    return apiRequest<UploadStatus>('POST', ENDPOINTS.upload, { form, timeoutMs: 300000 });
  },
  getStatus: (id: string) => apiRequest<UploadStatus>('GET', ENDPOINTS.uploadStatus(id))
};

export const reportsApi = {
  generate: (request: ReportRequest) => apiRequest<ReportResult>('POST', ENDPOINTS.reportsGenerate, { body: request }),
  async list(): Promise<ReportResult[]> {
    const raw = await apiRequest<Raw[]>('GET', ENDPOINTS.reports);
    return Array.isArray(raw) ? raw as ReportResult[] : [];
  }
};

export const authApi = {
  login: (username: string, password: string) =>
  apiRequest<{authenticated: boolean;}>('POST', ENDPOINTS.authLogin, { body: { username, password } }),
  logout: () => apiRequest<{authenticated: boolean;}>('POST', ENDPOINTS.authLogout),
  getSession: () => apiRequest<{authenticated: boolean;}>('GET', ENDPOINTS.authSession)
};

export const chatApi = {
  ask: (request: ChatRequest) => apiRequest<ChatResponse>('POST', ENDPOINTS.chat, { body: request })
};