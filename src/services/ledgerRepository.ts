import { INITIAL_SAMPLE_TRANSACTIONS } from '../data/sampleTransactions';
import {
  AIInsightItem,
  CANONICAL_CATEGORIES,
  CategorySpendSummary,
  ExpenseCategory,
  FinancialKPIs,
  LedgerTransaction,
  TransactionStatus,
} from '../types';

const STORAGE_KEY = 'ledgerai_transactions_v1';

// Category color mappings for distinct financial visualization
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Marketing & Advertising': '#3B82F6', // Blue
  'Software & SaaS': '#8B5CF6', // Purple
  'Inventory & Raw Materials': '#10B981', // Emerald
  'Logistics & Shipping': '#F59E0B', // Amber
  'Equipment & Hardware': '#06B6D4', // Cyan
  'Professional Services': '#EC4899', // Pink
  'Office Supplies': '#64748B', // Slate
  'Travel': '#F97316', // Orange
  'Meals & Entertainment': '#14B8A6', // Teal
  'Rent & Utilities': '#6366F1', // Indigo
  'Salaries & Contractors': '#84CC16', // Lime
  'Banking & Financial Fees': '#EAB308', // Yellow
  'Taxes & Government Fees': '#EF4444', // Red
  'Customer Support': '#A855F7', // Purple-500
  'Miscellaneous': '#94A3B8', // Gray
};

export class LedgerRepository {
  public static getAll(): LedgerTransaction[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading ledger from localStorage:', e);
    }
    // Seed default sample data if empty
    this.saveAll(INITIAL_SAMPLE_TRANSACTIONS);
    return INITIAL_SAMPLE_TRANSACTIONS;
  }

  public static saveAll(transactions: LedgerTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving ledger to localStorage:', e);
    }
  }

  public static add(transaction: LedgerTransaction): LedgerTransaction[] {
    const list = this.getAll();
    const updated = [transaction, ...list];
    this.saveAll(updated);
    return updated;
  }

  public static update(transaction: LedgerTransaction): LedgerTransaction[] {
    const list = this.getAll();
    const updated = list.map((item) =>
      item.id === transaction.id
        ? { ...transaction, updatedAt: new Date().toISOString() }
        : item
    );
    this.saveAll(updated);
    return updated;
  }

  public static delete(id: string): LedgerTransaction[] {
    const list = this.getAll();
    const updated = list.filter((item) => item.id !== id);
    this.saveAll(updated);
    return updated;
  }

  public static setStatus(id: string, status: TransactionStatus): LedgerTransaction[] {
    const list = this.getAll();
    const updated = list.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            reviewReason: status === 'Verified' ? null : item.reviewReason,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    this.saveAll(updated);
    return updated;
  }

  public static bulkVerify(ids: string[]): LedgerTransaction[] {
    const list = this.getAll();
    const setIds = new Set(ids);
    const updated = list.map((item) =>
      setIds.has(item.id)
        ? {
            ...item,
            status: 'Verified' as TransactionStatus,
            reviewReason: null,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    this.saveAll(updated);
    return updated;
  }

  public static resetToSample(): LedgerTransaction[] {
    this.saveAll(INITIAL_SAMPLE_TRANSACTIONS);
    return INITIAL_SAMPLE_TRANSACTIONS;
  }

  public static clearAll(): LedgerTransaction[] {
    this.saveAll([]);
    return [];
  }

  public static calculateKPIs(transactions: LedgerTransaction[]): FinancialKPIs {
    const totalSpend = transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
    const transactionCount = transactions.length;
    const vendorSet = new Set(transactions.map((t) => t.vendor.trim().toLowerCase()));
    const vendorCount = vendorSet.size;
    const needsReviewCount = transactions.filter((t) => t.status === 'Needs Review').length;
    const verifiedCount = transactions.filter((t) => t.status === 'Verified').length;
    const avgTransactionSpend = transactionCount > 0 ? totalSpend / transactionCount : 0;

    const currencyBreakdown: Record<string, number> = {};
    for (const t of transactions) {
      const curr = t.currency || 'INR';
      currencyBreakdown[curr] = (currencyBreakdown[curr] || 0) + (t.totalAmount || 0);
    }

    return {
      totalSpend,
      transactionCount,
      vendorCount,
      needsReviewCount,
      verifiedCount,
      avgTransactionSpend,
      currencyBreakdown,
    };
  }

  public static getCategorySpend(transactions: LedgerTransaction[]): CategorySpendSummary[] {
    const totals: Record<ExpenseCategory, { amount: number; count: number }> = {} as any;

    for (const cat of CANONICAL_CATEGORIES) {
      totals[cat] = { amount: 0, count: 0 };
    }

    let overallSum = 0;
    for (const t of transactions) {
      const cat = t.category;
      if (totals[cat]) {
        totals[cat].amount += t.totalAmount || 0;
        totals[cat].count += 1;
      } else {
        totals['Miscellaneous'].amount += t.totalAmount || 0;
        totals['Miscellaneous'].count += 1;
      }
      overallSum += t.totalAmount || 0;
    }

    return Object.entries(totals)
      .map(([cat, data]) => ({
        category: cat as ExpenseCategory,
        amount: data.amount,
        count: data.count,
        percentage: overallSum > 0 ? (data.amount / overallSum) * 100 : 0,
        color: CATEGORY_COLORS[cat as ExpenseCategory] || '#94A3B8',
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.amount - a.amount);
  }

  public static generateInsights(transactions: LedgerTransaction[]): AIInsightItem[] {
    const insights: AIInsightItem[] = [];
    if (transactions.length === 0) {
      return [
        {
          id: 'ins_empty',
          type: 'suggestion',
          title: 'Your Ledger is Ready',
          description: 'Paste your first raw invoice or receipt to automatically extract and categorize expenses.',
          actionLabel: 'Parse Invoice',
        },
      ];
    }

    const totalSpend = transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
    const categorySpend = this.getCategorySpend(transactions);
    const needsReview = transactions.filter((t) => t.status === 'Needs Review');

    // 1. Review status insight
    if (needsReview.length > 0) {
      insights.push({
        id: 'ins_review_required',
        type: 'alert',
        title: `${needsReview.length} Transaction${needsReview.length > 1 ? 's' : ''} Require Review`,
        description: `${needsReview.length} transaction${needsReview.length > 1 ? 's' : ''} flagged for ambiguity or tax compliance (e.g. ${needsReview[0].vendor}). Review before closing month-end books.`,
        metric: `${needsReview.length} Pending`,
        actionLabel: 'Filter Needs Review',
        actionFilter: { status: 'Needs Review' },
      });
    } else {
      insights.push({
        id: 'ins_all_verified',
        type: 'highlight',
        title: 'Month-End Books Ready',
        description: 'All 100% of recorded transactions have been verified and reconciled with zero compliance flags.',
        metric: '100% Verified',
      });
    }

    // 2. Largest category driver
    if (categorySpend.length > 0 && totalSpend > 0) {
      const topCat = categorySpend[0];
      const pct = Math.round(topCat.percentage);
      insights.push({
        id: 'ins_top_category',
        type: 'trend',
        title: `${topCat.category} is Largest Expense (${pct}%)`,
        description: `${topCat.category} represents ₹${topCat.amount.toLocaleString('en-IN')} across ${topCat.count} invoices for the current period.`,
        metric: `${pct}% Total Spend`,
        actionLabel: `View ${topCat.category}`,
        actionFilter: { category: topCat.category },
      });
    }

    // 3. Top Vendor spend
    const vendorMap: Record<string, number> = {};
    for (const t of transactions) {
      const v = t.vendor.trim();
      vendorMap[v] = (vendorMap[v] || 0) + (t.totalAmount || 0);
    }
    const sortedVendors = Object.entries(vendorMap).sort((a, b) => b[1] - a[1]);
    if (sortedVendors.length > 0) {
      const [topVendor, topVendorAmount] = sortedVendors[0];
      const topVendorPct = totalSpend > 0 ? Math.round((topVendorAmount / totalSpend) * 100) : 0;
      insights.push({
        id: 'ins_top_vendor',
        type: 'highlight',
        title: `${topVendor} is Primary Merchant`,
        description: `Total outlay of ₹${topVendorAmount.toLocaleString('en-IN')} (${topVendorPct}% of total budget).`,
        metric: `₹${topVendorAmount.toLocaleString('en-IN')}`,
        actionLabel: `Filter ${topVendor}`,
        actionFilter: { vendor: topVendor },
      });
    }

    // 4. Software & SaaS automation note
    const saasItems = transactions.filter((t) => t.category === 'Software & SaaS');
    if (saasItems.length > 0) {
      const saasTotal = saasItems.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
      insights.push({
        id: 'ins_saas_recurring',
        type: 'suggestion',
        title: 'Recurring SaaS Stack Identified',
        description: `Identified ${saasItems.length} recurring SaaS tool subscriptions (totaling ₹${saasTotal.toLocaleString('en-IN')}).`,
        actionLabel: 'View Software',
        actionFilter: { category: 'Software & SaaS' },
      });
    }

    return insights;
  }

  public static exportToCSV(transactions: LedgerTransaction[]): void {
    const headers = [
      'Transaction ID',
      'Date',
      'Vendor',
      'Invoice Number',
      'Category',
      'Subtotal',
      'Tax Amount',
      'Total Amount',
      'Currency',
      'Status',
      'Confidence',
      'Description',
      'Review Reason',
      'Category Reason',
    ];

    const rows = transactions.map((t) => [
      t.id,
      t.transactionDate,
      `"${(t.vendor || '').replace(/"/g, '""')}"`,
      `"${(t.invoiceNumber || '').replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.subtotal ?? '',
      t.taxAmount ?? '',
      t.totalAmount,
      t.currency,
      t.status,
      `${Math.round(t.confidence * 100)}%`,
      `"${(t.shortDescription || '').replace(/"/g, '""')}"`,
      `"${(t.reviewReason || '').replace(/"/g, '""')}"`,
      `"${(t.categoryReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LedgerAI_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public static exportToJSON(transactions: LedgerTransaction[]): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `LedgerAI_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
