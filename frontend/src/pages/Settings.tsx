import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2Icon, ChevronDownIcon, LogOutIcon, RefreshCwIcon, ShieldCheckIcon } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { useAuthSession, useHealth } from '../hooks/useCrimeQueries';
import { useDataSource } from '../hooks/useDataSource';
import { authApi } from '../api/services';
import { reprobe } from '../api/client';
import { API_BASE_URL } from '../api/config';
import { ENDPOINT_REGISTRY } from '../api/endpoints';
import { friendlyError } from '../api/errors';
import { formatDateTime } from '../utils/format';
import { cn } from '../utils/cn';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const source = useDataSource();
  const health = useHealth();
  const session = useAuthSession();
  const queryClient = useQueryClient();
  const [testing, setTesting] = useState(false);
  const [registryOpen, setRegistryOpen] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    await reprobe();
    await queryClient.invalidateQueries();
    setTesting(false);
  };

  return (
    <div className="pb-10">
      <PageHeader title="Settings" description="Appearance, data connection and administrator access" />
      <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:px-6">
        <Panel title="Appearance" description="Applies across the app, charts and map basemap">
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Theme">
            {(
            [
            ['dark', 'Midnight', 'Deep navy for control rooms and long sessions'],
            ['light', 'Survey', 'Cool paper tones for offices and printouts']] as
            Array<[Theme, string, string]>).
            map(([value, label, hint]) =>
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              onClick={() => setTheme(value)}
              className={cn(
                'cv-focus flex items-center gap-4 rounded-xl border p-3 text-left transition-colors duration-150',
                theme === value ? 'border-primary/50 bg-primary/5' : 'border-line hover:border-line-strong'
              )}>

                <ThemeSwatch theme={value} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">{label}</span>
                  <span className="cv-caption">{hint}</span>
                </span>
                {theme === value && <CheckCircle2Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />}
              </button>
            )}
          </div>
        </Panel>

        <Panel
          title="Data connection"
          actions={
          <Button size="sm" loading={testing} onClick={testConnection} leadingIcon={<RefreshCwIcon className="h-3.5 w-3.5" />}>
              Test connection
            </Button>
          }>

          <div className="grid gap-4 sm:grid-cols-2">
            <dl className="space-y-2.5 text-sm">
              <Row label="Source">
                {source === 'live' ?
                <Badge tone="emerald" dot>CrimeVista API</Badge> :
                source === 'local' ?
                <Badge tone="primary" dot>Local analytics engine</Badge> :

                <Badge tone="amber" dot>Checking…</Badge>
                }
              </Row>
              <Row label="API base URL">
                <code className="break-all font-mono text-xs text-fg">{API_BASE_URL}</code>
              </Row>
              {health.isLoading ?
              <Skeleton className="h-16" /> :
              health.data ?
              <>
                  <Row label="Status">{health.data.status}</Row>
                  <Row label="Database">{health.data.databaseReady ? 'Ready' : 'Not ready'}</Row>
                  <Row label="Version">{health.data.version || '—'}</Row>
                  <Row label="Last updated">{formatDateTime(health.data.lastUpdated)}</Row>
                </> :

              <p className="text-sm text-amber">{friendlyError(health.error).description}</p>
              }
            </dl>
            <p className="rounded-lg bg-raised px-4 py-3 text-sm leading-relaxed text-muted">
              {source === 'local' ?
              'The CrimeVista server could not be reached from this origin, so the same analytics (filters, KPIs, trends, hotspot ranking, area profiles) run in your browser on the configured fallback CSV. The current example contains Nagpur records dated January 2022–June 2025; it is not a live or official feed. Uploads stay in this browser session; PDF and Excel reports need the server.' :
              'All analytics are computed by the CrimeVista FastAPI service. Filters are sent as query parameters, and results are cached briefly in the browser.'}
            </p>
          </div>
        </Panel>

        <AdminAccess live={source === 'live'} authenticated={Boolean(session.data?.authenticated)} onChange={() => queryClient.invalidateQueries({ queryKey: ['auth-session'] })} />

        <section className="cv-panel">
          <button
            type="button"
            onClick={() => setRegistryOpen(!registryOpen)}
            aria-expanded={registryOpen}
            className="cv-focus flex w-full items-center justify-between rounded-xl px-5 py-3.5 text-left">

            <span>
              <span className="cv-section-title block">Endpoint registry</span>
              <span className="cv-caption">{ENDPOINT_REGISTRY.length} API routes used by this frontend</span>
            </span>
            <ChevronDownIcon className={cn('h-4 w-4 text-subtle transition-transform duration-200', registryOpen && 'rotate-180')} aria-hidden />
          </button>
          {registryOpen &&
          <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-raised/60 text-left text-xs text-muted">
                    <th scope="col" className="py-2 pl-5 pr-3 font-medium">Method</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Path</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Purpose</th>
                    <th scope="col" className="py-2 pr-5 font-medium">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ENDPOINT_REGISTRY.map((endpoint) =>
                <tr key={`${endpoint.method}${endpoint.path}`}>
                      <td className="py-2 pl-5 pr-3 font-mono text-xs text-muted">{endpoint.method}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-fg">{endpoint.path}</td>
                      <td className="py-2 pr-3 text-muted">{endpoint.purpose}</td>
                      <td className="py-2 pr-5">{endpoint.auth ? <Badge tone="amber">Admin</Badge> : <Badge>Public</Badge>}</td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </section>
      </div>
    </div>);

}

function AdminAccess({ live, authenticated, onChange }: {live: boolean;authenticated: boolean;onChange: () => void;}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authApi.login(username, password);
      setPassword('');
      onChange();
    } catch (err) {
      const friendly = friendlyError(err);
      setError(friendly.status === 401 ? 'Those credentials weren’t accepted.' : friendly.description);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Administrator access" description="Required for uploading data and generating reports on the server">
      {!live ?
      <p className="text-sm text-muted">Sign-in is handled by the CrimeVista server. It becomes available when the app is connected to the API.</p> :
      authenticated ?
      <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-fg">
            <ShieldCheckIcon className="h-4 w-4 text-emerald" aria-hidden /> Signed in as administrator
          </p>
          <Button
          size="sm"
          leadingIcon={<LogOutIcon className="h-3.5 w-3.5" />}
          onClick={async () => {
            await authApi.logout().catch(() => undefined);
            onChange();
          }}>

            Sign out
          </Button>
        </div> :

      <form onSubmit={submit} className="grid max-w-xl gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label>
            <span className="cv-label">Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="cv-input mt-1" />
          </label>
          <label>
            <span className="cv-label">Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="cv-input mt-1" />
          </label>
          <Button type="submit" variant="primary" loading={busy}>
            Sign in
          </Button>
          {error &&
        <p role="alert" className="text-sm text-danger sm:col-span-3">
              {error}
            </p>
        }
        </form>
      }
    </Panel>);

}

function Row({ label, children }: {label: string;children: React.ReactNode;}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right text-fg">{children}</dd>
    </div>);

}

function ThemeSwatch({ theme }: {theme: Theme;}) {
  const dark = theme === 'dark';
  return (
    <span className="flex h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-line" aria-hidden>
      <span className="w-4" style={{ background: dark ? '#081221' : '#0A1526' }} />
      <span className="flex flex-1 flex-col gap-1 p-1.5" style={{ background: dark ? '#07111F' : '#EEF2F7' }}>
        <span className="h-2 rounded-sm" style={{ background: dark ? '#14243A' : '#FFFFFF' }} />
        <span className="flex flex-1 gap-1">
          <span className="flex-[2] rounded-sm" style={{ background: dark ? '#0E1B2E' : '#FFFFFF' }} />
          <span className="flex-1 rounded-sm" style={{ background: dark ? '#54A6FF' : '#1D5FD6' }} />
        </span>
      </span>
    </span>);

}