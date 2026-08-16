import { ParsedInvoice } from '../types';
import { validateInvoiceExtraction } from './validationEngine';

export interface ParseInvoiceResponse {
  data: ParsedInvoice;
  source: string;
  warning?: string;
}

export async function parseInvoiceWithAI(rawText: string): Promise<ParsedInvoice> {
  if (!rawText || !rawText.trim()) {
    throw new Error('Please provide raw invoice or receipt text to analyze.');
  }

  const response = await fetch('/api/parse-invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rawText: rawText.trim() }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server returned error (${response.status})`);
  }

  const result = await response.json();
  const rawData = result.data as ParsedInvoice;

  // Run validation engine to verify numbers, ambiguous dates, and compute reconciled confidence
  const validation = validateInvoiceExtraction(rawData, rawText);

  return {
    ...rawData,
    transactionDate: validation.normalizedDate || rawData.transactionDate,
    confidence: validation.confidence,
    needsReview: validation.needsReview,
    reviewReason: validation.reviewReason || rawData.reviewReason,
    validationFlags: validation.validationFlags,
    rawText,
  };
}
