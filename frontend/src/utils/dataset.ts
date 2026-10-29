/**
 * CSV ingestion — port of backend data_service.parse_csv / normalize_row.
 * Required columns, null-token cleaning, date coercion, lat/lng clamping and
 * crime_id de-duplication follow the server rules.
 */
import Papa from 'papaparse';
import type { CrimeRow } from '../types/crime';
import { timePeriodFor } from './analytics';

export const REQUIRED_COLUMNS = ['crime_id', 'date', 'area', 'crime_type', 'severity'];
const NULL_TOKENS = new Set(['', 'nan', 'none', 'null', 'nat', 'n/a']);

export interface ParsedDataset {
  rows: CrimeRow[];
  columns: string[];
  received: number;
  rejected: number;
  missingColumns: string[];
  messages: string[];
  errors: string[];
}

function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return NULL_TOKENS.has(text.toLowerCase()) ? null : text;
}

function parseDate(value: string | null): string | null {
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) {
    const date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString().slice(0, 10);
}

function parseCoordinate(value: string | null, limit: number): number | null {
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

export function parseCrimeCsv(text: string): ParsedDataset {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim().toLowerCase()
  });
  const columns = (result.meta.fields ?? []).filter(Boolean);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  const received = result.data.length;
  if (missingColumns.length) {
    return {
      rows: [],
      columns,
      received,
      rejected: received,
      missingColumns,
      messages: [],
      errors: [`Missing required columns: ${missingColumns.join(', ')}.`]
    };
  }

  const seen = new Set<string>();
  const rows: CrimeRow[] = [];
  let invalidDates = 0;
  let missingRequired = 0;
  let duplicates = 0;

  for (const raw of result.data) {
    const crimeId = clean(raw.crime_id);
    const date = parseDate(clean(raw.date));
    const area = clean(raw.area);
    const crimeType = clean(raw.crime_type);
    const severity = clean(raw.severity);
    if (!crimeId || !area || !crimeType || !severity) {
      missingRequired += 1;
      continue;
    }
    if (!date) {
      invalidDates += 1;
      continue;
    }
    if (seen.has(crimeId)) {
      duplicates += 1;
      continue;
    }
    seen.add(crimeId);
    const datetime = clean(raw.datetime);
    const time = clean(raw.time) ?? (datetime && datetime.includes('T') ? datetime.split('T')[1] : null);
    const age = Number(clean(raw.victim_age));
    rows.push({
      crimeId,
      date,
      time,
      city: clean(raw.city),
      area,
      crimeType,
      latitude: parseCoordinate(clean(raw.latitude), 90),
      longitude: parseCoordinate(clean(raw.longitude), 180),
      severity,
      status: clean(raw.status),
      victimAge: Number.isFinite(age) && clean(raw.victim_age) ? age : null,
      victimGender: clean(raw.victim_gender),
      weaponUsed: clean(raw.weapon_used),
      policeStation: clean(raw.police_station),
      description: clean(raw.description),
      source: clean(raw.source),
      timePeriod: timePeriodFor(time)
    });
  }

  rows.sort((a, b) => a.date === b.date ? a.crimeId.localeCompare(b.crimeId) : a.date < b.date ? -1 : 1);
  const messages: string[] = [];
  if (invalidDates) messages.push(`${invalidDates.toLocaleString('en-US')} rows rejected for unreadable dates.`);
  if (missingRequired) messages.push(`${missingRequired.toLocaleString('en-US')} rows rejected for missing required values.`);
  if (duplicates) messages.push(`${duplicates.toLocaleString('en-US')} duplicate crime_id rows skipped.`);

  return {
    rows,
    columns,
    received,
    rejected: received - rows.length,
    missingColumns: [],
    messages,
    errors: rows.length ? [] : ['No valid records were found in this file.']
  };
}

export interface CsvPreview {
  columns: string[];
  sample: Array<Record<string, string>>;
  rowCount: number;
  missingColumns: string[];
  invalidDateCount: number;
  missingCoordinateCount: number;
}

/** Browser-side pre-check used by the upload wizard before the file is sent. */
export async function previewCsvFile(file: File): Promise<CsvPreview> {
  const text = await file.text();
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim().toLowerCase(),
    transform: (value) => value.trim()
  });
  const columns = (result.meta.fields ?? []).filter(Boolean);
  let invalidDateCount = 0;
  let missingCoordinateCount = 0;
  for (const row of result.data) {
    if (columns.includes('date') && !parseDate(clean(row.date))) invalidDateCount += 1;
    if (!clean(row.latitude) || !clean(row.longitude)) missingCoordinateCount += 1;
  }
  return {
    columns,
    sample: result.data.slice(0, 8),
    rowCount: result.data.length,
    missingColumns: REQUIRED_COLUMNS.filter((column) => !columns.includes(column)),
    invalidDateCount,
    missingCoordinateCount
  };
}