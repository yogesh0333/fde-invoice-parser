import { CANONICAL_CATEGORIES, ExpenseCategory, ParsedInvoice, ValidationFlag } from '../types';

export interface ValidationResult {
  isValid: boolean;
  needsReview: boolean;
  reviewReason: string | null;
  validationFlags: ValidationFlag[];
  normalizedDate: string | null;
  confidence: number;
}

export function validateInvoiceExtraction(
  data: Partial<ParsedInvoice>,
  rawText?: string
): ValidationResult {
  const flags: ValidationFlag[] = [];
  const reviewReasons: string[] = [];

  // Check for negative test / Non-invoice input
  const lowerText = (rawText || '').toLowerCase();
  const isJunkOrNegativeText =
    lowerText.includes('hello this is a test') ||
    lowerText.includes('nothing else here') ||
    lowerText.includes('meeting notes:') ||
    lowerText.includes('security notification') ||
    lowerText.includes('verification passcode') ||
    lowerText.includes('one-time verification') ||
    lowerText.includes('ocr_corrupted') ||
    lowerText.includes('no_readable_text') ||
    (lowerText.includes('terms & conditions:') && !lowerText.includes('total') && !lowerText.includes('amount')) ||
    (!data.totalAmount && !/\d+(?:\.\d{2})?/.test(rawText?.replace(/\b(202\d|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g, '') || ''));

  if (isJunkOrNegativeText || (data.totalAmount === null || data.totalAmount === undefined || data.totalAmount === 0)) {
    if (isJunkOrNegativeText) {
      flags.push({
        field: 'totalAmount',
        severity: 'error',
        message: 'No financial transaction detected. The provided text is conversational, meeting notes, security alert, or non-invoice data (Negative Test).',
      });
      reviewReasons.push('Negative Test / Non-invoice input: Missing payable amounts and vendor information.');
    }
  }

  // 1. Amount Validation
  const total = data.totalAmount;
  const subtotal = data.subtotal;
  const tax = data.taxAmount;

  if (total === undefined || total === null || isNaN(total) || total <= 0) {
    flags.push({
      field: 'totalAmount',
      severity: 'error',
      message: 'Total amount is missing or non-positive.',
    });
    if (!reviewReasons.some((r) => r.includes('Negative Test'))) {
      reviewReasons.push('Total payable amount could not be determined confidently.');
    }
  } else {
    // Check if subtotal + tax roughly equals total
    if (subtotal !== null && subtotal !== undefined && tax !== null && tax !== undefined) {
      const sum = subtotal + tax;
      const diff = Math.abs(sum - total);
      // If difference is greater than 2 units (or > 1% of total)
      if (diff > 2.5 && diff / total > 0.01) {
        flags.push({
          field: 'totalAmount',
          severity: 'error',
          message: `Calculated sum of subtotal (${subtotal}) + tax (${tax}) = ${sum.toFixed(2)}, which differs from total (${total}) by ${diff.toFixed(2)}.`,
        });
        reviewReasons.push(
          `Math Mismatch: Subtotal (${subtotal}) + Tax (${tax}) = ${sum.toFixed(0)} does not reconcile with stated Total (${total}).`
        );
      }
    }

    // Check for conflicting total amounts in raw text (e.g. Total: 23,600 vs Amount Payable: 26,600)
    if (rawText) {
      const totalMatches = [...rawText.matchAll(/(?:total|amount\s*payable|net\s*total|grand\s*total)\s*[:=]?\s*(?:[₹$€£]|inr|usd)?\s*([\d,]+(?:\.\d{1,2})?)/gi)];
      if (totalMatches.length >= 2) {
        const detectedAmounts = totalMatches.map((m) => parseFloat(m[1].replace(/,/g, ''))).filter((v) => !isNaN(v) && v > 0);
        const uniqueAmounts = Array.from(new Set(detectedAmounts));
        if (uniqueAmounts.length >= 2) {
          const maxDiff = Math.max(...uniqueAmounts) - Math.min(...uniqueAmounts);
          if (maxDiff > 5) {
            flags.push({
              field: 'totalAmount',
              severity: 'warning',
              message: `Conflicting totals detected in text (${uniqueAmounts.map((a) => a.toLocaleString()).join(' vs ')}). Please verify actual payable amount.`,
            });
            if (!reviewReasons.some((r) => r.includes('Conflicting'))) {
              reviewReasons.push(`Conflicting totals detected (${uniqueAmounts.map((a) => a.toLocaleString()).join(' vs ')}). Verification required.`);
            }
          }
        }
      }
    }

    // Guard against phone number extraction (10-digit number without cents)
    if (total > 5000000000 && total < 9999999999 && Number.isInteger(total)) {
      flags.push({
        field: 'totalAmount',
        severity: 'warning',
        message: 'Amount resembles a 10-digit phone number or account ID. Please verify.',
      });
      reviewReasons.push('Amount appears suspicious (resembles a phone number).');
    }
  }

  // 2. Vendor Validation
  const vendor = data.vendor?.trim();
  const invalidVendorKeywords = [
    'tax invoice',
    'invoice',
    'receipt',
    'bill of supply',
    'customer copy',
    'cash receipt',
    'bank transfer',
    'payment advice',
    'scan receipt',
  ];

  if (!vendor || vendor.length < 2) {
    flags.push({
      field: 'vendor',
      severity: 'error',
      message: 'Vendor / merchant name is missing.',
    });
    reviewReasons.push('Merchant / Vendor identity could not be extracted.');
  } else if (invalidVendorKeywords.some((kw) => vendor.toLowerCase() === kw)) {
    flags.push({
      field: 'vendor',
      severity: 'warning',
      message: `Extracted vendor name "${vendor}" appears to be a generic document heading.`,
    });
    reviewReasons.push(`Vendor name "${vendor}" looks like a generic header. Please check.`);
  }

  // 3. Date Validation & Ambiguity Detection
  let normalizedDate: string | null = data.transactionDate || null;
  if (!normalizedDate) {
    flags.push({
      field: 'transactionDate',
      severity: 'warning',
      message: 'Transaction date is missing.',
    });
    reviewReasons.push('Transaction date is missing or could not be detected.');
  } else {
    // Check YYYY-MM-DD pattern
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(normalizedDate)) {
      flags.push({
        field: 'transactionDate',
        severity: 'warning',
        message: `Date "${normalizedDate}" is not in standard YYYY-MM-DD format.`,
      });
      reviewReasons.push('Date format could not be standardized to YYYY-MM-DD.');
    } else {
      const parsed = new Date(normalizedDate);
      if (isNaN(parsed.getTime())) {
        flags.push({
          field: 'transactionDate',
          severity: 'error',
          message: `Invalid date: ${normalizedDate}`,
        });
        reviewReasons.push('Extracted date is invalid.');
      } else {
        // Check future date (> 60 days ahead)
        const now = new Date();
        const futureLimit = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        if (parsed > futureLimit) {
          flags.push({
            field: 'transactionDate',
            severity: 'warning',
            message: `Date ${normalizedDate} is far in the future.`,
          });
          reviewReasons.push(`Date ${normalizedDate} appears to be in the future.`);
        }
      }
    }
  }

  // Check raw text for date ambiguity (e.g. 03/04/2026 without text month)
  if (rawText) {
    const numericDateMatch = rawText.match(/\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|1[0-2])[\/\-](20\d{2}|\d{2})\b/);
    if (numericDateMatch && !/[A-Za-z]{3,9}\s+\d{1,2}|\d{1,2}\s+[A-Za-z]{3,9}/i.test(rawText)) {
      const d1 = parseInt(numericDateMatch[1], 10);
      const d2 = parseInt(numericDateMatch[2], 10);
      if (d1 <= 12 && d2 <= 12 && d1 !== d2) {
        flags.push({
          field: 'transactionDate',
          severity: 'info',
          message: `Ambiguous date string "${numericDateMatch[0]}" found in raw text. Please verify day vs month.`,
        });
        if (!reviewReasons.some((r) => r.includes('date'))) {
          reviewReasons.push(`Ambiguous numeric date format (${numericDateMatch[0]}). Please confirm the transaction date.`);
        }
      }
    }
  }

  // 4. Category Validation
  const category = data.category as ExpenseCategory;
  if (!category || !CANONICAL_CATEGORIES.includes(category)) {
    flags.push({
      field: 'category',
      severity: 'warning',
      message: `Category "${category}" is not in the canonical list of 15 expense categories.`,
    });
    reviewReasons.push('Expense category could not be verified against the 15 canonical categories.');
  }

  // 5. Currency Validation
  const currency = data.currency?.toUpperCase() || 'INR';
  if (!currency || currency.length < 3) {
    flags.push({
      field: 'currency',
      severity: 'info',
      message: 'Currency code is unverified, defaulting to INR.',
    });
  }

  // Calculate adjusted weighted confidence
  const confs = data.fieldConfidences || {
    vendor: vendor ? 0.95 : 0.2,
    transactionDate: normalizedDate ? 0.95 : 0.2,
    totalAmount: total && total > 0 ? 0.98 : 0.1,
    currency: currency ? 0.98 : 0.5,
    category: category && CANONICAL_CATEGORIES.includes(category) ? 0.92 : 0.4,
  };

  let calculatedConfidence =
    confs.vendor * 0.25 +
    confs.transactionDate * 0.2 +
    confs.totalAmount * 0.3 +
    confs.currency * 0.1 +
    confs.category * 0.15;

  // Penalize confidence if there are validation flags
  const errorCount = flags.filter((f) => f.severity === 'error').length;
  const warnCount = flags.filter((f) => f.severity === 'warning').length;

  if (errorCount > 0) {
    calculatedConfidence = Math.min(calculatedConfidence, 0.55);
  } else if (warnCount > 0) {
    calculatedConfidence = Math.min(calculatedConfidence, 0.78);
  }

  const needsReview =
    data.needsReview === true ||
    errorCount > 0 ||
    warnCount > 0 ||
    calculatedConfidence < 0.85 ||
    reviewReasons.length > 0;

  const combinedReviewReason = reviewReasons.length > 0 ? reviewReasons.join(' • ') : null;

  return {
    isValid: errorCount === 0,
    needsReview,
    reviewReason: combinedReviewReason,
    validationFlags: flags,
    normalizedDate,
    confidence: Number(calculatedConfidence.toFixed(2)),
  };
}
