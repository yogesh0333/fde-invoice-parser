import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Copy,
  Building2,
  Calendar,
  Hash,
  Tag,
  DollarSign,
  FileText,
  Info,
  ShieldAlert,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import {
  CANONICAL_CATEGORIES,
  DuplicateWarning,
  ExpenseCategory,
  LedgerTransaction,
  ParsedInvoice,
  TransactionStatus,
} from '../types';
import { checkForDuplicates } from '../services/duplicateDetector';
import { validateInvoiceExtraction } from '../services/validationEngine';

interface StructuredReviewModalProps {
  isOpen: boolean;
  parsedData: ParsedInvoice | null;
  rawText: string;
  ledger: LedgerTransaction[];
  onClose: () => void;
  onSaveToLedger: (transaction: LedgerTransaction) => void;
}

export const StructuredReviewModal: React.FC<StructuredReviewModalProps> = ({
  isOpen,
  parsedData,
  rawText,
  ledger,
  onClose,
  onSaveToLedger,
}) => {
  if (!isOpen || !parsedData) return null;

  // Form State
  const [vendor, setVendor] = useState<string>(parsedData.vendor || '');
  const [transactionDate, setTransactionDate] = useState<string>(
    parsedData.transactionDate || ''
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    parsedData.invoiceNumber || ''
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    parsedData.category || 'Miscellaneous'
  );
  const [subtotal, setSubtotal] = useState<string>(
    parsedData.subtotal !== null && parsedData.subtotal !== undefined
      ? parsedData.subtotal.toString()
      : ''
  );
  const [taxAmount, setTaxAmount] = useState<string>(
    parsedData.taxAmount !== null && parsedData.taxAmount !== undefined
      ? parsedData.taxAmount.toString()
      : ''
  );
  const [totalAmount, setTotalAmount] = useState<string>(
    parsedData.totalAmount !== null && parsedData.totalAmount !== undefined
      ? parsedData.totalAmount.toString()
      : ''
  );
  const [currency, setCurrency] = useState<string>(parsedData.currency || 'INR');
  const [shortDescription, setShortDescription] = useState<string>(
    parsedData.shortDescription || ''
  );
  const [status, setStatus] = useState<TransactionStatus>(
    parsedData.needsReview ? 'Needs Review' : 'Verified'
  );
  const [reviewReason, setReviewReason] = useState<string>(
    parsedData.reviewReason || ''
  );
  const [showRawText, setShowRawText] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Duplicate Warning State
  const [duplicateWarning, setDuplicateWarning] =
    useState<DuplicateWarning | null>(null);

  // Math Reconciliation Check
  const subNum = parseFloat(subtotal) || 0;
  const taxNum = parseFloat(taxAmount) || 0;
  const totNum = parseFloat(totalAmount) || 0;
  const mathDiff = Math.abs(subNum + taxNum - totNum);
  const isMathReconciled =
    subtotal && taxAmount ? mathDiff <= 2.5 : true;

  // Update duplicate detection whenever form changes
  useEffect(() => {
    const candidate = {
      vendor,
      transactionDate,
      invoiceNumber: invoiceNumber || null,
      totalAmount: totNum,
      currency,
    };
    const dup = checkForDuplicates(candidate, ledger);
    setDuplicateWarning(dup);
  }, [vendor, transactionDate, invoiceNumber, totalAmount, currency, ledger]);

  const handleSave = () => {
    const finalAmount = parseFloat(totalAmount) || 0;

    // Run quick client validation
    const candidate: Partial<ParsedInvoice> = {
      vendor,
      transactionDate,
      invoiceNumber: invoiceNumber || null,
      subtotal: subtotal ? parseFloat(subtotal) : null,
      taxAmount: taxAmount ? parseFloat(taxAmount) : null,
      totalAmount: finalAmount,
      currency,
      category,
      needsReview: status === 'Needs Review',
      reviewReason: status === 'Needs Review' ? reviewReason : null,
    };

    const finalValidation = validateInvoiceExtraction(candidate, rawText);

    const newTransaction: LedgerTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      vendor: vendor.trim() || 'Unknown Vendor',
      transactionDate: transactionDate || new Date().toISOString().split('T')[0],
      invoiceNumber: invoiceNumber.trim() || null,
      subtotal: subtotal ? parseFloat(subtotal) : null,
      taxAmount: taxAmount ? parseFloat(taxAmount) : null,
      totalAmount: finalAmount,
      currency: currency.toUpperCase() || 'INR',
      category,
      categoryReason: parsedData.categoryReason || undefined,
      confidence: finalValidation.confidence,
      fieldConfidences: parsedData.fieldConfidences || {
        vendor: 0.95,
        transactionDate: 0.95,
        totalAmount: 0.95,
        currency: 0.99,
        category: 0.92,
      },
      status,
      reviewReason: status === 'Needs Review' ? (reviewReason || finalValidation.reviewReason) : null,
      shortDescription: shortDescription.trim() || `${vendor} - ${category}`,
      rawText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'ai_parsed',
      notes: notes.trim() || undefined,
    };

    onSaveToLedger(newTransaction);
  };

  const getConfidenceBadge = (score: number) => {
    const pct = Math.round(score * 100);
    if (pct >= 90) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          {pct}% High
        </span>
      );
    }
    if (pct >= 70) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-600/20">
          <Info className="h-3 w-3 text-amber-600" />
          {pct}% Med
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-600/20">
        <AlertTriangle className="h-3 w-3 text-red-600" />
        {pct}% Low
      </span>
    );
  };

  const overallConfidencePct = Math.round((parsedData.confidence || 0.9) * 100);

  return (
    <div
      id="structured-review-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="structured-review-modal"
        className="relative my-6 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-sm shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Review & Reconcile Transaction
                </h2>
                <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  <span>AI Confidence:</span>
                  <span
                    className={
                      overallConfidencePct >= 90
                        ? 'text-emerald-700'
                        : overallConfidencePct >= 70
                        ? 'text-amber-700'
                        : 'text-red-700'
                    }
                  >
                    {overallConfidencePct}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                AI extracted the structured fields below. Review, edit if needed, and confirm before adding to the running ledger.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {showRawText ? 'Hide Raw Text' : 'View Raw Text'}
            </button>
            <button
              id="btn-close-review-modal"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Banner 1: Needs Review Flag */}
        {status === 'Needs Review' && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800">
                Action Required: Human Verification Needed
              </span>
              <p className="mt-0.5 text-amber-900 leading-relaxed font-medium">
                {reviewReason ||
                  parsedData.reviewReason ||
                  'One or more values could not be extracted with 100% certainty. Please verify the highlighted fields.'}
              </p>
            </div>
          </div>
        )}

        {/* Banner 2: Duplicate Invoice Detected */}
        {duplicateWarning && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-400 bg-amber-100/70 p-3.5 text-xs text-amber-950">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider text-[11px] text-amber-900">
                Possible Duplicate Invoice Detected
              </span>
              <p className="mt-0.5 leading-relaxed text-amber-900">
                {duplicateWarning.message}
              </p>
              <p className="mt-1 text-[11px] text-amber-800">
                You can still proceed to save if this is a separate legitimate transaction.
              </p>
            </div>
          </div>
        )}

        {/* Side-by-side or Top Raw Text Drawer when toggled */}
        {showRawText && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                Original Raw Invoice Input:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Read-only</span>
            </div>
            <pre className="max-h-36 overflow-y-auto rounded-lg bg-white p-2.5 font-mono text-[11px] text-slate-700 border border-slate-200/80 whitespace-pre-wrap">
              {rawText}
            </pre>
          </div>
        )}

        {/* Form Body */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {/* 1. Vendor */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-vendor"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                Vendor / Merchant
              </label>
              {parsedData.fieldConfidences?.vendor !== undefined &&
                getConfidenceBadge(parsedData.fieldConfidences.vendor)}
            </div>
            <input
              id="review-vendor"
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Meta Platforms Ireland Ltd"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* 2. Transaction Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-date"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Transaction Date
              </label>
              {parsedData.fieldConfidences?.transactionDate !== undefined &&
                getConfidenceBadge(parsedData.fieldConfidences.transactionDate)}
            </div>
            <input
              id="review-date"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* 3. Invoice Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-invoice-no"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <Hash className="h-3.5 w-3.5 text-slate-500" />
                Invoice Number
              </label>
              <span className="text-[10px] text-slate-400">Optional</span>
            </div>
            <input
              id="review-invoice-no"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2391"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* 4. Expense Category */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-category"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                Expense Category (15 Canonical)
              </label>
              {parsedData.fieldConfidences?.category !== undefined &&
                getConfidenceBadge(parsedData.fieldConfidences.category)}
            </div>
            <select
              id="review-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {CANONICAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {parsedData.categoryReason && (
              <p className="mt-1 text-[11px] text-indigo-700 bg-indigo-50/70 rounded px-2 py-0.5 inline-block">
                💡 <span className="font-medium">AI Reason:</span> {parsedData.categoryReason}
              </p>
            )}
          </div>

          {/* 5. Subtotal */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-subtotal"
                className="text-xs font-semibold text-slate-700"
              >
                Subtotal (Base)
              </label>
              <span className="text-[10px] text-slate-400">Excl. Tax</span>
            </div>
            <input
              id="review-subtotal"
              type="number"
              step="any"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* 6. Tax / GST */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-tax"
                className="text-xs font-semibold text-slate-700"
              >
                Tax / GST Amount
              </label>
              <span className="text-[10px] text-slate-400">GST / VAT</span>
            </div>
            <input
              id="review-tax"
              type="number"
              step="any"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* 7. Total Payable Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="review-total-amount"
                className="flex items-center gap-1 text-xs font-bold text-slate-900"
              >
                Total Amount Due *
              </label>
              {parsedData.fieldConfidences?.totalAmount !== undefined &&
                getConfidenceBadge(parsedData.fieldConfidences.totalAmount)}
            </div>
            <div className="relative">
              <input
                id="review-total-amount"
                type="number"
                step="any"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 ${
                  isMathReconciled
                    ? 'border-slate-300 bg-emerald-50/20 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20'
                    : 'border-amber-400 bg-amber-50/40 text-amber-900 focus:border-amber-500 focus:ring-amber-500/20'
                }`}
              />
            </div>
            {!isMathReconciled && (
              <span className="mt-0.5 text-[10px] text-amber-700 font-medium block">
                Subtotal + Tax = {(subNum + taxNum).toFixed(2)} (diff: {mathDiff.toFixed(2)})
              </span>
            )}
          </div>

          {/* 8. Currency */}
          <div>
            <label
              htmlFor="review-currency"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Currency
            </label>
            <select
              id="review-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="INR">INR (₹ - Indian Rupee)</option>
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
              <option value="SGD">SGD (S$ - Singapore Dollar)</option>
            </select>
          </div>

          {/* 9. Description */}
          <div className="sm:col-span-2">
            <label
              htmlFor="review-description"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Short Transaction Summary
            </label>
            <input
              id="review-description"
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Facebook & Instagram Ads Summer Acquisition"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* 10. Status Override */}
          <div>
            <label
              htmlFor="review-status"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Transaction Status
            </label>
            <select
              id="review-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TransactionStatus)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Verified">Verified (Clean & Reconciled)</option>
              <option value="Needs Review">Needs Review (Flag for Close)</option>
            </select>
          </div>

          {/* 11. Review Reason (if flagged) */}
          {status === 'Needs Review' && (
            <div className="sm:col-span-3">
              <label
                htmlFor="review-notes-reason"
                className="block text-xs font-semibold text-amber-800 mb-1"
              >
                Review Flag Reason
              </label>
              <input
                id="review-notes-reason"
                type="text"
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Reason why this transaction requires attention..."
                className="w-full rounded-lg border border-amber-300 bg-amber-50/40 px-3 py-2 text-xs font-medium text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            <span>Amount: </span>
            <span className="font-bold text-slate-900">
              {currency} {parseFloat(totalAmount || '0').toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-cancel-review"
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              id="btn-save-to-ledger"
              type="button"
              onClick={handleSave}
              disabled={!vendor || !totalAmount || parseFloat(totalAmount) <= 0}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Save to Ledger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
