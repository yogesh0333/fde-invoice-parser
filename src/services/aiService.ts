import { ParsedInvoice } from '../types';
import { validateInvoiceExtraction } from './validationEngine';
import { fallbackHeuristicParse } from './fallbackParser';

export interface ParseInvoiceResponse {
  data: ParsedInvoice;
  source: string;
  warning?: string;
}

export async function parseInvoiceWithAI(rawText: string): Promise<ParsedInvoice> {
  if (!rawText || !rawText.trim()) {
    throw new Error('Please provide raw invoice or receipt text to analyze.');
  }

  let rawData: ParsedInvoice | null = null;
  let extractionSource = 'gemini-3.7-flash';

  try {
    const response = await fetch('/api/parse-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rawText: rawText.trim() }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.data) {
        rawData = result.data as ParsedInvoice;
        extractionSource = result.source || 'gemini-3.7-flash';
      }
    } else {
      console.warn(`Backend endpoint returned ${response.status}. Falling back to client-side heuristic engine.`);
    }
  } catch (netErr) {
    console.warn('Network or API endpoint unavailable. Utilizing resilient client-side parser:', netErr);
  }

  // If serverless endpoint failed or was unreachable (e.g. static preview or offline on Vercel), use client-side parser
  if (!rawData) {
    const localResult = fallbackHeuristicParse(rawText);
    rawData = {
      ...localResult,
      rawText,
    } as ParsedInvoice;
    extractionSource = 'client_heuristic_engine';
  }

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

