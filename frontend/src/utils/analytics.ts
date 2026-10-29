/**
 * In-browser port of backend/app/services/analytics_service.py and filter_service.py.
 * Output shapes match the FastAPI JSON contracts exactly so the same adapters
 * consume both the live API and this engine.
 */
import type { CrimeRow } from '../types/crime';

export const TIME_PERIODS = ['Morning', 'Afternoon', 'Evening', 'Night'];
export const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];

type RowField = 'area' | 'crimeType' | 'severity' | 'status' | 'timePeriod' | 'policeStation' | 'city';
type Pair = [string, number];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function timePeriodFor(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  if (hour > 23) return null;
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

export function counts(rows: CrimeRow[], field: RowField, limit?: number, ordered?: string[]): Pair[] {
  const tally = new Map<string, number>();
  for (const row of rows) {
    const value = row[field];
    if (value === null || value === undefined || value === '') continue;
    tally.set(String(value), (tally.get(String(value)) ?? 0) + 1);
  }
  let result: Pair[];
  if (ordered) {
    const keys = ordered.filter((value) => tally.has(value));
    const rest = [...tally.keys()].filter((key) => !keys.includes(key)).sort();
    result = [...keys, ...rest].map((key) => [key, tally.get(key) ?? 0]);
  } else {
    result = [...tally.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].toLowerCase().localeCompare(b[0].toLowerCase())
    );
  }
  return limit ? result.slice(0, limit) : result;
}

export function distribution(rows: CrimeRow[], field: RowField, key: string, limit?: number, order?: string[]) {
  return counts(rows, field, limit, order).map(([value, count]) => ({ [key]: value, count }));
}

const monthStart = (date: string) => `${date.slice(0, 7)}-01`;

export function monthly(rows: CrimeRow[]) {
  const tally = new Map<string, number>();
  for (const row of rows) {
    if (!row.date) continue;
    const month = monthStart(row.date);
    tally.set(month, (tally.get(month) ?? 0) + 1);
  }
  return [...tally.keys()].sort().map((month) => ({ month_start: month, count: tally.get(month) ?? 0 }));
}

export function monthlyBy(rows: CrimeRow[], field: RowField, outputKey: string, topN: number) {
  const top = counts(rows, field, topN).map(([value]) => value);
  const tally = new Map<string, number>();
  for (const row of rows) {
    const value = row[field];
    if (row.date && value && top.includes(String(value))) {
      const key = `${monthStart(row.date)}|${value}`;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
  }
  return [...tally.keys()].sort().map((key) => {
    const [month, value] = key.split('|');
    return { month_start: month, [outputKey]: value, count: tally.get(key) ?? 0 };
  });
}

const percent = (part: number, total: number) => total ? `${(part / total * 100).toFixed(1)}%` : '0%';
const monthLabel = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
const isHigh = (row: CrimeRow) => row.severity === 'High' || row.severity === 'Critical';

export function buildKpis(rows: CrimeRow[], totalRecords?: number) {
  const total = rows.length;
  const highCount = rows.filter(isHigh).length;
  const topArea = counts(rows, 'area', 1);
  const topType = counts(rows, 'crimeType', 1);
  const months = monthly(rows);
  const current = months[months.length - 1];
  const previous = months.length > 1 ? months[months.length - 2] : undefined;
  let change: number | null = null;
  if (current && previous && previous.count) change = (current.count - previous.count) / previous.count * 100;

  const items: Array<Record<string, unknown>> = [
  {
    id: 'total_incidents',
    label: 'Total incidents',
    value: total,
    context: `${percent(total, totalRecords || total)} of all recorded incidents`,
    icon: 'activity',
    tone: 'neutral'
  },
  {
    id: 'high_severity',
    label: 'High-severity incidents',
    value: highCount,
    context: `${percent(highCount, total)} rated High or Critical`,
    icon: 'shield-alert',
    tone: 'alert'
  },
  {
    id: 'top_area',
    label: 'Most affected area',
    value: topArea[0]?.[0] ?? '—',
    context: topArea[0] ? `${topArea[0][1].toLocaleString('en-US')} incidents` : 'No incidents',
    icon: 'map-pin',
    tone: 'analytics'
  },
  {
    id: 'top_crime_type',
    label: 'Most common crime type',
    value: topType[0]?.[0] ?? '—',
    context: topType[0] ? `${percent(topType[0][1], total)} of incidents` : 'No incidents',
    icon: 'tag',
    tone: 'neutral'
  }];

  if (current && previous) {
    const direction = change !== null && change > 0.5 ? 'up' : change !== null && change < -0.5 ? 'down' : 'flat';
    items.push({
      id: 'incident_change',
      label: 'Month-over-month change',
      value: change === null ? 'n/a' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      context: `${monthLabel(current.month_start)} vs ${monthLabel(previous.month_start)}`,
      icon: change !== null && change < 0 ? 'trending-down' : 'trending-up',
      tone: 'neutral',
      trend: { direction, value: `${current.count} vs ${previous.count}`, is_positive: change !== null && change <= 0 }
    });
  }
  return items;
}

export function buildInsights(rows: CrimeRow[]) {
  if (!rows.length) return [];
  const result: Array<{text: string;category: string;}> = [];
  const area = counts(rows, 'area', 1);
  const type = counts(rows, 'crimeType', 1);
  const period = counts(rows, 'timePeriod', 1);
  const months = monthly(rows);
  if (months.length > 1 && months[months.length - 2].count) {
    const last = months[months.length - 1];
    const prev = months[months.length - 2];
    const change = (last.count - prev.count) / prev.count * 100;
    result.push({
      text: `Incident volume ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% in ${monthLabel(last.month_start)} compared with ${monthLabel(prev.month_start)}.`,
      category: change >= 0 ? 'increase' : 'decrease'
    });
  }
  if (area[0])
  result.push({
    text: `${area[0][0]} has the highest recorded incidents (${area[0][1].toLocaleString('en-US')}, ${percent(area[0][1], rows.length)} of the filtered total).`,
    category: 'location'
  });
  if (type[0])
  result.push({
    text: `${type[0][0]} is the largest crime category at ${percent(type[0][1], rows.length)} of incidents.`,
    category: 'category'
  });
  if (period[0])
  result.push({
    text: `The highest incident count falls in the ${period[0][0].toLowerCase()} time period (${percent(period[0][1], rows.length)}).`,
    category: 'time'
  });
  result.push({
    text: `${percent(rows.filter(isHigh).length, rows.length)} of incidents are classified as High or Critical severity.`,
    category: 'severity'
  });
  return result;
}

const toUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);
const fmtLong = (date: Date) =>
`${String(date.getUTCDate()).padStart(2, '0')} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
const iso = (date: Date) => date.toISOString().slice(0, 10);

export function comparison(rows: CrimeRow[]) {
  if (!rows.length) return null;
  const endIso = rows.reduce((max, row) => row.date > max ? row.date : max, rows[0].date);
  const end = toUtc(endIso);
  const currentStart = addDays(end, -89);
  const previousStart = addDays(end, -179);
  const cs = iso(currentStart);
  const ps = iso(previousStart);
  const currentCount = rows.filter((row) => row.date >= cs && row.date <= endIso).length;
  const previousCount = rows.filter((row) => row.date >= ps && row.date < cs).length;
  return {
    current_label: `${fmtLong(currentStart)} – ${fmtLong(end)}`,
    previous_label: `${fmtLong(previousStart)} – ${fmtLong(addDays(currentStart, -1))}`,
    current_count: currentCount,
    previous_count: previousCount,
    change_pct: previousCount ? Math.round((currentCount - previousCount) / previousCount * 1000) / 10 : null
  };
}

export function areaLocation(rows: CrimeRow[]) {
  const points = rows.filter((row) => row.latitude !== null && row.longitude !== null);
  if (!points.length) return null;
  return {
    latitude: points.reduce((sum, row) => sum + (row.latitude as number), 0) / points.length,
    longitude: points.reduce((sum, row) => sum + (row.longitude as number), 0) / points.length
  };
}

export function buildHotspots(rows: CrimeRow[]) {
  const ranked = counts(rows, 'area').slice(0, 15);
  const maximum = ranked[0]?.[1] ?? 0;
  return ranked.map(([area, count], index) => {
    const areaRows = rows.filter((row) => row.area === area);
    const location = areaLocation(areaRows);
    return {
      rank: index + 1,
      area,
      incident_count: count,
      density_per_sq_km: null,
      share_pct: rows.length ? Math.round(count / rows.length * 1000) / 10 : null,
      dominant_crime_type: counts(areaRows, 'crimeType', 1)[0]?.[0] ?? null,
      high_severity_count: areaRows.filter(isHigh).length,
      risk_level:
      count >= maximum * 0.75 ? 'Very high' : count >= maximum * 0.5 ? 'High' : count >= maximum * 0.3 ? 'Elevated' : 'Moderate',
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null
    };
  });
}

const FILTER_FIELDS: Record<string, RowField> = {
  crime_type: 'crimeType',
  area: 'area',
  severity: 'severity',
  status: 'status',
  city: 'city',
  police_station: 'policeStation'
};

const splitValues = (value?: string) =>
(value ?? '').
split(',').
map((item) => item.trim()).
filter(Boolean);

export function applyFilters(rows: CrimeRow[], params: Record<string, string>, ignoreArea = false): CrimeRow[] {
  const start = params.start_date;
  const end = params.end_date;
  const checks: Array<[RowField, Set<string>]> = [];
  for (const [param, field] of Object.entries(FILTER_FIELDS)) {
    if (ignoreArea && param === 'area') continue;
    const values = splitValues(params[param]);
    if (values.length) checks.push([field, new Set(values)]);
  }
  const periods = splitValues(params.time_period);
  if (periods.length) checks.push(['timePeriod', new Set(periods)]);
  return rows.filter((row) => {
    if (start && row.date < start) return false;
    if (end && row.date > end) return false;
    return checks.every(([field, values]) => values.has(String(row[field] ?? '')));
  });
}