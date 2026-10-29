/** snake_case API contracts → camelCase view models. Pages only consume adapted types. */
import type {
  CategoryCount,
  CrimeFilters,
  DataMeta,
  Hotspot,
  Insight,
  Kpi,
  MultiSeries,
  RiskLevel,
  TimeSeriesPoint } from
'../types/crime';

type Raw = Record<string, unknown>;

export function toQueryParams(filters: CrimeFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;
  if (filters.crimeType.length) params.crime_type = filters.crimeType.join(',');
  if (filters.area.length) params.area = filters.area.join(',');
  if (filters.severity.length) params.severity = filters.severity.join(',');
  if (filters.timePeriod.length) params.time_period = filters.timePeriod.join(',');
  if (filters.status.length) params.status = filters.status.join(',');
  return params;
}

export function toMeta(raw: Raw): DataMeta {
  const count = (raw.recordCount ?? {}) as Raw;
  return {
    filtered: Number(count.filtered ?? 0),
    total: Number(count.total ?? 0),
    lastUpdated: raw.lastUpdated as string ?? null
  };
}

const labelOf = (item: Raw): string => {
  for (const [key, value] of Object.entries(item)) {
    if (key !== 'count' && typeof value === 'string') return value;
  }
  return 'Unknown';
};

export function toCategoryCounts(list: unknown): CategoryCount[] {
  return Array.isArray(list) ? list.map((item: Raw) => ({ label: labelOf(item), count: Number(item.count ?? 0) })) : [];
}

export function toTimeSeries(list: unknown): TimeSeriesPoint[] {
  return Array.isArray(list) ?
  list.map((item: Raw) => ({ date: String(item.month_start ?? item.date), count: Number(item.count ?? 0) })) :
  [];
}

export function toMultiSeries(list: unknown, key: string): MultiSeries {
  if (!Array.isArray(list)) return { keys: [], points: [] };
  const totals = new Map<string, number>();
  const periods = new Map<string, Record<string, number>>();
  for (const item of list as Raw[]) {
    const series = String(item[key]);
    const period = String(item.month_start);
    const count = Number(item.count ?? 0);
    totals.set(series, (totals.get(series) ?? 0) + count);
    const bucket = periods.get(period) ?? {};
    bucket[series] = count;
    periods.set(period, bucket);
  }
  const keys = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  const points = [...periods.keys()].sort().map((period) => {
    const values = periods.get(period) ?? {};
    const point: {period: string;} & Record<string, number | string> = { period };
    keys.forEach((name) => {
      point[name] = values[name] ?? 0;
    });
    return point;
  });
  return { keys, points };
}

export function toKpis(list: unknown): Kpi[] {
  if (!Array.isArray(list)) return [];
  return list.map((item: Raw) => {
    const trend = item.trend as Raw | undefined;
    return {
      id: String(item.id),
      label: String(item.label),
      value: item.value as string | number,
      context: String(item.context ?? ''),
      tone: String(item.tone ?? 'neutral'),
      trend: trend ?
      {
        direction: trend.direction as 'up' | 'down' | 'flat' ?? 'flat',
        value: String(trend.value ?? ''),
        isPositive: Boolean(trend.is_positive ?? trend.isPositive)
      } :
      undefined
    };
  });
}

export function toInsights(list: unknown): Insight[] {
  if (!Array.isArray(list)) return [];
  return list.map((item) =>
  typeof item === 'string' ? { text: item, category: 'general' } : { text: String(item.text), category: String(item.category ?? 'general') }
  );
}

export function toHotspots(list: unknown): Hotspot[] {
  if (!Array.isArray(list)) return [];
  return list.map((item: Raw) => ({
    rank: Number(item.rank),
    area: String(item.area),
    incidentCount: Number(item.incident_count ?? item.incidentCount ?? 0),
    densityPerSqKm: (item.density_per_sq_km ?? item.densityPerSqKm ?? null) as number | null,
    sharePct: (item.share_pct ?? item.sharePct ?? null) as number | null,
    dominantCrimeType: (item.dominant_crime_type ?? item.dominantCrimeType ?? null) as string | null,
    highSeverityCount: Number(item.high_severity_count ?? item.highSeverityCount ?? 0),
    riskLevel: (item.risk_level ?? item.riskLevel ?? 'Moderate') as RiskLevel,
    latitude: (item.latitude ?? null) as number | null,
    longitude: (item.longitude ?? null) as number | null
  }));
}