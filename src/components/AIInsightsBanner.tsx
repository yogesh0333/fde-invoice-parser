import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AIInsightItem, ExpenseCategory, TransactionStatus } from '../types';

interface AIInsightsBannerProps {
  insights: AIInsightItem[];
  onApplyFilter?: (filter: {
    category?: ExpenseCategory;
    status?: TransactionStatus;
    vendor?: string;
  }) => void;
}

export const AIInsightsBanner: React.FC<AIInsightsBannerProps> = ({
  insights,
  onApplyFilter,
}) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div
      id="ai-insights-section"
      className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-blue-50/50 p-4.5 shadow-xs"
    >
      <div className="flex items-center justify-between gap-3 border-b border-indigo-100/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-sm text-slate-900">
            Smart AI Insights & Bookkeeping Reconciliations
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Live Ledger Intelligence • Real-time
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {insights.map((item) => {
          const isAlert = item.type === 'alert';
          const isHighlight = item.type === 'highlight';
          const isTrend = item.type === 'trend';

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-lg border p-3 transition-all ${
                isAlert
                  ? 'border-amber-200 bg-amber-50/60 text-amber-950'
                  : isHighlight
                  ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                  : isTrend
                  ? 'border-blue-200 bg-blue-50/40 text-blue-950'
                  : 'border-slate-200 bg-white text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    {isAlert ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    ) : isHighlight ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.metric && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                        isAlert
                          ? 'bg-amber-200/80 text-amber-800'
                          : isHighlight
                          ? 'bg-emerald-200/80 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {item.metric}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {item.actionLabel && item.actionFilter && onApplyFilter && (
                <button
                  type="button"
                  onClick={() => onApplyFilter(item.actionFilter!)}
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 transition-colors focus:outline-none"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
