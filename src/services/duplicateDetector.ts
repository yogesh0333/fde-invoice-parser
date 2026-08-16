import { DuplicateWarning, LedgerTransaction, ParsedInvoice } from '../types';

export function checkForDuplicates(
  candidate: Partial<ParsedInvoice> | Partial<LedgerTransaction>,
  ledger: LedgerTransaction[],
  excludeId?: string
): DuplicateWarning | null {
  if (!candidate || ledger.length === 0) return null;

  const currentTotal = Number(candidate.totalAmount);
  const currentInvoiceNo = candidate.invoiceNumber?.trim();
  const currentVendor = candidate.vendor?.trim().toLowerCase();
  const currentDate = candidate.transactionDate?.trim();

  for (const item of ledger) {
    if (excludeId && item.id === excludeId) continue;

    // Rule 1: Exact Invoice Number Match (if invoiceNumber is valid)
    if (
      currentInvoiceNo &&
      item.invoiceNumber &&
      currentInvoiceNo.length >= 3 &&
      item.invoiceNumber.trim().toLowerCase() === currentInvoiceNo.toLowerCase()
    ) {
      return {
        matchedTransactionId: item.id,
        matchedInvoiceNumber: item.invoiceNumber,
        matchedVendor: item.vendor,
        matchedAmount: item.totalAmount,
        matchedDate: item.transactionDate,
        matchType: 'exact_invoice_number',
        message: `Exact invoice number match detected: Invoice #${item.invoiceNumber} was already recorded for ${item.vendor} on ${item.transactionDate} (${item.currency} ${item.totalAmount.toLocaleString('en-IN')}).`,
      };
    }

    // Rule 2: Same Vendor + Same Amount + Same Date
    const itemVendor = item.vendor.trim().toLowerCase();
    const isSameVendor =
      currentVendor &&
      (itemVendor === currentVendor ||
        itemVendor.includes(currentVendor) ||
        currentVendor.includes(itemVendor));
    const isSameAmount =
      !isNaN(currentTotal) &&
      currentTotal > 0 &&
      Math.abs(item.totalAmount - currentTotal) < 0.5;
    const isSameDate = currentDate && item.transactionDate === currentDate;

    if (isSameVendor && isSameAmount && isSameDate) {
      return {
        matchedTransactionId: item.id,
        matchedInvoiceNumber: item.invoiceNumber,
        matchedVendor: item.vendor,
        matchedAmount: item.totalAmount,
        matchedDate: item.transactionDate,
        matchType: 'vendor_amount_date',
        message: `Potential duplicate transaction: An identical entry for ${item.vendor} on ${item.transactionDate} of ${item.currency} ${item.totalAmount.toLocaleString('en-IN')} already exists in the ledger.`,
      };
    }

    // Rule 3: Same Vendor + Same Amount within 7 days
    if (isSameVendor && isSameAmount && currentDate && item.transactionDate) {
      const d1 = new Date(currentDate).getTime();
      const d2 = new Date(item.transactionDate).getTime();
      if (!isNaN(d1) && !isNaN(d2)) {
        const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) {
          return {
            matchedTransactionId: item.id,
            matchedInvoiceNumber: item.invoiceNumber,
            matchedVendor: item.vendor,
            matchedAmount: item.totalAmount,
            matchedDate: item.transactionDate,
            matchType: 'potential_match',
            message: `Similar transaction warning: A transaction of ${item.currency} ${item.totalAmount.toLocaleString('en-IN')} from ${item.vendor} was recorded within ${Math.round(diffDays)} days (${item.transactionDate}).`,
          };
        }
      }
    }
  }

  return null;
}
