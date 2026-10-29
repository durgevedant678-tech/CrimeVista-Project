import type { DataSource } from '../types/operations';
import { API_BASE_URL, API_PROBE_TIMEOUT_MS, API_REQUEST_TIMEOUT_MS } from './config';
import { ApiError, statusMessage } from './errors';
import { handleLocal } from './localBackend';

interface RequestOptions {
  params?: Record<string, string>;
  body?: unknown;
  form?: FormData;
  timeoutMs?: number;
}

let source: DataSource = 'probing';
const listeners = new Set<() => void>();
let probe: Promise<'live' | 'local'> | null = null;

function setSource(next: DataSource) {
  source = next;
  listeners.forEach((listener) => listener());
}

export function getDataSource(): DataSource {
  return source;
}

export function subscribeDataSource(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function resolveSource(): Promise<'live' | 'local'> {
  if (!probe) {
    probe = (async () => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/health`, { credentials: 'include' }, API_PROBE_TIMEOUT_MS);
        if (response.ok) return 'live' as const;
      } catch {

        // unreachable or blocked by CORS → use in-browser engine
      }return 'local' as const;
    })().then((resolved) => {
      setSource(resolved);
      return resolved;
    });
  }
  return probe;
}

/** Re-run the connectivity check (used by Settings → Test connection). */
export function reprobe(): Promise<'live' | 'local'> {
  probe = null;
  setSource('probing');
  return resolveSource();
}

export async function apiRequest<T>(method: 'GET' | 'POST', path: string, options: RequestOptions = {}): Promise<T> {
  const mode = await resolveSource();
  if (mode === 'local') return (await handleLocal(method, path, options)) as T;

  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(options.params ?? {}).forEach(([key, value]) => {
    if (value !== '') url.searchParams.set(key, value);
  });

  let response: Response;
  try {
    response = await fetchWithTimeout(
      url.toString(),
      {
        method,
        credentials: 'include',
        headers: options.form ? undefined : { 'Content-Type': 'application/json' },
        body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined)
      },
      options.timeoutMs ?? API_REQUEST_TIMEOUT_MS
    );
  } catch {
    throw new ApiError(0, 'Check your connection and try again.');
  }

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const payload = await response.json();
      if (typeof payload?.detail === 'string') detail = payload.detail;
    } catch {

      // non-JSON error body — ignore
    }throw new ApiError(response.status, statusMessage(response.status, detail));
  }
  return (await response.json()) as T;
}

export function resolveDownloadUrl(url: string): string {
  if (/^(blob:|https?:)/.test(url)) return url;
  const origin = new URL(API_BASE_URL, window.location.origin).origin;
  return `${origin}${url}`;
}