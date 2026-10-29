/**
 * In-browser mirror of the FastAPI routes. Used only when the live API is unreachable.
 * Every response is computed from the configured fallback dataset with the same logic
 * as the backend services, and returns the same raw JSON contract.
 */
import Papa from 'papaparse';
import type { CrimeRow } from '../types/crime';
import type { UploadStatus } from '../types/operations';
import {
  SEVERITY_ORDER,
  TIME_PERIODS,
  applyFilters,
  areaLocation,
  buildHotspots,
  buildInsights,
  buildKpis,
  comparison,
  counts,
  distribution,
  monthly,
  monthlyBy } from
'../utils/analytics';
import { parseCrimeCsv } from '../utils/dataset';
import { buildFallbackAnswer } from '../utils/assistantFallback';
import { DATASET_URLS } from './config';
import { ApiError } from './errors';

interface RequestOptions {
  params?: Record<string, string>;
  body?: unknown;
  form?: FormData;
}

let rowsPromise: Promise<CrimeRow[]> | null = null;
let lastUpdated: string | null = null;
const uploads = new Map<string, UploadStatus>();
const reports: Array<Record<string, unknown>> = [];
let uploadBusy = false;

async function loadBundled(): Promise<CrimeRow[]> {
  for (const url of DATASET_URLS) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const parsed = parseCrimeCsv(await response.text());
      if (parsed.rows.length) {
        lastUpdated = new Date().toISOString();
        return parsed.rows;
      }
    } catch {

      // try next mirror
    }}
  throw new ApiError(0, 'The bundled dataset could not be downloaded.');
}

function getRows(): Promise<CrimeRow[]> {
  if (!rowsPromise) {
    rowsPromise = loadBundled().catch((error) => {
      rowsPromise = null;
      throw error;
    });
  }
  return rowsPromise;
}

const envelope = (filtered: CrimeRow[], all: CrimeRow[]) => ({
  recordCount: { filtered: filtered.length, total: all.length },
  demoMode: false,
  lastUpdated
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const CRIME_COLUMNS: Array<[string, keyof CrimeRow]> = [
['crime_id', 'crimeId'],
['date', 'date'],
['time', 'time'],
['city', 'city'],
['area', 'area'],
['crime_type', 'crimeType'],
['latitude', 'latitude'],
['longitude', 'longitude'],
['severity', 'severity'],
['status', 'status'],
['victim_age', 'victimAge'],
['victim_gender', 'victimGender'],
['weapon_used', 'weaponUsed'],
['police_station', 'policeStation'],
['description', 'description'],
['source', 'source']];


async function processUpload(id: string, file: File) {
  const update = (patch: Partial<UploadStatus>) => {
    const current = uploads.get(id);
    if (current) uploads.set(id, { ...current, ...patch });
  };
  try {
    await delay(250);
    update({ stage: 'validating' });
    const parsed = parseCrimeCsv(await file.text());
    if (!parsed.rows.length) {
      update({
        stage: 'failed',
        rowsReceived: parsed.received,
        rowsRejected: parsed.rejected,
        analysisStatus: 'failed',
        errors: parsed.errors,
        messages: parsed.messages
      });
      return;
    }
    update({ stage: 'processing', rowsReceived: parsed.received, validRecords: parsed.rows.length });
    await delay(250);
    rowsPromise = Promise.resolve(parsed.rows);
    lastUpdated = new Date().toISOString();
    const areas = [...new Set(parsed.rows.map((row) => row.area))].sort();
    update({
      stage: 'completed',
      areas,
      detectedArea: areas.length === 1 ? areas[0] : null,
      rowsImported: parsed.rows.length,
      rowsRejected: parsed.rejected,
      analysisStatus: 'completed',
      messages: [`Imported ${parsed.rows.length.toLocaleString('en-US')} records.`, ...parsed.messages]
    });
  } catch {
    update({ stage: 'failed', analysisStatus: 'failed', errors: ['The file could not be read.'] });
  } finally {
    uploadBusy = false;
  }
}

export async function handleLocal(method: string, path: string, options: RequestOptions = {}): Promise<unknown> {
  const params = options.params ?? {};

  if (method === 'GET' && path === '/health') {
    const rows = await getRows().catch(() => null);
    return { status: 'ok', databaseReady: Boolean(rows), demoMode: false, lastUpdated, version: '1.0.0' };
  }
  if (path === '/auth/session') return { authenticated: false };
  if (path === '/auth/login' || path === '/auth/logout') {
    throw new ApiError(503, 'Administrator sign-in is available when connected to the CrimeVista server.');
  }
  if (method === 'POST' && path === '/chat') {
    const body = (options.body ?? {}) as Record<string, unknown>;
    return buildFallbackAnswer(String(body.message ?? ''), {
      page: String(body.page ?? 'general'),
      filters: body.filters as Record<string, string> ?? {},
      selectedArea: body.selectedArea as string ?? null,
      selectedIncident: body.selectedIncident as string ?? null
    });
  }
  if (method === 'GET' && path === '/upload/config') {
    return { acceptedExtensions: ['.csv'], maxFileSizeMb: 25, requiredColumns: ['crime_id', 'date', 'area', 'crime_type', 'severity'], requiresAuth: false };
  }
  if (method === 'POST' && path === '/upload') {
    const file = options.form?.get('file');
    if (!(file instanceof File)) throw new ApiError(422, 'No file was provided.');
    if (!file.name.toLowerCase().endsWith('.csv')) throw new ApiError(422, 'Only .csv files are accepted.');
    if (file.size > 25 * 1024 * 1024) throw new ApiError(413, 'The file exceeds the 25 MB limit.');
    if (uploadBusy) throw new ApiError(409, 'Another upload is already being processed.');
    uploadBusy = true;
    const id = `upl_${Math.random().toString(36).slice(2, 12)}`;
    const status: UploadStatus = {
      uploadId: id,
      fileName: file.name,
      stage: 'queued',
      areas: [],
      detectedArea: null,
      validRecords: null,
      rowsReceived: null,
      rowsImported: null,
      rowsRejected: null,
      analysisStatus: 'pending',
      messages: [],
      errors: []
    };
    uploads.set(id, status);
    void processUpload(id, file);
    return status;
  }
  const uploadMatch = /^\/upload\/([^/]+)\/status$/.exec(path);
  if (uploadMatch) {
    const status = uploads.get(decodeURIComponent(uploadMatch[1]));
    if (!status) throw new ApiError(404, 'Upload not found.');
    return status;
  }

  const all = await getRows();

  if (method === 'GET' && path === '/filters/options') {
    const unique = (field: 'crimeType' | 'area' | 'severity' | 'status' | 'policeStation') =>
    [...new Set(all.map((row) => row[field]).filter((value): value is string => Boolean(value)))].sort();
    return {
      crimeTypes: unique('crimeType'),
      areas: unique('area'),
      severities: SEVERITY_ORDER.filter((value) => unique('severity').includes(value)),
      timePeriods: TIME_PERIODS,
      dateRange: { min: all[0]?.date ?? null, max: all[all.length - 1]?.date ?? null },
      additional: [
      { key: 'status', label: 'Status', options: unique('status') },
      { key: 'police_station', label: 'Police station', options: unique('policeStation') }]

    };
  }

  if (method === 'GET' && path === '/dashboard/overview') {
    const rows = applyFilters(all, params);
    return {
      ...envelope(rows, all),
      kpis: buildKpis(rows, all.length),
      insights: buildInsights(rows),
      charts: {
        crimeTypeDistribution: distribution(rows, 'crimeType', 'crime_type', 8),
        areaDistribution: distribution(rows, 'area', 'area', 10),
        monthlyTrend: monthly(rows),
        severityDistribution: distribution(rows, 'severity', 'severity', undefined, SEVERITY_ORDER),
        timeOfDayDistribution: distribution(rows, 'timePeriod', 'time_period', undefined, TIME_PERIODS)
      }
    };
  }

  if (method === 'GET' && path === '/crimes') {
    const rows = applyFilters(all, params);
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(params.page_size ?? 10)));
    return {
      page,
      pageSize,
      total: rows.length,
      items: rows.slice((page - 1) * pageSize, page * pageSize).map((row) => ({
        id: row.crimeId,
        crime_type: row.crimeType,
        area: row.area,
        severity: row.severity,
        time_period: row.timePeriod,
        date: row.date,
        description: row.description,
        status: row.status,
        latitude: row.latitude,
        longitude: row.longitude
      }))
    };
  }

  if (method === 'GET' && path === '/analytics/trends') {
    const rows = applyFilters(all, params);
    return {
      ...envelope(rows, all),
      monthlyTrend: monthly(rows),
      crimeTypeTrend: monthlyBy(rows, 'crimeType', 'crime_type', 5),
      severityTrend: monthlyBy(rows, 'severity', 'severity', 4),
      areaTrend: monthlyBy(rows, 'area', 'area', 5),
      timeOfDayDistribution: distribution(rows, 'timePeriod', 'time_period', undefined, TIME_PERIODS),
      comparison: comparison(rows)
    };
  }

  if (method === 'GET' && path === '/analytics/hotspots') {
    const rows = applyFilters(all, params);
    return {
      ...envelope(rows, all),
      hotspots: buildHotspots(rows),
      crimeTypeBreakdown: distribution(rows, 'crimeType', 'crime_type', 10),
      severityBreakdown: distribution(rows, 'severity', 'severity', undefined, SEVERITY_ORDER)
    };
  }

  const areaMatch = /^\/analytics\/areas\/(.+)$/.exec(path);
  if (method === 'GET' && areaMatch) {
    const area = decodeURIComponent(areaMatch[1]);
    if (!all.some((row) => row.area === area)) throw new ApiError(404, `Area "${area}" was not found.`);
    const cityRows = applyFilters(all, params, true);
    const rows = cityRows.filter((row) => row.area === area);
    const comparisonList = counts(cityRows, 'area', 10);
    if (!comparisonList.some(([name]) => name === area)) comparisonList.push([area, rows.length]);
    return {
      ...envelope(rows, all),
      area,
      totalIncidents: rows.length,
      kpis: buildKpis(rows, all.length).filter((kpi) => kpi.id !== 'top_area' && kpi.id !== 'total_incidents'),
      crimeTypeDistribution: distribution(rows, 'crimeType', 'crime_type', 10),
      severityDistribution: distribution(rows, 'severity', 'severity', undefined, SEVERITY_ORDER),
      timeOfDayDistribution: distribution(rows, 'timePeriod', 'time_period', undefined, TIME_PERIODS),
      monthlyTrend: monthly(rows),
      areaComparison: comparisonList.map(([name, count]) => ({ area: name, count })),
      location: areaLocation(rows)
    };
  }

  if (method === 'GET' && path === '/map/incidents') {
    const rows = applyFilters(all, params);
    const located = rows.filter((row) => row.latitude !== null && row.longitude !== null);
    return {
      ...envelope(rows, all),
      locationAvailable: located.length > 0,
      missingLocationCount: rows.length - located.length,
      incidents: located.slice(0, 3000).map((row) => ({
        id: row.crimeId,
        crime_type: row.crimeType,
        severity: row.severity,
        area: row.area,
        date: row.date,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude
      })),
      boundaries: []
    };
  }

  if (method === 'GET' && path === '/reports') return reports;

  if (method === 'POST' && path === '/reports/generate') {
    const body = (options.body ?? {}) as {title?: string;format?: string;filters?: Record<string, string>;};
    if (body.format !== 'csv') {
      throw new ApiError(501, 'PDF and Excel files are rendered by the CrimeVista server. Choose CSV, or connect to the server.');
    }
    const rows = applyFilters(all, body.filters ?? {});
    const csv = Papa.unparse({
      fields: CRIME_COLUMNS.map(([column]) => column),
      data: rows.map((row) => CRIME_COLUMNS.map(([, key]) => row[key] ?? ''))
    });
    const reportId = `rpt_${Math.random().toString(16).slice(2, 14)}`;
    const report = {
      reportId,
      title: body.title ?? 'CrimeVista report',
      format: 'csv',
      status: 'ready',
      createdAt: new Date().toISOString(),
      downloadUrl: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      preview: { summary: buildInsights(rows).slice(0, 4), recordCount: rows.length, kpis: buildKpis(rows) }
    };
    reports.unshift(report);
    return report;
  }

  throw new ApiError(404, 'This endpoint is not available.');
}