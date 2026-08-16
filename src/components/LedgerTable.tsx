import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Check,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  CANONICAL_CATEGORIES,
  ExpenseCategory,
  LedgerTransaction,
  TransactionStatus,
} from '../types';
import { CATEGORY_COLORS } from '../services/ledgerRepository';

interface LedgerTableProps {
  transactions: LedgerTransaction[];
  selectedCategoryFilter: ExpenseCategory | 'All';
  selectedStatusFilter: TransactionStatus | 'All';
  onCategoryFilterChange: (cat: ExpenseCategory | 'All') => void;
  onStatusFilterChange: (status: TransactionStatus | 'All') => void;
  onOpenParser: () => void;
  onViewTransaction: (t: LedgerTransaction) => void;
  onQuickVerify: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
  onBulkVerify: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
}

type SortField = 'date' | 'amount' | 'vendor' | 'confidence';
type SortOrder = 'asc' | 'desc';

export const LedgerTable: React.FC<LedgerTableProps> = ({
  transactions,
  selectedCategoryFilter,
  selectedStatusFilter,
  onCategoryFilterChange,
  onStatusFilterChange,
  onOpenParser,
  onViewTransaction,
  onQuickVerify,
  onDeleteTransaction,
  onBulkVerify,
  onBulkDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Status Filter
      if (selectedStatusFilter !== 'All' && t.status !== selectedStatusFilter) {
        return false;
      }
      // Category Filter
      if (
        selectedCategoryFilter !== 'All' &&
        t.category !== selectedCategoryFilter
      ) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const vendorMatch = t.vendor.toLowerCase().includes(q);
        const descMatch = t.shortDescription.toLowerCase().includes(q);
        const invMatch = t.invoiceNumber?.toLowerCase().includes(q);
        const catMatch = t.category.toLowerCase().includes(q);
        const amountMatch = t.totalAmount.toString().includes(q);
        return vendorMatch || descMatch || invMatch || catMatch || amountMatch;
      }
      return true;
    });
  }, [transactions, selectedStatusFilter, selectedCategoryFilter, searchQuery]);

  // Sorting Logic
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison =
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime();
      } else if (sortField === 'amount') {
        comparison = (b.totalAmount || 0) - (a.totalAmount || 0);
      } else if (sortField === 'vendor') {
        comparison = a.vendor.localeCompare(b.vendor);
      } else if (sortField === 'confidence') {
        comparison = (b.confidence || 0) - (a.confidence || 0);
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [filteredTransactions, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedTransactions.length && sortedTransactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedTransactions.map((t) => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkVerifySelected = () => {
    if (selectedIds.size > 0) {
      onBulkVerify(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBulkDeleteSelected = () => {
    if (
      selectedIds.size > 0 &&
      window.confirm(`Delete ${selectedIds.size} selected transaction(s)?`)
    ) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div
      id="ledger-table-container"
      className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden"
    >
      {/* Table Controls & Filters Toolbar */}
      <div className="border-b border-slate-100 p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              id="input-ledger-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, invoice #, category, description..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8.5 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onStatusFilterChange('All')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  selectedStatusFilter === 'All'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => onStatusFilterChange('Verified')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  selectedStatusFilter === 'Verified'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Verified
              </button>
              <button
                type="button"
                onClick={() => onStatusFilterChange('Needs Review')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  selectedStatusFilter === 'Needs Review'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Needs Review
              </button>
            </div>

            {/* Category Filter Dropdown */}
            <select
              id="select-category-filter"
              value={selectedCategoryFilter}
              onChange={(e) =>
                onCategoryFilterChange(e.target.value as ExpenseCategory | 'All')
              }
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Categories</option>
              {CANONICAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Bar (when rows are selected) */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs text-indigo-900 animate-in fade-in duration-200">
            <span className="font-semibold">
              {selectedIds.size} transaction{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkVerifySelected}
                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Check className="h-3 w-3" />
                Mark Verified
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteSelected}
                className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2.5 py-1 font-semibold text-red-600 hover:bg-red-50 transition-colors shadow-xs"
              >
                <Trash2 className="h-3 w-3" />
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Header & Rows */}
      {sortedTransactions.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Your ledger is ready.
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            {transactions.length === 0
              ? 'Parse your first invoice to start tracking expenses.'
              : 'No transactions match the selected filters or search query.'}
          </p>
          <div className="mt-4 flex items-center gap-2">
            {transactions.length === 0 ? (
              <button
                onClick={onOpenParser}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                <span>Parse Invoice</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onCategoryFilterChange('All');
                  onStatusFilterChange('All');
                  setSearchQuery('');
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-2 w-8">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === sortedTransactions.length &&
                      sortedTransactions.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('vendor')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Vendor</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Category</th>
                <th
                  onClick={() => handleSort('amount')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th
                  onClick={() => handleSort('confidence')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Confidence</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 pr-4 pl-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {sortedTransactions.map((tx) => {
                const isSelected = selectedIds.has(tx.id);
                const isReview = tx.status === 'Needs Review';
                const catColor = CATEGORY_COLORS[tx.category] || '#64748B';
                const confidencePct = Math.round((tx.confidence || 0.9) * 100);

                return (
                  <tr
                    key={tx.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected
                        ? 'bg-indigo-50/40'
                        : isReview
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 pl-4 pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(tx.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                      {tx.transactionDate}
                    </td>

                    {/* Vendor & Invoice No */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer" onClick={() => onViewTransaction(tx)}>
                          {tx.vendor}
                        </span>
                        {tx.invoiceNumber && (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{tx.invoiceNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3 max-w-xs truncate text-slate-600" title={tx.shortDescription}>
                      {tx.shortDescription}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-medium text-[11px]"
                        style={{
                          backgroundColor: `${catColor}15`,
                          color: catColor,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: catColor }}
                        />
                        {tx.category}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-slate-900">
                      {tx.currency === 'INR' ? '₹' : tx.currency + ' '}
                      {Math.round(tx.totalAmount).toLocaleString('en-IN')}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isReview ? (
                        <div
                          title={tx.reviewReason || 'Flagged for human verification'}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-600/20"
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          Needs Review
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Verified
                        </div>
                      )}
                    </td>

                    {/* Confidence Pill */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          confidencePct >= 90
                            ? 'bg-emerald-50 text-emerald-700'
                            : confidencePct >= 75
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {confidencePct}%
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 pr-4 pl-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {isReview && (
                          <button
                            type="button"
                            onClick={() => onQuickVerify(tx.id)}
                            title="Mark as Verified"
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewTransaction(tx)}
                          title="View / Edit Transaction"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          title="Delete"
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
