import type { CategoryCount, MultiSeries, PeriodComparison, TimeSeriesPoint } from '../types/crime';
import { formatMonth, monthName } from './format';

export interface SeasonalPoint {
  month: string;
  average: number;
  years: number;
}

/** Average incidents per calendar month across all years present in the series. */
export function seasonality(monthly: TimeSeriesPoint[]): SeasonalPoint[] {
  const buckets = Array.from({ length: 12 }, () => ({ total: 0, years: 0 }));
  for (const point of monthly) {
    const index = Number(point.date.slice(5, 7)) - 1;
    if (index < 0 || index > 11) continue;
    buckets[index].total += point.count;
    buckets[index].years += 1;
  }
  return buckets.map((bucket, index) => ({
    month: monthName(index),
    average: bucket.years ? Math.round(bucket.total / bucket.years) : 0,
    years: bucket.years
  }));
}

export interface Observation {
  title: string;
  detail: string;
  tone: 'up' | 'down' | 'neutral';
}

/** Deterministic observations derived from the trend payload. */
export function buildObservations(
monthly: TimeSeriesPoint[],
crimeTypeTrend: MultiSeries,
timeOfDay: CategoryCount[],
comparison: PeriodComparison | null)
: Observation[] {
  const result: Observation[] = [];
  if (comparison && comparison.changePct !== null) {
    const up = comparison.changePct > 0;
    result.push({
      title: `${up ? 'Up' : 'Down'} ${Math.abs(comparison.changePct).toFixed(1)}% over the latest 90 days`,
      detail: `${comparison.currentCount.toLocaleString('en-US')} incidents vs ${comparison.previousCount.toLocaleString('en-US')} in the prior 90 days.`,
      tone: up ? 'up' : 'down'
    });
  }
  if (monthly.length >= 2) {
    const peak = monthly.reduce((best, point) => point.count > best.count ? point : best, monthly[0]);
    const low = monthly.reduce((best, point) => point.count < best.count ? point : best, monthly[0]);
    result.push({
      title: `Busiest month: ${formatMonth(peak.date)}`,
      detail: `${peak.count.toLocaleString('en-US')} incidents, against a low of ${low.count.toLocaleString('en-US')} in ${formatMonth(low.date)}.`,
      tone: 'neutral'
    });
  }
  if (crimeTypeTrend.points.length >= 6) {
    const last = crimeTypeTrend.points.slice(-3);
    const prev = crimeTypeTrend.points.slice(-6, -3);
    let best: {key: string;pct: number;now: number;} | null = null;
    for (const key of crimeTypeTrend.keys) {
      const now = last.reduce((sum, point) => sum + Number(point[key] ?? 0), 0);
      const before = prev.reduce((sum, point) => sum + Number(point[key] ?? 0), 0);
      if (!before) continue;
      const pct = (now - before) / before * 100;
      if (!best || Math.abs(pct) > Math.abs(best.pct)) best = { key, pct, now };
    }
    if (best) {
      result.push({
        title: `${best.key} shows the largest shift`,
        detail: `${best.pct > 0 ? '+' : ''}${best.pct.toFixed(1)}% in the last 3 months vs the 3 before (among the top 5 crime types).`,
        tone: best.pct > 0 ? 'up' : 'down'
      });
    }
  }
  if (timeOfDay.length) {
    const total = timeOfDay.reduce((sum, item) => sum + item.count, 0);
    const peak = [...timeOfDay].sort((a, b) => b.count - a.count)[0];
    result.push({
      title: `${peak.label} is the peak period`,
      detail: `${(peak.count / Math.max(1, total) * 100).toFixed(1)}% of incidents are recorded in the ${peak.label.toLowerCase()}.`,
      tone: 'neutral'
    });
  }
  return result;
}