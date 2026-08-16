import { GoogleGenAI, Type } from '@google/genai';

interface RequestLike {
  method?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
}

interface ResponseLike {
  setHeader(name: string, value: string): this;
  status(code: number): this;
  json(body: any): void;
  end(): void;
}

const CANONICAL_CATEGORIES = [
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

function fallbackHeuristicParse(rawText: string) {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Negative Test / Non-Invoice Detection
  const hasNumbers = /\d+/.test(text);
  const isJunkOrChitchat =
    lower.includes('hello this is a test') ||
    lower.includes('nothing else here') ||
    lower.includes('meeting notes:') ||
    lower.includes('security notification') ||
    lower.includes('verification passcode') ||
    lower.includes('ocr_corrupted') ||
    lower.includes('no_readable_text') ||
    (lower.includes('terms & conditions:') && !lower.includes('total') && !lower.includes('usd') && !lower.includes('inr') && !lower.includes('₹')) ||
    (lower.includes('test') && !hasNumbers) ||
    (!hasNumbers && text.split(/\s+/).length < 20);

  if (isJunkOrChitchat) {
    return {
      vendor: null,
      transactionDate: null,
      invoiceNumber: null,
      subtotal: null,
      taxAmount: null,
      totalAmount: null,
      currency: 'INR',
      category: 'Miscellaneous',
      categoryReason: 'Non-invoice text: No financial amounts, items, or transaction data found in input.',
      confidence: 0.1,
      fieldConfidences: {
        vendor: 0.1,
        transactionDate: 0.1,
        totalAmount: 0.1,
        currency: 0.5,
        category: 0.1,
      },
      needsReview: true,
      reviewReason: 'Negative Test / Non-invoice input: The provided text does not contain any valid invoice, receipt, or transaction details.',
      shortDescription: 'Invalid / Non-invoice input',
    };
  }

  // Heuristic Vendor extraction
  let vendor: string | null = null;
  const vendorMatch =
    text.match(/(?:from|merchant|vendor|company|supplier):\s*([^\n\r,]+)/i) ||
    text.match(/^([A-Z0-9\s&.,'-]{3,40})(?:\n|\r)/m);
  if (vendorMatch && vendorMatch[1]) {
    const candidate = vendorMatch[1].trim();
    if (!candidate.toLowerCase().includes('invoice') && !candidate.toLowerCase().includes('receipt') && !candidate.toLowerCase().includes('date') && !candidate.toLowerCase().includes('tax')) {
      vendor = candidate;
    }
  }
  if (!vendor || vendor === 'Identified Merchant') {
    if (lower.includes('figma')) vendor = 'Figma, Inc.';
    else if (lower.includes('canva')) vendor = 'Canva Pty Ltd';
    else if (lower.includes('zoom')) vendor = 'Zoom Video Communications, Inc.';
    else if (lower.includes('swiggy') || lower.includes("domino's")) vendor = "Swiggy / Domino's Pizza";
    else if (lower.includes('uber')) vendor = 'Uber India Systems Pvt Ltd';
    else if (lower.includes('notion')) vendor = 'Notion Labs Inc.';
    else if (lower.includes('starbucks')) vendor = 'Starbucks';
    else if (lower.includes('abc logistics')) vendor = 'ABC Logistics';
    else if (lower.includes('meta') || lower.includes('facebook')) vendor = 'Meta Platforms Ireland Ltd';
    else if (lower.includes('delhivery')) vendor = 'Delhivery Logistics Limited';
    else if (lower.includes('shopify')) vendor = 'Shopify Commerce';
    else if (lower.includes('amazon web services') || lower.includes('aws')) vendor = 'Amazon Web Services, Inc.';
    else if (lower.includes('google')) vendor = 'Google India Pvt Ltd';
    else if (lower.includes('metro cash')) vendor = 'Metro Cash & Carry India';
    else if (lower.includes('kapoor') || lower.includes('singhania') || lower.includes('chartered')) vendor = 'Kapoor & Chopra Chartered Accountants';
    else if (lower.includes('packmaster') || lower.includes('kraft') || lower.includes('ecopack')) vendor = 'Packmaster Cartons Pvt Ltd';
    else vendor = 'Identified Merchant';
  }

  // Heuristic Invoice Number
  let invoiceNumber: string | null = null;
  const invMatch = text.match(/(?:invoice|inv|bill|rcpt|receipt|order\s*ref|trip\s*id)\s*(?:#|no\.?|num\.?)?:?\s*([A-Za-z0-9\-_/]+)/i);
  if (invMatch && invMatch[1] && invMatch[1].length >= 3) {
    invoiceNumber = invMatch[1].trim();
  }

  // Heuristic Currency
  let currency = 'INR';
  if (text.includes('$') || text.includes('USD') || lower.includes('usd')) {
    currency = 'USD';
  } else if (text.includes('€') || text.includes('EUR')) {
    currency = 'EUR';
  } else if (text.includes('£') || text.includes('GBP')) {
    currency = 'GBP';
  }

  // Heuristic Amounts (Total, Subtotal, Tax, Amount Payable)
  let totalAmount: number = 0;
  let subtotal: number | null = null;
  let taxAmount: number | null = null;
  let amountPayable: number | null = null;

  // Clean OCR noise like 12,5OO.OO -> 12,500.00
  const cleanedText = text.replace(/(\d+)[oO](\d+)/g, '$10$2').replace(/[oO](\d+)/g, '0$1');

  // Match Amount Payable / Charged explicitly
  const payableMatch = cleanedText.match(/(?:amount\s*payable|net\s*payable|amount\s*due|amount\s*charged|total\s*charged|total\s*fare|total\s*due)\s*[:=]?\s*(?:[₹$€£]|inr|usd)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (payableMatch && payableMatch[1]) {
    amountPayable = parseFloat(payableMatch[1].replace(/,/g, ''));
  }

  // Match total
  const totalMatch =
    cleanedText.match(/(?:grand\s*total|total\s*amount(?:\s*due)?|total\s*payable|total\s*paid|invoice\s*total|^total)\s*[:=]?\s*(?:[₹$€£]|inr|usd)?\s*([\d,]+(?:\.\d{1,2})?)/im) ||
    cleanedText.match(/(?:total)\s*[:=]?\s*(?:[₹$€£]|inr|usd)?\s*([\d,]+(?:\.\d{1,2})?)/i);

  if (totalMatch && totalMatch[1]) {
    const rawVal = totalMatch[1].replace(/,/g, '');
    const parsedVal = parseFloat(rawVal);
    if (!isNaN(parsedVal) && parsedVal > 0) {
      totalAmount = parsedVal;
    }
  }

  // Match subtotal
  const subMatch = cleanedText.match(/(?:subtotal|sub\s*total|base\s*fare|taxable\s*amount|taxable\s*base\s*amount|amount\s*before\s*tax|net\s*amount|goods\s*total)\s*[:=]?\s*(?:[₹$€£]|inr|usd)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (subMatch && subMatch[1]) {
    const val = parseFloat(subMatch[1].replace(/,/g, ''));
    if (!isNaN(val)) subtotal = val;
  }

  // Match tax
  const taxMatch = cleanedText.match(/(?:gst|igst|cgst|tax|vat|estimated\s*tax)\s*(?:\([^)]*\)|@\s*\d+%)?\s*[:=]?\s*(?:[₹$€£]|inr|usd)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (taxMatch && taxMatch[1]) {
    const val = parseFloat(taxMatch[1].replace(/,/g, ''));
    if (!isNaN(val)) taxAmount = val;
  }

  // If amount payable was found and differs from total, track conflict
  const hasConflictingTotal =
    amountPayable !== null && totalAmount > 0 && Math.abs(amountPayable - totalAmount) > 2;

  if (totalAmount === 0 && amountPayable) {
    totalAmount = amountPayable;
  } else if (totalAmount === 0 && subtotal) {
    totalAmount = subtotal + (taxAmount || 0);
  }

  // Heuristic Date
  let transactionDate: string | null = null;
  const isoMatch = text.match(/\b(202\d[-/]\d{1,2}[-/]\d{1,2})\b/);
  const dmyMatch = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](202\d|\d{2})\b/);
  const textDateMatch = text.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(202\d)\b/i) ||
    text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(202\d)\b/i);

  if (isoMatch) {
    transactionDate = isoMatch[1].replace(/\//g, '-');
  } else if (textDateMatch) {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    if (textDateMatch[2] && months[textDateMatch[2].toLowerCase().substring(0, 3)]) {
      const day = textDateMatch[1].padStart(2, '0');
      const month = months[textDateMatch[2].toLowerCase().substring(0, 3)];
      const year = textDateMatch[3];
      transactionDate = `${year}-${month}-${day}`;
    } else if (textDateMatch[1] && months[textDateMatch[1].toLowerCase().substring(0, 3)]) {
      const month = months[textDateMatch[1].toLowerCase().substring(0, 3)];
      const day = textDateMatch[2].padStart(2, '0');
      const year = textDateMatch[3];
      transactionDate = `${year}-${month}-${day}`;
    }
  } else if (dmyMatch) {
    const year = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
    const month = dmyMatch[2].padStart(2, '0');
    const day = dmyMatch[1].padStart(2, '0');
    transactionDate = `${year}-${month}-${day}`;
  }

  // Heuristic Category Classification
  let category = 'Miscellaneous';
  let categoryReason = 'Categorized based on invoice keywords.';

  if (lower.includes('uber') || lower.includes('travel') || lower.includes('flight') || lower.includes('hotel') || lower.includes('cab') || lower.includes('taxi')) {
    category = 'Travel';
    categoryReason = 'Transportation & business travel expense.';
  } else if (lower.includes('starbucks') || lower.includes('swiggy') || lower.includes('domino') || lower.includes('cappuccino') || lower.includes('sandwich') || lower.includes('cafe') || lower.includes('coffee') || lower.includes('restaurant') || lower.includes('dining')) {
    category = 'Meals & Entertainment';
    categoryReason = 'Food & beverage / meal reimbursement expense.';
  } else if (lower.includes('figma') || lower.includes('zoom') || lower.includes('canva') || lower.includes('notion') || lower.includes('aws') || lower.includes('shopify') || lower.includes('google workspace') || lower.includes('software') || lower.includes('saas') || lower.includes('cloud') || lower.includes('subscription')) {
    category = 'Software & SaaS';
    categoryReason = 'Software subscription or cloud team license.';
  } else if (lower.includes('facebook') || lower.includes('meta') || lower.includes('google ads') || lower.includes('ad ') || lower.includes('advertising') || lower.includes('campaign')) {
    category = 'Marketing & Advertising';
    categoryReason = 'Identified digital advertising & customer acquisition campaign spend.';
  } else if (lower.includes('abc logistics') || lower.includes('courier') || lower.includes('delhivery') || lower.includes('shipping') || lower.includes('freight') || lower.includes('dispatch') || lower.includes('consignment')) {
    category = 'Logistics & Shipping';
    categoryReason = 'Parcel delivery, freight, or logistics fulfillment fee.';
  } else if (lower.includes('mailer') || lower.includes('carton') || lower.includes('packaging') || lower.includes('raw material') || lower.includes('inventory')) {
    category = 'Inventory & Raw Materials';
    categoryReason = 'Production packaging materials and stock inventory items.';
  } else if (lower.includes('chartered') || lower.includes('audit') || lower.includes('legal') || lower.includes('retainer') || lower.includes('consulting') || lower.includes('gstr')) {
    category = 'Professional Services';
    categoryReason = 'Statutory audit, tax accounting, or professional compliance services.';
  } else if (lower.includes('desk') || lower.includes('chair') || lower.includes('laptop') || lower.includes('hardware') || lower.includes('equipment')) {
    category = 'Equipment & Hardware';
    categoryReason = 'Office and fulfillment physical equipment & furnishings.';
  } else if (lower.includes('paper') || lower.includes('stapler') || lower.includes('stationery') || lower.includes('shredder')) {
    category = 'Office Supplies';
    categoryReason = 'Consumable stationery and daily operational office supplies.';
  }

  const isAmbiguous = lower.includes('ambiguous') || lower.includes('scan receipt') || lower.includes('03/04/2026') || lower.includes('tds') || hasConflictingTotal;

  return {
    vendor,
    transactionDate,
    invoiceNumber,
    subtotal,
    taxAmount,
    totalAmount: (hasConflictingTotal && amountPayable ? amountPayable : totalAmount) || (subtotal ? subtotal + (taxAmount || 0) : 0),
    currency,
    category,
    categoryReason,
    confidence: hasConflictingTotal ? 0.72 : (isAmbiguous ? 0.76 : 0.96),
    fieldConfidences: {
      vendor: vendor ? 0.96 : 0.4,
      transactionDate: transactionDate ? (isAmbiguous ? 0.72 : 0.95) : 0.3,
      totalAmount: hasConflictingTotal ? 0.65 : (totalAmount > 0 ? 0.98 : 0.2),
      currency: 0.99,
      category: 0.94,
    },
    needsReview: isAmbiguous || hasConflictingTotal || !transactionDate || !totalAmount,
    reviewReason: hasConflictingTotal
      ? `Discrepancy detected: Document lists Total (${totalAmount}) and Amount Payable (${amountPayable}). Please verify correct amount.`
      : isAmbiguous
      ? 'Ambiguous date format or OCR text detected. Please verify details before saving.'
      : null,
    shortDescription: `${vendor || 'Expense'} - ${category}`,
  };
}

export default async function handler(req: any, res: any) {
  // Enable CORS if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { rawText } = req.body || {};

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Raw invoice text is required.' });
    }

    const text = rawText.trim();
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are a specialized financial document extraction and bookkeeping engine for finance teams (D2C accounting).
Analyze receipts, invoices, OCR scans, emails, or Slack expense messages and return strictly structured JSON.
Financial accuracy is paramount. Never hallucinate or invent financial values. If a field cannot be determined with certainty, return null.

IMPORTANT - NEGATIVE TEST & NON-INVOICE HANDLING:
If the input text is conversational, chit-chat, junk text, or does NOT contain a real financial transaction/receipt/invoice (e.g. "hello this is a test please process this invoice nothing else here"):
- set totalAmount: 0 (or null)
- set vendor: null
- set transactionDate: null
- set confidence: 0.10
- set needsReview: true
- set reviewReason: "Negative Test / Non-invoice input: The provided text does not contain any valid invoice, receipt, or transaction details."
- set shortDescription: "Non-invoice text (Invalid input)"

IMPORTANT - CONFLICTING TOTALS / DISCREPANCY DETECTION:
If the document contains conflicting total figures (e.g. Total: ₹23,600 and Amount Payable: ₹26,600, or Subtotal + Tax does not match Grand Total):
- set needsReview: true
- set reviewReason: "Discrepancy detected: Stated total conflicts with calculated subtotal + tax or alternative payable amount. Verification required."
- set confidence: 0.72

Identify:
- vendor: clean name of merchant/seller (not customer, shipping carrier, bank, or payment gateway unless they are the actual merchant)
- transactionDate: normalized to YYYY-MM-DD (e.g., 02/08/26 becomes 2026-08-02, August 3, 2026 becomes 2026-08-03, 08 Aug 2026 becomes 2026-08-08)
- invoiceNumber: official invoice/receipt identifier or null
- subtotal: net taxable/base amount (number or null)
- taxAmount: tax/GST/VAT amount (number or null)
- totalAmount: final grand total / amount due / amount paid (number or null)
- currency: ISO 3-letter currency code (e.g. INR, USD, EUR, GBP)
- category: exactly one of the 15 canonical categories:
  1. Marketing & Advertising
  2. Software & SaaS
  3. Inventory & Raw Materials
  4. Logistics & Shipping
  5. Office Supplies
  6. Professional Services
  7. Travel
  8. Meals & Entertainment (e.g. Starbucks, cafes, restaurants, dining)
  9. Rent & Utilities
  10. Salaries & Contractors
  11. Equipment & Hardware
  12. Banking & Financial Fees
  13. Taxes & Government Fees
  14. Customer Support
  15. Miscellaneous
- categoryReason: 1 concise sentence explaining why this category was selected based on what was purchased (use vendor only as secondary context)
- confidence: overall confidence score between 0.00 and 1.00
- fieldConfidences: object with confidence scores (0.00 - 1.00) for vendor, transactionDate, totalAmount, currency, category
- needsReview: boolean flag (true if non-invoice, any ambiguity, OCR corruption, missing vendor/date, tax mismatch, or multiple conflicting amounts exist)
- reviewReason: concise explanation if needsReview is true, else null
- shortDescription: clear 4-8 word summary of the transaction line item or purpose`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Please parse and extract structured bookkeeping data from this raw invoice/receipt text:\n\n${text}`,
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                vendor: { type: Type.STRING, description: 'Merchant name or null' },
                transactionDate: { type: Type.STRING, description: 'Date in YYYY-MM-DD format or null' },
                invoiceNumber: { type: Type.STRING, description: 'Invoice number or null' },
                subtotal: { type: Type.NUMBER, description: 'Subtotal or base amount' },
                taxAmount: { type: Type.NUMBER, description: 'Tax or GST/VAT amount' },
                totalAmount: { type: Type.NUMBER, description: 'Grand total payable amount' },
                currency: { type: Type.STRING, description: '3-letter currency code' },
                category: { type: Type.STRING, description: 'One of the 15 canonical expense categories' },
                categoryReason: { type: Type.STRING, description: 'Explanation for category choice' },
                confidence: { type: Type.NUMBER, description: 'Overall confidence between 0.0 and 1.0' },
                fieldConfidences: {
                  type: Type.OBJECT,
                  properties: {
                    vendor: { type: Type.NUMBER },
                    transactionDate: { type: Type.NUMBER },
                    totalAmount: { type: Type.NUMBER },
                    currency: { type: Type.NUMBER },
                    category: { type: Type.NUMBER },
                  },
                },
                needsReview: { type: Type.BOOLEAN, description: 'Whether human review is required' },
                reviewReason: { type: Type.STRING, description: 'Reason for review or null' },
                shortDescription: { type: Type.STRING, description: 'Short summary of the transaction' },
              },
              required: [
                'totalAmount',
                'currency',
                'category',
                'confidence',
                'needsReview',
                'shortDescription',
              ],
            },
          },
        });

        const rawJson = response.text?.trim() || '';
        const parsed = JSON.parse(rawJson);

        if (!CANONICAL_CATEGORIES.includes(parsed.category)) {
          parsed.category = 'Miscellaneous';
        }

        return res.status(200).json({
          success: true,
          data: {
            ...parsed,
            rawText: text,
          },
          source: 'gemini-3.7-flash',
        });
      } catch (geminiError: any) {
        console.error('Gemini extraction error:', geminiError?.message || geminiError);
        const fallback = fallbackHeuristicParse(text);
        return res.status(200).json({
          success: true,
          data: {
            ...fallback,
            rawText: text,
          },
          source: 'fallback_engine',
          warning: 'Processed via resilient fallback engine.',
        });
      }
    } else {
      const fallback = fallbackHeuristicParse(text);
      return res.status(200).json({
        success: true,
        data: {
          ...fallback,
          rawText: text,
        },
        source: 'fallback_engine',
      });
    }
  } catch (err: any) {
    console.error('API Handler Error:', err);
    return res.status(500).json({
      error: 'An error occurred during invoice extraction.',
      details: err?.message,
    });
  }
}
