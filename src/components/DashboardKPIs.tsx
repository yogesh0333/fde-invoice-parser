import React from 'react';
import {
  IndianRupee,
  Receipt,
  Building2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { FinancialKPIs, TransactionStatus } from '../types';

interface DashboardKPIsProps {
  kpis: FinancialKPIs;
  selectedStatus: TransactionStatus | 'All';
  onSelectStatusFilter: (status: TransactionStatus | 'All') => void;
}

export const DashboardKPIs: React.FC<DashboardKPIsProps> = ({
  kpis,
  selectedStatus,
  onSelectStatusFilter,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Spend Card */}
      <div
        id="kpi-card-total-spend"
        className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
            Total Spend (August)
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <IndianRupee className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            ₹{Math.round(kpis.totalSpend).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center text-emerald-600 font-medium">
              <TrendingUp className="mr-0.5 h-3.5 w-3.5" />
              Avg ₹{Math.round(kpis.avgTransactionSpend).toLocaleString('en-IN')}
            </span>
            <span>per entry</span>
          </div>
        </div>
      </div>

      {/* 2. Transactions Card */}
      <div
        id="kpi-card-transactions"
        onClick={() => onSelectStatusFilter('All')}
        className={`relative cursor-pointer overflow-hidden rounded-xl border p-5 shadow-xs transition-all hover:shadow-md ${
          selectedStatus === 'All'
            ? 'border-indigo-300 bg-indigo-50/20 ring-2 ring-indigo-500/20'
            : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
            Transactions
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Receipt className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {kpis.transactionCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {kpis.verifiedCount} verified
            </span>
            <span>• {kpis.needsReviewCount} flagged</span>
          </div>
        </div>
      </div>

      {/* 3. Vendors Card */}
      <div
        id="kpi-card-vendors"
        className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
            Active Vendors
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Building2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {kpis.vendorCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across logistics, marketing, & SaaS suppliers
          </div>
        </div>
      </div>

      {/* 4. Needs Review Card */}
      <div
        id="kpi-card-needs-review"
        onClick={() =>
          onSelectStatusFilter(
            selectedStatus === 'Needs Review' ? 'All' : 'Needs Review'
          )
        }
        className={`relative cursor-pointer overflow-hidden rounded-xl border p-5 shadow-xs transition-all hover:shadow-md ${
          kpis.needsReviewCount > 0
            ? selectedStatus === 'Needs Review'
              ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-500/30'
              : 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60'
            : 'border-slate-200/80 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
            Needs Review
          </span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              kpis.needsReviewCount > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {kpis.needsReviewCount > 0 ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            )}
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-2xl font-bold tracking-tight ${
              kpis.needsReviewCount > 0 ? 'text-amber-900' : 'text-slate-900'
            }`}
          >
            {kpis.needsReviewCount}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            {kpis.needsReviewCount > 0 ? (
              <span className="font-medium text-amber-700 underline decoration-amber-400">
                {selectedStatus === 'Needs Review' ? 'Showing flagged only' : 'Click to filter review queue'}
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">Zero compliance flags</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
