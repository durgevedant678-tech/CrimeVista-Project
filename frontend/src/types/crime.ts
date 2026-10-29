/** Normalised record used by the in-browser analytics engine (mirrors backend `Crime` model). */
export interface CrimeRow {
  crimeId: string;
  date: string; // YYYY-MM-DD
  time: string | null;
  city: string | null;
  area: string;
  crimeType: string;
  latitude: number | null;
  longitude: number | null;
  severity: string;
  status: string | null;
  victimAge: number | null;
  victimGender: string | null;
  weaponUsed: string | null;
  policeStation: string | null;
  description: string | null;
  source: string | null;
  timePeriod: string | null;
}

export interface CrimeFilters {
  startDate: string | null;
  endDate: string | null;
  crimeType: string[];
  area: string[];
  severity: string[];
  timePeriod: string[];
  status: string[];
}

export type MultiFilterKey = 'crimeType' | 'area' | 'severity' | 'timePeriod' | 'status';

export interface CategoryCount {
  label: string;
  count: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface MultiSeries {
  keys: string[];
  points: Array<{period: string;} & Record<string, number | string>>;
}

export interface KpiTrend {
  direction: 'up' | 'down' | 'flat';
  value: string;
  isPositive: boolean;
}

export interface Kpi {
  id: string;
  label: string;
  value: string | number;
  context: string;
  tone: string;
  trend?: KpiTrend;
}

export interface Insight {
  text: string;
  category: string;
}

export interface DataMeta {
  filtered: number;
  total: number;
  lastUpdated: string | null;
}

export interface DashboardOverview {
  meta: DataMeta;
  kpis: Kpi[];
  insights: Insight[];
  crimeTypes: CategoryCount[];
  areas: CategoryCount[];
  monthly: TimeSeriesPoint[];
  severity: CategoryCount[];
  timeOfDay: CategoryCount[];
}

export interface PeriodComparison {
  currentLabel: string;
  previousLabel: string;
  currentCount: number;
  previousCount: number;
  changePct: number | null;
}

export interface TrendsData {
  meta: DataMeta;
  monthly: TimeSeriesPoint[];
  crimeTypeTrend: MultiSeries;
  severityTrend: MultiSeries;
  areaTrend: MultiSeries;
  timeOfDay: CategoryCount[];
  comparison: PeriodComparison | null;
}

export type RiskLevel = 'Very high' | 'High' | 'Elevated' | 'Moderate';

export interface Hotspot {
  rank: number;
  area: string;
  incidentCount: number;
  densityPerSqKm: number | null;
  sharePct: number | null;
  dominantCrimeType: string | null;
  highSeverityCount: number;
  riskLevel: RiskLevel;
  latitude: number | null;
  longitude: number | null;
}

export interface HotspotsData {
  meta: DataMeta;
  hotspots: Hotspot[];
  crimeTypeBreakdown: CategoryCount[];
  severityBreakdown: CategoryCount[];
}

export interface AreaProfile {
  meta: DataMeta;
  area: string;
  totalIncidents: number;
  kpis: Kpi[];
  crimeTypes: CategoryCount[];
  severity: CategoryCount[];
  timeOfDay: CategoryCount[];
  monthly: TimeSeriesPoint[];
  areaComparison: CategoryCount[];
  location: {latitude: number;longitude: number;} | null;
}

export interface MapIncident {
  id: string;
  crimeType: string;
  severity: string;
  area: string;
  date: string;
  description: string | null;
  latitude: number;
  longitude: number;
}

export interface CrimeMapData {
  meta: DataMeta;
  locationAvailable: boolean;
  missingLocationCount: number;
  incidents: MapIncident[];
}

export interface CrimeRecord {
  id: string;
  crimeType: string;
  area: string;
  severity: string;
  timePeriod: string | null;
  date: string;
  description: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Paginated<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

export interface FilterOptions {
  crimeTypes: string[];
  areas: string[];
  severities: string[];
  timePeriods: string[];
  dateRange: {min: string | null;max: string | null;};
  statuses: string[];
}

export interface HealthStatus {
  status: string;
  databaseReady: boolean;
  lastUpdated: string | null;
  version: string;
}