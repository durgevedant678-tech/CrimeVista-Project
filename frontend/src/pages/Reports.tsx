import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2Icon, DownloadIcon, FileTextIcon, LockIcon, FileSpreadsheetIcon, FileIcon } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { ReportDocument } from '../components/reports/ReportDocument';
import { MultiSelect } from '../components/filters/MultiSelect';
import { DateRangeControl } from '../components/filters/DateRangeControl';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Segmented } from '../components/ui/Segmented';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useDashboard, useFilterOptions, useHotspots, useReportHistory } from '../hooks/useCrimeQueries';
import { useDataSource } from '../hooks/useDataSource';
import { useFilters } from '../contexts/FilterContext';
import { reportsApi } from '../api/services';
import { resolveDownloadUrl } from '../api/client';
import { toQueryParams } from '../api/adapters';
import { friendlyError } from '../api/errors';
import { REPORT_FORMATS, REPORT_PRESETS, REPORT_SECTIONS } from '../data/reportPresets';
import { formatDate, formatDateTime, formatNumber } from '../utils/format';
import type { CrimeFilters } from '../types/crime';
import type { ReportFormat, ReportResult, ReportSection } from '../types/operations';
import { cn } from '../utils/cn';

const FORMAT_ICON: Record<ReportFormat, React.ElementType> = { pdf: FileIcon, xlsx: FileSpreadsheetIcon, csv: FileTextIcon };

export function Reports() {
  const { filters: globalFilters } = useFilters();
  const options = useFilterOptions();
  const source = useDataSource();
  const queryClient = useQueryClient();
  const history = useReportHistory();

  const [title, setTitle] = useState('Urban crime intelligence briefing');
  const [presetId, setPresetId] = useState('briefing');
  const [sections, setSections] = useState<ReportSection[]>(REPORT_PRESETS[0].sections);
  const [format, setFormat] = useState<ReportFormat>(source === 'local' ? 'csv' : 'pdf');
  const [scope, setScope] = useState<CrimeFilters>(globalFilters);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<ReturnType<typeof friendlyError> | null>(null);

  const overview = useDashboard(scope);
  const hotspots = useHotspots(scope);
  const serverOnly = source === 'local';
  const effectiveFormat: ReportFormat = serverOnly ? 'csv' : format;

  const scopeLines = useMemo(() => {
    const lines = [`Date range::${scope.startDate || scope.endDate ? `${formatDate(scope.startDate)} – ${formatDate(scope.endDate)}` : 'All recorded data'}`];
    lines.push(`Areas::${scope.area.length ? scope.area.join(', ') : 'All areas'}`);
    lines.push(`Crime types::${scope.crimeType.length ? scope.crimeType.join(', ') : 'All types'}`);
    lines.push(`Severity::${scope.severity.length ? scope.severity.join(', ') : 'All levels'}`);
    if (scope.timePeriod.length) lines.push(`Time of day::${scope.timePeriod.join(', ')}`);
    return lines;
  }, [scope]);

  const choosePreset = (id: string) => {
    setPresetId(id);
    const preset = REPORT_PRESETS.find((item) => item.id === id);
    if (preset) setSections(preset.sections);
  };
  const toggleSection = (id: ReportSection) => {
    setPresetId('custom');
    setSections((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const report = await reportsApi.generate({ title: title.trim() || 'CrimeVista report', format: effectiveFormat, sections, filters: toQueryParams(scope) });
      setResult(report);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setGenerating(false);
    }
  };

  const historyStatus = (history.error as {status?: number;} | null)?.status;

  return (
    <div className="pb-10">
      <PageHeader title="Reports" description="Build a briefing document from any slice of the data" />

      <div className="grid gap-4 px-4 sm:px-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel title="1 · Report type">
            <div className="space-y-1.5" role="radiogroup" aria-label="Report type">
              {REPORT_PRESETS.map((preset) =>
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={presetId === preset.id}
                onClick={() => choosePreset(preset.id)}
                className={cn(
                  'cv-focus flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150',
                  presetId === preset.id ? 'border-primary/40 bg-primary/5' : 'border-line hover:border-line-strong'
                )}>

                  <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', presetId === preset.id ? 'border-primary' : 'border-line-strong')}>
                    {presetId === preset.id && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-fg">{preset.label}</span>
                    <span className="cv-caption">{preset.description}</span>
                  </span>
                </button>
              )}
            </div>
            <fieldset className="mt-4">
              <legend className="cv-label mb-2">Sections {presetId === 'custom' && <span className="text-primary">· custom</span>}</legend>
              <div className="flex flex-wrap gap-1.5">
                {REPORT_SECTIONS.map((section) => {
                  const on = sections.includes(section.id);
                  return (
                    <button
                      key={section.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        'cv-focus rounded-md border px-2 py-1 text-xs font-medium transition-colors duration-150',
                        on ? 'border-primary/40 bg-primary/10 text-primary' : 'border-line text-muted hover:text-fg'
                      )}>

                      {section.label}
                    </button>);

                })}
              </div>
            </fieldset>
          </Panel>

          <Panel
            title="2 · Scope"
            description="Starts from your current filters"
            actions={
            <button type="button" onClick={() => setScope(globalFilters)} className="cv-focus rounded text-xs font-medium text-primary">
                Use current filters
              </button>
            }>

            <div className="space-y-2.5">
              <DateRangeControl
                variant="field"
                start={scope.startDate}
                end={scope.endDate}
                min={options.data?.dateRange.min ?? null}
                max={options.data?.dateRange.max ?? null}
                onChange={(startDate, endDate) => setScope((current) => ({ ...current, startDate, endDate }))} />

              <MultiSelect variant="field" label="Area" options={options.data?.areas ?? []} value={scope.area} onChange={(area) => setScope((c) => ({ ...c, area }))} />
              <MultiSelect variant="field" label="Crime type" options={options.data?.crimeTypes ?? []} value={scope.crimeType} onChange={(crimeType) => setScope((c) => ({ ...c, crimeType }))} />
              <MultiSelect variant="field" label="Severity" options={options.data?.severities ?? []} value={scope.severity} onChange={(severity) => setScope((c) => ({ ...c, severity }))} />
            </div>
          </Panel>

          <Panel title="3 · Output">
            <label className="block">
              <span className="cv-label">Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} className="cv-input mt-1" />
            </label>
            <div className="mt-3">
              <span className="cv-label">Format</span>
              <Segmented
                label="Format"
                value={effectiveFormat}
                onChange={setFormat}
                size="md"
                className="mt-1 flex w-full [&>button]:flex-1 [&>button]:justify-center"
                options={REPORT_FORMATS.map((item) => ({ value: item.id, label: item.label, disabled: serverOnly && item.id !== 'csv' }))} />

              <p className="cv-caption mt-1.5">
                {serverOnly ?
                'PDF and Excel are rendered by the CrimeVista server, which isn’t connected from here. CSV is generated in the browser.' :
                REPORT_FORMATS.find((item) => item.id === effectiveFormat)?.hint}
              </p>
            </div>
            <Button
              variant="primary"
              className="mt-4 w-full"
              loading={generating}
              disabled={!sections.length && effectiveFormat !== 'csv'}
              onClick={generate}
              leadingIcon={<FileTextIcon className="h-4 w-4" />}>

              {generating ? 'Generating report…' : `Generate ${effectiveFormat.toUpperCase()} report`}
            </Button>
            <AnimatePresence>
              {error &&
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-3 rounded-lg border border-amber/25 bg-amber/10 px-3 py-2.5 text-sm">
                  <p className="font-medium text-fg">{error.title}</p>
                  <p className="cv-caption">{error.description}</p>
                  {error.status === 401 &&
                <Link to="/settings" className="cv-focus mt-1 inline-block rounded text-xs font-medium text-primary">
                      Sign in from Settings →
                    </Link>
                }
                </motion.div>
              }
              {result &&
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-3 rounded-lg border border-emerald/25 bg-emerald/10 px-3 py-2.5">
                  <CheckCircle2Icon className="h-5 w-5 shrink-0 text-emerald" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">Report ready</p>
                    <p className="cv-caption">{formatNumber(result.preview?.recordCount)} records · {result.format.toUpperCase()}</p>
                  </div>
                  <a
                  href={resolveDownloadUrl(result.downloadUrl)}
                  download={`${result.title}.${result.format}`}
                  className="cv-focus inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-on-primary">

                    <DownloadIcon className="h-3.5 w-3.5" aria-hidden /> Download
                  </a>
                </motion.div>
              }
            </AnimatePresence>
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-line bg-sunken/60 p-4 sm:p-8">
            <ReportDocument
              title={title}
              format={effectiveFormat}
              sections={sections}
              scope={scopeLines}
              overview={overview.data}
              hotspots={hotspots.data?.hotspots} />

          </div>

          <Panel title="Report history" description="Reports generated in this session of the server">
            {historyStatus === 401 ?
            <div className="flex items-center gap-3 py-3 text-sm text-muted">
                <LockIcon className="h-4 w-4" aria-hidden />
                History is available to administrators.
                <Link to="/settings" className="cv-focus rounded font-medium text-primary">
                  Sign in
                </Link>
              </div> :
            history.isLoading ?
            <TableSkeleton rows={3} /> :
            !history.data?.length ?
            <p className="py-4 text-sm text-subtle">No reports generated yet. Your generated reports will be listed here.</p> :

            <ul className="divide-y divide-line">
                {history.data.map((report) => {
                const Icon = FORMAT_ICON[report.format] ?? FileIcon;
                return (
                  <li key={report.reportId} className="flex items-center gap-3 py-2.5">
                      <Icon className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{report.title}</p>
                        <p className="cv-caption">{formatDateTime(report.createdAt)}</p>
                      </div>
                      <Badge>{report.format.toUpperCase()}</Badge>
                      <a
                      href={resolveDownloadUrl(report.downloadUrl)}
                      download
                      aria-label={`Download ${report.title}`}
                      className="cv-focus rounded-md p-1.5 text-muted transition-colors duration-150 hover:bg-raised hover:text-fg">

                        <DownloadIcon className="h-4 w-4" aria-hidden />
                      </a>
                    </li>);

              })}
              </ul>
            }
          </Panel>
        </div>
      </div>
    </div>);

}