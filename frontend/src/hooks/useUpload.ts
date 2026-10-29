import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { uploadApi } from '../api/services';
import { friendlyError } from '../api/errors';
import { useFilters } from '../contexts/FilterContext';
import { previewCsvFile, type CsvPreview } from '../utils/dataset';
import type { UploadConfig, UploadStatus } from '../types/operations';

export type WizardStep = 'select' | 'validate' | 'preview' | 'import' | 'complete';

export interface FileCheck {
  label: string;
  ok: boolean;
  detail: string;
  severity: 'error' | 'warning' | 'ok';
}

const TERMINAL = new Set(['completed', 'failed']);

export function useUpload() {
  const queryClient = useQueryClient();
  const { resetFilters } = useFilters();
  const config = useQuery({ queryKey: ['upload-config'], queryFn: uploadApi.getConfig, staleTime: 10 * 60_000 });

  const [step, setStep] = useState<WizardStep>('select');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [checks, setChecks] = useState<FileCheck[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<{title: string;description: string;status: number;} | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const status = useQuery({
    queryKey: ['upload-status', uploadId],
    queryFn: () => uploadApi.getStatus(uploadId as string),
    enabled: Boolean(uploadId),
    refetchInterval: (query) => query.state.data && TERMINAL.has(query.state.data.stage) ? false : 1500
  });

  const selectFile = useCallback(
    async (next: File) => {
      setFile(next);
      setStep('validate');
      setAnalysing(true);
      setSubmitError(null);
      const cfg: UploadConfig | undefined = config.data;
      const accepted = cfg?.acceptedExtensions ?? ['.csv'];
      const maxMb = cfg?.maxFileSizeMb ?? 25;
      const extOk = accepted.some((ext) => next.name.toLowerCase().endsWith(ext));
      const sizeOk = next.size <= maxMb * 1024 * 1024;
      const result: FileCheck[] = [
      { label: 'File type', ok: extOk, severity: extOk ? 'ok' : 'error', detail: extOk ? 'CSV file' : `Accepted: ${accepted.join(', ')}` },
      { label: 'File size', ok: sizeOk, severity: sizeOk ? 'ok' : 'error', detail: sizeOk ? `Within ${maxMb} MB limit` : `Exceeds ${maxMb} MB limit` }];

      let parsed: CsvPreview | null = null;
      if (extOk && sizeOk) {
        try {
          parsed = await previewCsvFile(next);
          const columnsOk = parsed.missingColumns.length === 0;
          result.push({
            label: 'Required columns',
            ok: columnsOk,
            severity: columnsOk ? 'ok' : 'error',
            detail: columnsOk ? 'All required columns present' : `Missing: ${parsed.missingColumns.join(', ')}`
          });
          result.push({
            label: 'Rows detected',
            ok: parsed.rowCount > 0,
            severity: parsed.rowCount > 0 ? 'ok' : 'error',
            detail: parsed.rowCount > 0 ? `${parsed.rowCount.toLocaleString('en-US')} data rows` : 'The file has no data rows'
          });
          result.push({
            label: 'Readable dates',
            ok: parsed.invalidDateCount === 0,
            severity: parsed.invalidDateCount === 0 ? 'ok' : 'warning',
            detail:
            parsed.invalidDateCount === 0 ?
            'Every row has a valid date' :
            `${parsed.invalidDateCount.toLocaleString('en-US')} rows will be rejected`
          });
          result.push({
            label: 'Coordinates',
            ok: parsed.missingCoordinateCount === 0,
            severity: parsed.missingCoordinateCount === 0 ? 'ok' : 'warning',
            detail:
            parsed.missingCoordinateCount === 0 ?
            'Every row can be mapped' :
            `${parsed.missingCoordinateCount.toLocaleString('en-US')} rows won't appear on the map`
          });
        } catch {
          result.push({ label: 'Readable file', ok: false, severity: 'error', detail: 'The file could not be read as CSV' });
        }
      }
      setPreview(parsed);
      setChecks(result);
      setAnalysing(false);
    },
    [config.data]
  );

  const startImport = useCallback(async () => {
    if (!file) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created: UploadStatus = await uploadApi.uploadFile(file);
      queryClient.setQueryData(['upload-status', created.uploadId], created);
      setUploadId(created.uploadId);
      setStep('import');
    } catch (error) {
      setSubmitError(friendlyError(error));
    } finally {
      setSubmitting(false);
    }
  }, [file, queryClient]);

  useEffect(() => {
    if (status.data?.stage === 'completed' && step === 'import') {
      resetFilters();
      queryClient.invalidateQueries({ predicate: (query) => !String(query.queryKey[0]).startsWith('upload') });
      setStep('complete');
    }
    if (status.data?.stage === 'failed' && step === 'import') setStep('complete');
  }, [status.data?.stage, step, queryClient, resetFilters]);

  const reset = useCallback(() => {
    setStep('select');
    setFile(null);
    setPreview(null);
    setChecks([]);
    setUploadId(null);
    setSubmitError(null);
  }, []);

  const blocking = checks.some((check) => check.severity === 'error');

  return {
    config,
    step,
    setStep,
    file,
    preview,
    checks,
    analysing,
    blocking,
    selectFile,
    startImport,
    submitting,
    submitError,
    status: status.data ?? null,
    reset
  };
}