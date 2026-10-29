import type { ReportFormat, ReportSection } from '../types/operations';

export interface ReportPreset {
  id: string;
  label: string;
  description: string;
  sections: ReportSection[];
}

export const REPORT_PRESETS: ReportPreset[] = [
{
  id: 'briefing',
  label: 'Executive briefing',
  description: 'Summary, indicators, distributions and hotspots',
  sections: ['executive_summary', 'kpis', 'charts', 'hotspots']
},
{
  id: 'hotspot',
  label: 'Hotspot assessment',
  description: 'Where incidents concentrate, with headline indicators',
  sections: ['executive_summary', 'kpis', 'hotspots']
},
{
  id: 'export',
  label: 'Full record export',
  description: 'Everything, including the matching incident records',
  sections: ['executive_summary', 'kpis', 'charts', 'hotspots', 'records']
}];


export const REPORT_SECTIONS: Array<{id: ReportSection;label: string;}> = [
{ id: 'executive_summary', label: 'Executive summary' },
{ id: 'kpis', label: 'Key indicators' },
{ id: 'charts', label: 'Distributions' },
{ id: 'hotspots', label: 'Hotspot ranking' },
{ id: 'records', label: 'Incident records' }];


export const REPORT_FORMATS: Array<{id: ReportFormat;label: string;hint: string;}> = [
{ id: 'pdf', label: 'PDF', hint: 'Formatted document · records capped at 300' },
{ id: 'xlsx', label: 'Excel', hint: 'One sheet per section · all records' },
{ id: 'csv', label: 'CSV', hint: 'Matching records only' }];