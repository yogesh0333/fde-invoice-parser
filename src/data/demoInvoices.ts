export interface DemoInvoice {
  id: string;
  title: string;
  badge: string;
  description: string;
  rawText: string;
  categoryHint: string;
  isAmbiguous?: boolean;
}

export const DEMO_INVOICES: DemoInvoice[] = [
  {
    id: 'demo_meta',
    title: 'Meta Ads Invoice',
    badge: 'Clean / Marketing',
    description: 'Standard Facebook & Instagram ad campaign invoice with GST breakdown',
    categoryHint: 'Marketing & Advertising',
    rawText: `Invoice #INV-2391

Meta Platforms Ireland Ltd
4 Grand Canal Square, Grand Canal Harbour, Dublin 2, Ireland
GSTIN: 9919IRL29003OS8

Date: 12 August 2026

Facebook Advertising Campaign
Account ID: act_9921448102
Campaign: Summer Sale Retargeting & Direct Purchase

Subtotal: ₹42,372.00
GST (18%): ₹7,627.00
Total Amount Due: ₹49,999.00

Payment Status: Paid
Payment Method: Corporate Visa ending 4410`,
  },
  {
    id: 'demo_aws',
    title: 'AWS Cloud Hosting',
    badge: 'USD SaaS / Multi-service',
    description: 'Cloud hosting bill in USD for EC2, S3, and CloudFront services',
    categoryHint: 'Software & SaaS',
    rawText: `Amazon Web Services, Inc.
410 Terry Avenue North, Seattle, WA 98109-5210, USA

TAX INVOICE
Invoice Number: 984120938
Invoice Date: August 14, 2026

Summary of Charges:
- Amazon Elastic Compute Cloud (EC2): $184.50
- Amazon Simple Storage Service (S3): $48.20
- Amazon CloudFront CDN Bandwidth: $66.30

Subtotal: USD 299.00
Estimated Tax: USD 0.00
Total Amount Payable: USD 299.00

Payment Status: Succeeded via Auto-debit`,
  },
  {
    id: 'demo_delhivery',
    title: 'Delhivery Courier Bill',
    badge: 'Logistics / Shipping',
    description: 'Pan-India surface courier and express shipping invoice with tracking summary',
    categoryHint: 'Logistics & Shipping',
    rawText: `DELHIVERY LOGISTICS LIMITED
Plot No. 5, Sector 44, Gurugram, Haryana - 122002
GSTIN: 06AAACD8921B1Z2

BILL OF SUPPLY / TAX INVOICE
Bill No: DLV-2026-AUG-9912
Date of Invoice: 11-08-2026

Service Provided: Pan-India B2C Courier Delivery Services
Consignment Weight Volume: 840 kg (510 D2C Parcels)
State of Supply: Maharashtra (27)

Taxable Base Amount: ₹23,450.00
CGST (9%): ₹2,110.50
SGST (9%): ₹2,110.50
Net Total Payable: ₹27,671.00

Bank Transfer Reference: UTR-ICICI-88392104`,
  },
  {
    id: 'demo_messy_ocr',
    title: 'Messy OCR Receipt',
    badge: 'Needs Review / Noise',
    description: 'Scanned receipt with OCR misreads (0 vs O), faint numbers, and ambiguous date',
    isAmbiguous: true,
    categoryHint: 'Office Supplies / Ambiguous',
    rawText: `*** SCAN RECEIPT / OCR TEXT ***
METRO CASH & CARRY INDIA
Branch: Koramangala 5th Block

DATE : 03/04/2026   TIME: 18:42
Rcpt No : RC-991-XX

ITEMS:
- 10x Copier Paper Ream A4 75GSM : 2,400.00
- 4x Heavy Duty Packing Tape Dispenser : 1,199.00
- 1x Commercial Shredder 15-Sheet : 8,901.00

SUBTOTAL: 12,500.00
VAT/TAX: INCL.
AM0UNT DUE : INR 12,5OO.OO

PAID BY CASH : 13,000.00
CHANGE RETURNED : 500.00

THANK YOU FOR SHOPPING!
*Date format is ambiguous (could be 3 April or 4 March 2026)*`,
  },
  {
    id: 'demo_shopify',
    title: 'Shopify Subscription',
    badge: 'Clean / SaaS',
    description: 'Monthly eCommerce platform subscription invoice with GST breakdown',
    categoryHint: 'Software & SaaS',
    rawText: `Shopify Commerce Singapore Pte. Ltd.
Tax Invoice #SHO-2026-88401
Invoice Date: August 01, 2026

Billed To:
The Urban Glow D2C Brands LLP
GSTIN: 27AABCT9981Q1Z4

Line Items:
1. Advanced Shopify Monthly Subscription (Aug 1 - Aug 31, 2026) : INR 2,118.00
2. Transaction Fees (0.5% gateway surcharge) : INR 381.00

Net Total: ₹2,118.00
GST (18% IGST): ₹381.00
Grand Total: ₹2,499.00

Status: Paid in Full`,
  },
  {
    id: 'demo_ca_audit',
    title: 'CA Retainer Invoice',
    badge: 'Professional / TDS Flag',
    description: 'Chartered Accountant professional advisory fee with section 194J clause',
    categoryHint: 'Professional Services',
    rawText: `TAX INVOICE
KAPOOR & CHOPRA CHARTERED ACCOUNTANTS
Head Office: Nariman Point, Mumbai - 400021

Invoice No: KC/2026/088
Invoice Date: 14 August 2026

Professional Retainer Charges:
- Filing of Monthly GSTR-1 and GSTR-3B for July 2026
- Annual Statutory Bookkeeping Audit Advance
- TDS Reconciliation and Form 26AS matching

Fee Amount: ₹30,000.00
IGST (18%): ₹5,400.00
Gross Invoice Value: ₹35,400.00

*Client is requested to deduct TDS under Section 194J @ 10% (₹3,000.00) if applicable, and pay Net Amount of ₹32,400.00.*`,
  },
  {
    id: 'demo_packaging',
    title: 'Bulk Box Packaging',
    badge: 'Inventory / Line Items',
    description: 'Packaging manufacturer bill with HSN codes, quantity, and freight charges',
    categoryHint: 'Inventory & Raw Materials',
    rawText: `PACKMASTER CARTONS PRIVATE LIMITED
Factory: Bhiwandi Industrial Area, Thane

TAX INVOICE: PMC-9941
Date: 07-08-2026
PO Ref: PO-D2C-8812

Item Description | HSN Code | Qty | Rate | Amount
1. 3-Ply Custom Printed Die-Cut Mailer Box (10x8x4) | 48191010 | 2500 pcs | 18.00 | ₹45,000.00
2. Honeycomb Paper Wrap Rolls (500m) | 48089000 | 10 rolls | 1200.00 | ₹12,000.00

Goods Total: ₹57,000.00
Freight & Handling: ₹3,000.00
Taxable Subtotal: ₹60,000.00
GST @ 12%: ₹7,200.00
Total Amount Payable: ₹67,200.00`,
  },
];
