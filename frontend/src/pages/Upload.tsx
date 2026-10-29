import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangleIcon, CheckCircle2Icon, CircleIcon, FileSpreadsheetIcon, Loader2Icon, LockIcon, XCircleIcon } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { UploadStepper } from '../components/upload/UploadStepper';
import { Dropzone } from '../components/upload/Dropzone';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useUpload, type FileCheck } from '../hooks/useUpload';
import { useAuthSession } from '../hooks/useCrimeQueries';
import { useDataSource } from '../hooks/useDataSource';
import { formatFileSize, formatNumber } from '../utils/format';
import type { UploadStage } from '../types/operations';
import { cn } from '../utils/cn';

const STAGES: Array<{id: UploadStage;label: string;hint: string;}> = [
{ id: 'queued', label: 'Received', hint: 'File accepted by the service' },
{ id: 'validating', label: 'Validating rows', hint: 'Dates, required values, duplicates' },
{ id: 'processing', label: 'Replacing dataset', hint: 'Writing valid records' },
{ id: 'completed', label: 'Analysis ready', hint: 'All views refreshed' }];


export function Upload() {
  const upload = useUpload();
  const session = useAuthSession();
  const source = useDataSource();
  const navigate = useNavigate();
  const config = upload.config.data;
  const needsAuth = source === 'live' && config?.requiresAuth && !session.data?.authenticated;
  const failed = upload.status?.stage === 'failed';

  return (
    <div className="pb-10">
      <PageHeader title="Upload Data" description="Replace the active dataset with a new CSV of incident records" />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="cv-panel min-w-0" aria-label="Upload wizard">
          <div className="border-b border-line px-5 py-4">
            <UploadStepper step={upload.step} failed={failed} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={upload.step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="p-5">

              {upload.step === 'select' &&
              <div className="space-y-4">
                  {needsAuth &&
                <div className="flex items-start gap-3 rounded-lg border border-amber/25 bg-amber/10 px-4 py-3">
                      <LockIcon className="mt-0.5 h-4 w-4 text-amber" aria-hidden />
                      <div className="text-sm">
                        <p className="font-medium text-fg">Administrator sign-in required to import</p>
                        <p className="cv-caption">
                          You can still validate and preview a file. <Link to="/settings" className="font-medium text-primary">Sign in from Settings</Link>
                        </p>
                      </div>
                    </div>
                }
                  <Dropzone accept={config?.acceptedExtensions ?? ['.csv']} maxMb={config?.maxFileSizeMb ?? 25} onFile={upload.selectFile} />
                </div>
              }

              {upload.step === 'validate' && upload.file &&
              <div className="space-y-5">
                  <FileSummary name={upload.file.name} size={upload.file.size} rows={upload.preview?.rowCount} />
                  <div>
                    <h2 className="cv-section-title">Pre-import checks</h2>
                    <p className="cv-caption">Run in your browser. The server repeats validation during import.</p>
                    <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                      {upload.analysing ?
                    Array.from({ length: 5 }).map((_, index) =>
                    <li key={index} className="flex items-center gap-3 px-4 py-3">
                              <Skeleton className="h-4 w-4 rounded-full" />
                              <Skeleton className="h-3 w-32" />
                              <Skeleton className="ml-auto h-3 w-40" />
                            </li>
                    ) :
                    upload.checks.map((check) => <CheckRow key={check.label} check={check} />)}
                    </ul>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <Button variant="ghost" onClick={upload.reset}>
                      Choose another file
                    </Button>
                    <Button variant="primary" disabled={upload.analysing || upload.blocking} onClick={() => upload.setStep('preview')}>
                      Continue to preview
                    </Button>
                  </div>
                </div>
              }

              {upload.step === 'preview' && upload.preview && upload.file &&
              <div className="space-y-5">
                  <FileSummary name={upload.file.name} size={upload.file.size} rows={upload.preview.rowCount} />
                  <div>
                    <h2 className="cv-section-title">First {upload.preview.sample.length} rows</h2>
                    <p className="cv-caption">Required columns are highlighted. Column names are matched exactly; renaming isn’t supported.</p>
                    <div className="mt-3 overflow-x-auto rounded-lg border border-line">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-raised/70">
                            {upload.preview.columns.map((column) =>
                          <th
                            key={column}
                            scope="col"
                            className={cn(
                              'whitespace-nowrap px-3 py-2 text-left font-mono font-medium',
                              config?.requiredColumns.includes(column) ? 'text-primary' : 'text-muted'
                            )}>

                                {column}
                              </th>
                          )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {upload.preview.sample.map((row, index) =>
                        <tr key={index}>
                              {upload.preview!.columns.map((column) =>
                          <td key={column} className="max-w-[220px] truncate whitespace-nowrap px-3 py-1.5 text-fg">
                                  {row[column] || <span className="text-subtle">—</span>}
                                </td>
                          )}
                            </tr>
                        )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-amber/25 bg-amber/10 px-4 py-3">
                    <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden />
                    <p className="text-sm text-fg">
                      Importing <span className="font-medium">replaces the entire active dataset</span>. Every page, report and the assistant will use the new
                      records once processing finishes.
                    </p>
                  </div>
                  {upload.submitError &&
                <div role="alert" className="rounded-lg border border-danger/25 bg-danger/10 px-4 py-3 text-sm">
                      <p className="font-medium text-fg">{upload.submitError.title}</p>
                      <p className="cv-caption">{upload.submitError.description}</p>
                      {upload.submitError.status === 401 &&
                  <Link to="/settings" className="mt-1 inline-block text-xs font-medium text-primary">
                          Sign in from Settings →
                        </Link>
                  }
                    </div>
                }
                  <div className="flex flex-wrap justify-between gap-2">
                    <Button variant="ghost" onClick={() => upload.setStep('validate')}>
                      Back
                    </Button>
                    <Button variant="primary" loading={upload.submitting} onClick={upload.startImport}>
                      Import and replace dataset
                    </Button>
                  </div>
                </div>
              }

              {upload.step === 'import' &&
              <div className="mx-auto max-w-md py-4">
                  <p className="text-center text-sm font-medium text-fg">Importing {upload.file?.name}</p>
                  <p className="cv-caption text-center">You can leave this page — processing continues on the server.</p>
                  <ol className="mt-6 space-y-1">
                    {STAGES.map((stage, index) => {
                    const currentIndex = STAGES.findIndex((item) => item.id === (upload.status?.stage ?? 'queued'));
                    const done = index < currentIndex;
                    const active = index === currentIndex;
                    return (
                      <li key={stage.id} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5', active && 'bg-primary/5')}>
                          {done ?
                        <CheckCircle2Icon className="h-5 w-5 text-emerald" aria-hidden /> :
                        active ?
                        <Loader2Icon className="h-5 w-5 animate-spin text-primary" aria-hidden /> :

                        <CircleIcon className="h-5 w-5 text-line-strong" aria-hidden />
                        }
                          <div>
                            <p className={cn('text-sm font-medium', done || active ? 'text-fg' : 'text-subtle')}>{stage.label}</p>
                            <p className="cv-caption">{stage.hint}</p>
                          </div>
                        </li>);

                  })}
                  </ol>
                </div>
              }

              {upload.step === 'complete' && upload.status &&
              <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    {failed ? <XCircleIcon className="h-8 w-8 text-danger" aria-hidden /> : <CheckCircle2Icon className="h-8 w-8 text-emerald" aria-hidden />}
                    <div>
                      <h2 className="text-base font-semibold text-fg">{failed ? 'Import failed — the active dataset was not changed' : 'Dataset imported'}</h2>
                      <p className="cv-caption">{upload.status.fileName}</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
                    {[
                  ['Rows received', upload.status.rowsReceived],
                  ['Valid records', upload.status.validRecords],
                  ['Imported', upload.status.rowsImported],
                  ['Rejected', upload.status.rowsRejected]].
                  map(([label, value]) =>
                  <div key={String(label)} className="bg-surface px-4 py-3">
                        <dt className="cv-label">{label}</dt>
                        <dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg">{formatNumber(value as number | null)}</dd>
                      </div>
                  )}
                  </dl>
                  {upload.status.detectedArea && <p className="text-sm text-muted">Detected a single area: <span className="font-medium text-fg">{upload.status.detectedArea}</span></p>}
                  {!upload.status.detectedArea && upload.status.areas.length > 0 &&
                <p className="text-sm text-muted">
                      <span className="font-medium text-fg">{upload.status.areas.length}</span> areas in the new dataset.
                    </p>
                }
                  {[...upload.status.errors, ...upload.status.messages].length > 0 &&
                <ul className="space-y-1.5 rounded-lg bg-raised px-4 py-3 text-sm">
                      {upload.status.errors.map((message) =>
                  <li key={message} className="flex gap-2 text-danger">
                          <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {message}
                        </li>
                  )}
                      {upload.status.messages.map((message) =>
                  <li key={message} className="flex gap-2 text-muted">
                          <CircleIcon className="mt-1.5 h-2 w-2 shrink-0 fill-current" aria-hidden /> {message}
                        </li>
                  )}
                    </ul>
                }
                  <div className="flex flex-wrap gap-2">
                    {!failed &&
                  <Button variant="primary" onClick={() => navigate('/dashboard')}>
                        View updated dashboard
                      </Button>
                  }
                    <Button onClick={upload.reset}>{failed ? 'Try another file' : 'Upload another file'}</Button>
                  </div>
                </div>
              }
            </motion.div>
          </AnimatePresence>
        </section>

        <aside className="space-y-4">
          <Panel title="File requirements">
            {!config ?
            <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div> :

            <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Format</dt>
                  <dd className="font-medium text-fg">{config.acceptedExtensions.join(', ').toUpperCase()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Maximum size</dt>
                  <dd className="font-medium text-fg">{config.maxFileSizeMb} MB</dd>
                </div>
                <div>
                  <dt className="text-muted">Required columns</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1">
                    {config.requiredColumns.map((column) =>
                  <code key={column} className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-2xs text-fg">
                        {column}
                      </code>
                  )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Recommended</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1">
                    {['time', 'latitude', 'longitude', 'status', 'police_station', 'description'].map((column) =>
                  <code key={column} className="rounded border border-line px-1.5 py-0.5 font-mono text-2xs text-muted">
                        {column}
                      </code>
                  )}
                  </dd>
                </div>
              </dl>
            }
          </Panel>
          <Panel title="How validation works">
            <ul className="space-y-2 text-sm text-muted">
              <li>Rows without a readable date or a required value are rejected.</li>
              <li>Duplicate <code className="font-mono text-xs">crime_id</code> rows are skipped.</li>
              <li>Out-of-range coordinates are cleared; those rows stay but won’t appear on the map.</li>
              <li>If required columns are missing, the whole file is rejected.</li>
            </ul>
          </Panel>
        </aside>
      </div>
    </div>);

}

function FileSummary({ name, size, rows }: {name: string;size: number;rows?: number;}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-raised/50 px-4 py-3">
      <FileSpreadsheetIcon className="h-8 w-8 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{name}</p>
        <p className="cv-caption">
          {formatFileSize(size)}
          {rows !== undefined && ` · ${rows.toLocaleString('en-US')} rows`}
        </p>
      </div>
    </div>);

}

function CheckRow({ check }: {check: FileCheck;}) {
  const Icon = check.severity === 'ok' ? CheckCircle2Icon : check.severity === 'warning' ? AlertTriangleIcon : XCircleIcon;
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Icon className={cn('h-4 w-4 shrink-0', check.severity === 'ok' ? 'text-emerald' : check.severity === 'warning' ? 'text-amber' : 'text-danger')} aria-hidden />
      <span className="text-sm font-medium text-fg">{check.label}</span>
      <span className="ml-auto text-right text-xs text-muted">{check.detail}</span>
    </li>);

}