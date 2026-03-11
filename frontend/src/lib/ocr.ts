import { Process } from '@cpu-vis/shared';
import { handleApiResponse } from './api';

export interface OcrImportResult {
  processes: Process[];
  warnings: string[];
}

export async function importProcessesFromImage(file: File): Promise<OcrImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ocr/process-table', {
    method: 'POST',
    body: formData,
  });

  return handleApiResponse<OcrImportResult>(response);
}
