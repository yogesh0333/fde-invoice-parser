import React, { useState } from 'react';
import {
  X,
  Building2,
  Calendar,
  Hash,
  Tag,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Save,
} from 'lucide-react';
import {
  CANONICAL_CATEGORIES,
  ExpenseCategory,
  LedgerTransaction,
  TransactionStatus,
} from '../types';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: LedgerTransaction | null;
  onClose: () => void;
  onUpdate: (updated: LedgerTransaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onUpdate,
  onDelete,
}) => {
  if (!isOpen || !transaction) return null;

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [vendor, setVendor] = useState<string>(transaction.vendor);
  const [transactionDate, setTransactionDate] = useState<string>(transaction.transactionDate);
  const [invoiceNumber, setInvoiceNumber] = useState<string>(transaction.invoiceNumber || '');
  const [category, setCategory] = useState<ExpenseCategory>(transaction.category);
  const [subtotal, setSubtotal] = useState<string>(transaction.subtotal?.toString() || '');
  const [taxAmount, setTaxAmount] = useState<string>(transaction.taxAmount?.toString() || '');
  const [totalAmount, setTotalAmount] = useState<string>(transaction.totalAmount.toString());
  const [currency, setCurrency] = useState<string>(transaction.currency);
  const [shortDescription, setShortDescription] = useState<string>(transaction.shortDescription);
  const [status, setStatus] = useState<TransactionStatus>(transaction.status);
  const [reviewReason, setReviewReason] = useState<string>(transaction.reviewReason || '');
  const [notes, setNotes] = useState<string>(transaction.notes || '');

  const handleSave = () => {
    const updated: LedgerTransaction = {
      ...transaction,
      vendor: vendor.trim(),
      transactionDate,
      invoiceNumber: invoiceNumber.trim() || null,
      category,
      subtotal: subtotal ? parseFloat(subtotal) : null,
      taxAmount: taxAmount ? parseFloat(taxAmount) : null,
      totalAmount: parseFloat(totalAmount) || 0,
      currency,
      shortDescription: shortDescription.trim(),
      status,
      reviewReason: status === 'Needs Review' ? reviewReason : null,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    setIsEditing(false);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this transaction from ${transaction.vendor}?`)) {
      onDelete(transaction.id);
      onClose();
    }
  };

  return (
    <div
      id="tx-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="tx-detail-modal"
        className="relative my-6 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Transaction' : 'Transaction Details'}
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  status === 'Verified'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                }`}
              >
                {status === 'Verified' ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ID: <span className="font-mono">{transaction.id}</span> • Source: {transaction.source}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {CANONICAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Amount
              </label>
              <input
                type="number"
                step="any"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Verified">Verified</option>
                <option value="Needs Review">Needs Review</option>
              </select>
            </div>

            {status === 'Needs Review' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Review Reason
                </label>
                <input
                  type="text"
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full rounded-lg border border-amber-300 bg-amber-50/50 p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Top Stat Row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Spend</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {transaction.currency} {transaction.totalAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Date</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  {transaction.transactionDate}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Invoice No.</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  {transaction.invoiceNumber || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Confidence</span>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                  {Math.round(transaction.confidence * 100)}% Verified
                </p>
              </div>
            </div>

            {/* Field Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-lg border border-slate-100 p-3">
                <span className="font-semibold text-slate-500">Merchant / Vendor</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{transaction.vendor}</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <span className="font-semibold text-slate-500">Expense Category</span>
                <p className="font-semibold text-indigo-700 text-sm mt-0.5">
                  {transaction.category}
                </p>
              </div>
            </div>

            {/* Description & AI Reasoning */}
            <div className="rounded-lg border border-slate-100 p-3 text-xs">
              <span className="font-semibold text-slate-500">Description</span>
              <p className="text-slate-800 mt-0.5">{transaction.shortDescription}</p>
              {transaction.categoryReason && (
                <p className="mt-2 text-[11px] text-indigo-700 bg-indigo-50/70 p-2 rounded">
                  💡 <span className="font-medium">AI Classification Reason:</span>{' '}
                  {transaction.categoryReason}
                </p>
              )}
            </div>

            {/* Review Reason if any */}
            {transaction.reviewReason && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <span className="font-bold">⚠ Review Flag Reason:</span>
                <p className="mt-0.5">{transaction.reviewReason}</p>
              </div>
            )}

            {/* Raw Text snippet if stored */}
            {transaction.rawText && (
              <div>
                <span className="text-xs font-semibold text-slate-500 mb-1 block">
                  Original Raw Invoice Text
                </span>
                <pre className="max-h-32 overflow-y-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-100 whitespace-pre-wrap">
                  {transaction.rawText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Transaction</span>
          </button>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
