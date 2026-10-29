import React from 'react';
import { BrandMark } from '../layout/BrandMark';
import { Skeleton } from '../ui/Skeleton';
import { formatDate, formatNumber } from '../../utils/format';
import type { DashboardOverview, Hotspot } from '../../types/crime';
import type { ReportFormat, ReportSection } from '../../types/operations';

interface ReportDocumentProps {
  title: string;
  format: ReportFormat;
  sections: ReportSection[];
  scope: string[];
  overview?: DashboardOverview;
  hotspots?: Hotspot[];
}

/** Paper-like live preview of the report contents, computed from the same filters the server will use. */
export function ReportDocument({ title, format, sections, scope, overview, hotspots = [] }: ReportDocumentProps) {
  const has = (section: ReportSection) => sections.includes(section);
  const csvOnly = format === 'csv';
  return (
    <article
      aria-label="Report preview"
      className="mx-auto w-full max-w-[720px] rounded-md border border-[#D9DFE7] bg-white text-[#0B1628] shadow-lift"
      style={{ fontFamily: 'Inter, sans-serif' }}>

      <header className="flex items-start justify-between gap-6 border-b border-[#E3E8EF] px-8 pb-5 pt-7">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-[#1D5FD6]">CRIMEVISTA · INTELLIGENCE REPORT</p>
          <h2 className="mt-1.5 text-xl font-semibold leading-snug">{title || 'Untitled report'}</h2>
          <p className="mt-1 text-xs text-[#5B6B82]">Preview · {format.toUpperCase()} · generated on request</p>
        </div>
        <BrandMark className="h-9 w-9 shrink-0" />
      </header>

      <div className="space-y-6 px-8 py-6 text-[13px] leading-relaxed">
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6B82]">Scope</h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
            <dt className="text-[#5B6B82]">Matching records</dt>
            <dd className="text-right font-semibold tabular-nums">{overview ? formatNumber(overview.meta.filtered) : '…'}</dd>
            {scope.map((line) => {
              const [label, value] = line.split('::');
              return (
                <React.Fragment key={line}>
                  <dt className="text-[#5B6B82]">{label}</dt>
                  <dd className="truncate text-right">{value}</dd>
                </React.Fragment>);

            })}
          </dl>
        </section>

        {csvOnly ?
        <section className="rounded-md bg-[#F3F6FA] px-4 py-3 text-[#3D4B60]">
            CSV exports contain the matching incident records only (crime_id, date, time, area, crime type, coordinates, severity, status and more). Section
            choices apply to PDF and Excel.
          </section> :

        <>
            {has('executive_summary') &&
          <section>
                <h3 className="border-b border-[#E3E8EF] pb-1.5 text-sm font-semibold">Executive summary</h3>
                {!overview ?
            <PreviewLines /> :
            overview.insights.length === 0 ?
            <p className="mt-2 text-[#5B6B82]">No incidents matched the selected report filters.</p> :

            <ul className="mt-2 list-disc space-y-1 pl-4">
                    {overview.insights.slice(0, 5).map((insight) =>
              <li key={insight.text}>{insight.text}</li>
              )}
                  </ul>
            }
              </section>
          }

            {has('kpis') &&
          <section>
                <h3 className="border-b border-[#E3E8EF] pb-1.5 text-sm font-semibold">Key indicators</h3>
                {!overview ?
            <PreviewLines /> :

            <table className="mt-2 w-full text-[12px]">
                    <tbody className="divide-y divide-[#EEF1F5]">
                      {overview.kpis.map((kpi) =>
                <tr key={kpi.id}>
                          <td className="py-1.5 text-[#5B6B82]">{kpi.label}</td>
                          <td className="py-1.5 text-right font-semibold tabular-nums">{typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-US') : kpi.value}</td>
                          <td className="hidden py-1.5 pl-4 text-right text-[#5B6B82] sm:table-cell">{kpi.context}</td>
                        </tr>
                )}
                    </tbody>
                  </table>
            }
              </section>
          }

            {has('charts') &&
          <section>
                <h3 className="border-b border-[#E3E8EF] pb-1.5 text-sm font-semibold">Distributions</h3>
                {!overview ?
            <PreviewLines /> :

            <div className="mt-3 grid gap-5 sm:grid-cols-2">
                    {[
              { label: 'Crime type', rows: overview.crimeTypes.slice(0, 5) },
              { label: 'Severity', rows: overview.severity }].
              map((group) => {
                const max = Math.max(1, ...group.rows.map((row) => row.count));
                return (
                  <div key={group.label}>
                          <p className="mb-1.5 text-[11px] font-medium text-[#5B6B82]">{group.label}</p>
                          {group.rows.map((row) =>
                    <div key={row.label} className="mb-1.5">
                              <div className="flex justify-between text-[12px]">
                                <span>{row.label}</span>
                                <span className="tabular-nums">{row.count.toLocaleString('en-US')}</span>
                              </div>
                              <div className="mt-0.5 h-1.5 rounded-full bg-[#EEF2F7]">
                                <div className="h-full rounded-full bg-[#1D5FD6]" style={{ width: `${row.count / max * 100}%` }} />
                              </div>
                            </div>
                    )}
                        </div>);

              })}
                  </div>
            }
              </section>
          }

            {has('hotspots') &&
          <section>
                <h3 className="border-b border-[#E3E8EF] pb-1.5 text-sm font-semibold">Hotspot ranking</h3>
                {hotspots.length === 0 ?
            <PreviewLines /> :

            <table className="mt-2 w-full text-[12px]">
                    <thead>
                      <tr className="text-left text-[#5B6B82]">
                        <th className="py-1 font-medium">#</th>
                        <th className="py-1 font-medium">Area</th>
                        <th className="py-1 text-right font-medium">Incidents</th>
                        <th className="py-1 text-right font-medium">Share</th>
                        <th className="hidden py-1 pl-3 font-medium sm:table-cell">Most common type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF1F5]">
                      {hotspots.slice(0, 6).map((hotspot) =>
                <tr key={hotspot.area}>
                          <td className="py-1.5 tabular-nums text-[#5B6B82]">{hotspot.rank}</td>
                          <td className="py-1.5 font-medium">{hotspot.area}</td>
                          <td className="py-1.5 text-right tabular-nums">{hotspot.incidentCount.toLocaleString('en-US')}</td>
                          <td className="py-1.5 text-right tabular-nums">{hotspot.sharePct?.toFixed(1)}%</td>
                          <td className="hidden py-1.5 pl-3 text-[#5B6B82] sm:table-cell">{hotspot.dominantCrimeType}</td>
                        </tr>
                )}
                    </tbody>
                  </table>
            }
                {hotspots.length > 6 && <p className="mt-1.5 text-[11px] text-[#5B6B82]">+ {hotspots.length - 6} more areas in the full report</p>}
              </section>
          }

            {has('records') &&
          <section>
                <h3 className="border-b border-[#E3E8EF] pb-1.5 text-sm font-semibold">Incident records</h3>
                <p className="mt-2 text-[#3D4B60]">
                  {overview ? formatNumber(overview.meta.filtered) : '…'} matching records.{' '}
                  {format === 'pdf' ? 'The PDF lists the first 300; choose Excel or CSV for the complete set.' : 'All records are included.'}
                </p>
              </section>
          }
          </>
        }
      </div>
      <footer className="flex justify-between border-t border-[#E3E8EF] px-8 py-3 text-[10px] text-[#7A889C]">
        <span>CrimeVista · Urban crime intelligence</span>
        <span>{overview?.meta.lastUpdated ? `Data updated ${formatDate(overview.meta.lastUpdated.slice(0, 10))}` : ''}</span>
      </footer>
    </article>);

}

function PreviewLines() {
  return (
    <div className="mt-2 space-y-1.5">
      <Skeleton className="h-3 w-full !bg-[#EEF2F7]" />
      <Skeleton className="h-3 w-4/5 !bg-[#EEF2F7]" />
    </div>);

}