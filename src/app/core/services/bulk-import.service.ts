import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ImportRowResult } from '../models/api.model';

/** Small delay between sequential requests, well inside the 300 req/min limit. */
const REQUEST_GAP_MS = 250;
const RETRY_ON_429_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable({ providedIn: 'root' })
export class BulkImportService {
  private readonly http = inject(HttpClient);

  /**
   * Imports rows one at a time (never Promise.all - the backend has no bulk
   * endpoint and rate-limits at 300 req/min, so parallel calls can 429).
   * 201 = added, 409 = duplicate/skipped, 429 is retried once after a short wait.
   */
  async importSequentially(
    url: string,
    rows: Record<string, unknown>[],
    onProgress?: (done: number, total: number) => void
  ): Promise<ImportRowResult[]> {
    const results: ImportRowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const result = await this.postOne(url, row, i + 1);
      results.push(result);
      onProgress?.(i + 1, rows.length);
      if (i < rows.length - 1) {
        await sleep(REQUEST_GAP_MS);
      }
    }

    return results;
  }

  private async postOne(
    url: string,
    payload: Record<string, unknown>,
    rowNumber: number,
    isRetry = false
  ): Promise<ImportRowResult> {
    try {
      await firstValueFrom(this.http.post(url, payload));
      return { row: rowNumber, status: 'added', payload };
    } catch (err) {
      const httpErr = err as HttpErrorResponse;

      if (httpErr.status === 409) {
        return { row: rowNumber, status: 'skipped', reason: 'Duplicate', payload };
      }

      if (httpErr.status === 429 && !isRetry) {
        await sleep(RETRY_ON_429_DELAY_MS);
        return this.postOne(url, payload, rowNumber, true);
      }

      return {
        row: rowNumber,
        status: 'error',
        reason: httpErr.error?.message || httpErr.message || 'Request failed',
        payload
      };
    }
  }

  parseCsv(text: string): Record<string, unknown>[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = this.splitCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = this.splitCsvLine(line);
      const row: Record<string, unknown> = {};
      headers.forEach((h, idx) => (row[h.trim()] = values[idx]?.trim() ?? ''));
      return row;
    });
  }

  private splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  parseJson(text: string): Record<string, unknown>[] {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.data)) return parsed.data;
    throw new Error('JSON must be an array of rows or { "data": [...] }');
  }
}
