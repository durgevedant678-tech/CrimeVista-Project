import type { Insight, Kpi } from './crime';

export interface UploadConfig {
  acceptedExtensions: string[];
  maxFileSizeMb: number;
  requiredColumns: string[];
  requiresAuth: boolean;
}

export type UploadStage = 'queued' | 'validating' | 'processing' | 'completed' | 'failed';

export interface UploadStatus {
  uploadId: string;
  fileName: string;
  stage: UploadStage;
  areas: string[];
  detectedArea: string | null;
  validRecords: number | null;
  rowsReceived: number | null;
  rowsImported: number | null;
  rowsRejected: number | null;
  analysisStatus: string;
  messages: string[];
  errors: string[];
}

export type ReportFormat = 'pdf' | 'xlsx' | 'csv';
export type ReportSection = 'executive_summary' | 'kpis' | 'charts' | 'hotspots' | 'records';

export interface ReportRequest {
  title: string;
  format: ReportFormat;
  sections: ReportSection[];
  filters: Record<string, string>;
}

export interface ReportResult {
  reportId: string;
  title: string;
  format: ReportFormat;
  status: string;
  createdAt: string;
  downloadUrl: string;
  preview: {
    summary: Insight[];
    recordCount: number;
    kpis: Kpi[];
  } | null;
}

export interface ChatRequest {
  message: string;
  page: string;
  filters: Record<string, string>;
  selectedArea: string | null;
  selectedIncident: string | null;
}

export interface ChatResponse {
  answer: string;
  provider: 'openai' | 'fallback' | string;
  suggestedActions: string[];
}

export type DataSource = 'probing' | 'live' | 'local';