export type ExpenseCategory =
  | 'Marketing & Advertising'
  | 'Software & SaaS'
  | 'Inventory & Raw Materials'
  | 'Logistics & Shipping'
  | 'Office Supplies'
  | 'Professional Services'
  | 'Travel'
  | 'Meals & Entertainment'
  | 'Rent & Utilities'
  | 'Salaries & Contractors'
  | 'Equipment & Hardware'
  | 'Banking & Financial Fees'
  | 'Taxes & Government Fees'
  | 'Customer Support'
  | 'Miscellaneous';

export const CANONICAL_CATEGORIES: ExpenseCategory[] = [
  'Marketing & Advertising',
  'Software & SaaS',
  'Inventory & Raw Materials',
  'Logistics & Shipping',
  'Office Supplies',
  'Professional Services',
  'Travel',
  'Meals & Entertainment',
  'Rent & Utilities',
  'Salaries & Contractors',
  'Equipment & Hardware',
  'Banking & Financial Fees',
  'Taxes & Government Fees',
  'Customer Support',
  'Miscellaneous',
];

export type TransactionStatus = 'Verified' | 'Needs Review';

export interface FieldConfidences {
  vendor: number;
  transactionDate: number;
  totalAmount: number;
  currency: number;
  category: number;
}

export interface ValidationFlag {
  field: string;
  severity: 'warning' | 'error' | 'info';
  message: string;
}

export interface ParsedInvoice {
  vendor: string | null;
  transactionDate: string | null;
  invoiceNumber: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  currency: string;
  category: ExpenseCategory;
  categoryReason: string | null;
  confidence: number;
  fieldConfidences: FieldConfidences;
  needsReview: boolean;
  reviewReason: string | null;
  shortDescription: string;
  rawText?: string;
  validationFlags?: ValidationFlag[];
}

export interface LedgerTransaction {
  id: string;
  vendor: string;
  transactionDate: string;
  invoiceNumber: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  totalAmount: number;
  currency: string;
  category: ExpenseCategory;
  categoryReason?: string;
  confidence: number;
  fieldConfidences: FieldConfidences;
  status: TransactionStatus;
  reviewReason: string | null;
  shortDescription: string;
  rawText?: string;
  createdAt: string;
  updatedAt: string;
  source: 'ai_parsed' | 'manual';
  notes?: string;
}

export interface DuplicateWarning {
  matchedTransactionId: string;
  matchedInvoiceNumber?: string | null;
  matchedVendor: string;
  matchedAmount: number;
  matchedDate: string;
  matchType: 'exact_invoice_number' | 'vendor_amount_date' | 'potential_match';
  message: string;
}

export interface FinancialKPIs {
  totalSpend: number;
  transactionCount: number;
  vendorCount: number;
  needsReviewCount: number;
  verifiedCount: number;
  avgTransactionSpend: number;
  currencyBreakdown: Record<string, number>;
}

export interface CategorySpendSummary {
  category: ExpenseCategory;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface AIInsightItem {
  id: string;
  type: 'alert' | 'highlight' | 'trend' | 'suggestion';
  title: string;
  description: string;
  metric?: string;
  actionLabel?: string;
  actionFilter?: {
    category?: ExpenseCategory;
    status?: TransactionStatus;
    vendor?: string;
  };
}
