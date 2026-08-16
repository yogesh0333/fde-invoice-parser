import React from 'react';
import {
  FileText,
  PlusCircle,
  Download,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { FinancialKPIs } from '../types';

interface NavbarProps {
  kpis: FinancialKPIs;
  onOpenParser: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  kpis,
  onOpenParser,
  onResetData,
  onExportCSV,
  onExportJSON,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Persona Info */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-sm shadow-indigo-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-slate-900 text-lg">LedgerAI</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 text-xs ring-1 ring-indigo-700/10">
                <Sparkles className="h-3 w-3" /> D2C Finance Ops
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Month-End Close <span className="font-medium text-slate-700">August 2026</span> • Neha's Workspace
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Status Pill */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs md:flex">
            {kpis.needsReviewCount > 0 ? (
              <span className="flex items-center gap-1 font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                {kpis.needsReviewCount} for review
              </span>
            ) : (
              <span className="flex items-center gap-1 font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                All verified
              </span>
            )}
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">{kpis.transactionCount} transactions</span>
          </div>

          {/* Export Dropdown / Buttons */}
          <button
            id="btn-export-csv"
            onClick={onExportCSV}
            title="Export Ledger to CSV"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 text-xs shadow-xs hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>

          {/* Reset Demo Data */}
          <button
            id="btn-reset-demo"
            onClick={onResetData}
            title="Reset to 8 sample D2C business transactions"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-600 text-xs shadow-xs hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden md:inline">Reset Data</span>
          </button>

          {/* Primary CTA: Parse Invoice */}
          <button
            id="btn-nav-parse-invoice"
            onClick={onOpenParser}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-1.5 font-semibold text-white text-xs shadow-sm hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Parse Invoice</span>
          </button>
        </div>
      </div>
    </header>
  );
};
