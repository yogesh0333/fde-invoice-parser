import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Download,
  AlertCircle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DashboardKPIs } from './components/DashboardKPIs';
import { AIInsightsBanner } from './components/AIInsightsBanner';
import { SpendingAnalytics } from './components/SpendingAnalytics';
import { LedgerTable } from './components/LedgerTable';
import { ParseInvoiceModal } from './components/ParseInvoiceModal';
import { StructuredReviewModal } from './components/StructuredReviewModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import {
  ExpenseCategory,
  LedgerTransaction,
  ParsedInvoice,
  TransactionStatus,
} from './types';
import { LedgerRepository } from './services/ledgerRepository';

export default function App() {
  // Primary State
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    ExpenseCategory | 'All'
  >('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    TransactionStatus | 'All'
  >('All');

  // Modal States
  const [isParseModalOpen, setIsParseModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [parsedDataForReview, setParsedDataForReview] =
    useState<ParsedInvoice | null>(null);
  const [rawTextForReview, setRawTextForReview] = useState<string>('');
  const [viewingTransaction, setViewingTransaction] =
    useState<LedgerTransaction | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Load Initial Transactions from Repository
  useEffect(() => {
    const list = LedgerRepository.getAll();
    setTransactions(list);
  }, []);

  const showToast = (
    text: string,
    type: 'success' | 'info' | 'warning' = 'success'
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Calculated Metrics
  const kpis = useMemo(() => {
    return LedgerRepository.calculateKPIs(transactions);
  }, [transactions]);

  const categorySpend = useMemo(() => {
    return LedgerRepository.getCategorySpend(transactions);
  }, [transactions]);

  const insights = useMemo(() => {
    return LedgerRepository.generateInsights(transactions);
  }, [transactions]);

  // Handlers
  const handleOpenParser = () => {
    setIsParseModalOpen(true);
  };

  const handleExtractionSuccess = (
    parsed: ParsedInvoice,
    rawText: string
  ) => {
    setIsParseModalOpen(false);
    setParsedDataForReview(parsed);
    setRawTextForReview(rawText);
    setIsReviewModalOpen(true);
  };

  const handleSaveToLedger = (newTx: LedgerTransaction) => {
    const updated = LedgerRepository.add(newTx);
    setTransactions(updated);
    setIsReviewModalOpen(false);
    setParsedDataForReview(null);
    showToast(
      `Saved ${newTx.vendor} (${newTx.currency} ${newTx.totalAmount.toLocaleString('en-IN')}) to ledger!`,
      'success'
    );
  };

  const handleUpdateTransaction = (updatedTx: LedgerTransaction) => {
    const updated = LedgerRepository.update(updatedTx);
    setTransactions(updated);
    showToast(`Updated transaction for ${updatedTx.vendor}`, 'info');
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = LedgerRepository.delete(id);
    setTransactions(updated);
    showToast('Transaction deleted from ledger', 'info');
  };

  const handleQuickVerify = (id: string) => {
    const updated = LedgerRepository.setStatus(id, 'Verified');
    setTransactions(updated);
    showToast('Transaction marked as Verified!', 'success');
  };

  const handleBulkVerify = (ids: string[]) => {
    const updated = LedgerRepository.bulkVerify(ids);
    setTransactions(updated);
    showToast(`Marked ${ids.length} transaction(s) as Verified!`, 'success');
  };

  const handleBulkDelete = (ids: string[]) => {
    let list = transactions;
    for (const id of ids) {
      list = LedgerRepository.delete(id);
    }
    setTransactions(list);
    showToast(`Deleted ${ids.length} transaction(s)`, 'info');
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Reset ledger back to default sample D2C business transactions?'
      )
    ) {
      const reset = LedgerRepository.resetToSample();
      setTransactions(reset);
      setSelectedCategoryFilter('All');
      setSelectedStatusFilter('All');
      showToast('Ledger reset to default D2C sample data', 'info');
    }
  };

  const handleExportCSV = () => {
    LedgerRepository.exportToCSV(transactions);
    showToast('Exported ledger to CSV', 'success');
  };

  const handleExportJSON = () => {
    LedgerRepository.exportToJSON(transactions);
    showToast('Exported ledger to JSON backup', 'success');
  };

  const handleApplyInsightFilter = (filter: {
    category?: ExpenseCategory;
    status?: TransactionStatus;
    vendor?: string;
  }) => {
    if (filter.category) {
      setSelectedCategoryFilter(filter.category);
    }
    if (filter.status) {
      setSelectedStatusFilter(filter.status);
    }
    // Smooth scroll down to ledger table
    const tableEl = document.getElementById('ledger-table-container');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl animate-in slide-in-from-bottom-5">
          {toastMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        kpis={kpis}
        onOpenParser={handleOpenParser}
        onResetData={handleResetData}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Hero Action Header */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs relative overflow-hidden">
          <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 mb-2.5 ring-1 ring-indigo-700/10">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI-Powered Financial Operations</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Turn receipts into ledger entries in seconds.
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Paste an invoice. AI extracts the details, categorizes the expense, and prepares it for review.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                id="btn-hero-parse-invoice"
                onClick={handleOpenParser}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98]"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Parse Invoice</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                id="btn-hero-view-ledger"
                onClick={() => {
                  const el = document.getElementById('ledger-table-container');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                <span>View Ledger ({transactions.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <DashboardKPIs
          kpis={kpis}
          selectedStatus={selectedStatusFilter}
          onSelectStatusFilter={(status) => setSelectedStatusFilter(status)}
        />

        {/* AI Insights Bar */}
        <AIInsightsBanner
          insights={insights}
          onApplyFilter={handleApplyInsightFilter}
        />

        {/* Spending Category Breakdown Chart */}
        <SpendingAnalytics
          categories={categorySpend}
          totalSpend={kpis.totalSpend}
          selectedCategory={selectedCategoryFilter}
          onSelectCategory={(cat) => setSelectedCategoryFilter(cat)}
        />

        {/* Running Ledger Section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Running Expense Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Categorized, validated, and human-confirmed bookkeeping transactions
              </p>
            </div>
          </div>

          <LedgerTable
            transactions={transactions}
            selectedCategoryFilter={selectedCategoryFilter}
            selectedStatusFilter={selectedStatusFilter}
            onCategoryFilterChange={(cat) => setSelectedCategoryFilter(cat)}
            onStatusFilterChange={(status) => setSelectedStatusFilter(status)}
            onOpenParser={handleOpenParser}
            onViewTransaction={(tx) => setViewingTransaction(tx)}
            onQuickVerify={handleQuickVerify}
            onDeleteTransaction={handleDeleteTransaction}
            onBulkVerify={handleBulkVerify}
            onBulkDelete={handleBulkDelete}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          <span>LedgerAI • D2C Bookkeeping Engine</span>
          <span>AI proposes • Validation checks • Human confirms</span>
        </div>
      </footer>

      {/* 1. Parse Invoice Modal */}
      <ParseInvoiceModal
        isOpen={isParseModalOpen}
        onClose={() => setIsParseModalOpen(false)}
        onExtractionSuccess={handleExtractionSuccess}
      />

      {/* 2. Structured Review Modal */}
      <StructuredReviewModal
        isOpen={isReviewModalOpen}
        parsedData={parsedDataForReview}
        rawText={rawTextForReview}
        ledger={transactions}
        onClose={() => {
          setIsReviewModalOpen(false);
          setParsedDataForReview(null);
        }}
        onSaveToLedger={handleSaveToLedger}
      />

      {/* 3. Transaction Detail / Edit Modal */}
      <TransactionDetailModal
        isOpen={!!viewingTransaction}
        transaction={viewingTransaction}
        onClose={() => setViewingTransaction(null)}
        onUpdate={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
}
