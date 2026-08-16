export interface DemoInvoice {
  id: string;
  title: string;
  badge: string;
  sourceType: 'negative' | 'slack' | 'email' | 'receipt' | 'conflict';
  sourceLabel: string;
  description: string;
  rawText: string;
  categoryHint: string;
  isAmbiguous?: boolean;
}

export const DEMO_INVOICES: DemoInvoice[] = [
  // --- NEGATIVE TEST CASES (Reject / Non-Invoice / Junk) ---
  {
    id: 'demo_negative_chitchat',
    title: 'Negative: Chit-chat',
    badge: 'Negative / Non-Invoice',
    sourceType: 'negative',
    sourceLabel: 'Negative Test',
    description: 'Conversational chat text with no financial amounts or vendor details',
    categoryHint: 'Negative Test',
    isAmbiguous: true,
    rawText: `hello this is a test
please process this invoice
nothing else here`,
  },
  {
    id: 'demo_negative_meeting_notes',
    title: 'Negative: Meeting Sync',
    badge: 'Negative / Non-Invoice',
    sourceType: 'negative',
    sourceLabel: 'Negative Test',
    description: 'Internal team meeting notes and standup action items with no transaction data',
    categoryHint: 'Negative Test',
    isAmbiguous: true,
    rawText: `Meeting Notes: Weekly Growth & Finance Standup
Date: August 14, 2026
Attendees: Neha, Rahul, Priya, Anand

Agenda:
1. Finalize Q3 logistics expansion budget with Delhivery.
2. Review candidate resumes for marketing lead position.
3. Sync with UI design team on Tuesday at 3 PM.

Action Items:
- Rahul: Send revised financial model by Friday.
- Priya: Follow up with packaging carton supplier.
- No blockers reported.`,
  },
  {
    id: 'demo_negative_security_alert',
    title: 'Negative: Security OTP',
    badge: 'Negative / Non-Invoice',
    sourceType: 'negative',
    sourceLabel: 'Negative Test',
    description: 'Automated 2FA security alert containing OTP numbers but zero billing data',
    categoryHint: 'Negative Test',
    isAmbiguous: true,
    rawText: `[SECURITY NOTIFICATION]
Your one-time verification passcode is 884920.
This OTP will expire in 10 minutes.

Do not share this passcode with anyone, including customer support representatives. If you did not initiate this login request, please reset your password immediately at https://security.d2cbrand.com.

Automated system alert — Do not reply to this email.`,
  },
  {
    id: 'demo_negative_ocr_garbage',
    title: 'Negative: Corrupted OCR',
    badge: 'Negative / Non-Invoice',
    sourceType: 'negative',
    sourceLabel: 'Negative Test',
    description: 'Completely unreadable distorted scanner noise with no discernable merchant or total',
    categoryHint: 'Negative Test',
    isAmbiguous: true,
    rawText: `### @@ $$$ %%%% ****** ++++++
~~||||||||||||||||||||||~~
OCR_CORRUPTED_STREAM_0x992B
====== ????? ----- ///// 
zzzzzzz qwerty asdfgh 00000000
no_readable_text_found_on_page
%%%%% !!!!!!!`,
  },
  {
    id: 'demo_negative_boilerplate',
    title: 'Negative: Legal Footer',
    badge: 'Negative / Non-Invoice',
    sourceType: 'negative',
    sourceLabel: 'Negative Test',
    description: 'Legal terms and conditions footer snippet without any invoice body or amounts',
    categoryHint: 'Negative Test',
    isAmbiguous: true,
    rawText: `TERMS & CONDITIONS:
1. Goods once sold will not be taken back or exchanged under any circumstances.
2. All disputes are subject to exclusive Mumbai jurisdiction only.
3. Interest @ 18% p.a. will be charged if payment is delayed beyond 30 days.
4. E. & O.E. (Errors and Omissions Excepted).`,
  },

  // --- SLACK EXPENSE MESSAGES (Team Expense Drops) ---
  {
    id: 'demo_slack_figma',
    title: 'Slack: Figma Design',
    badge: 'Slack / Software',
    sourceType: 'slack',
    sourceLabel: 'Slack Message',
    description: 'Design lead posting corporate card charge for annual Figma seats on #finance',
    categoryHint: 'Software & SaaS',
    rawText: `[#finance-expenses] @neha
Hey Neha! Rahul from Design team here. Just renewed our annual Figma Enterprise design seats subscription today (August 14, 2026).

Vendor: Figma, Inc.
Invoice: #FIG-2026-8891
Total Paid: USD 540.00
Card used: Corporate Amex ending 9012.

Can you please log this under software expenses for month-end close? Thanks!`,
  },
  {
    id: 'demo_slack_swiggy_lunch',
    title: 'Slack: Team Lunch',
    badge: 'Slack / Meals',
    sourceType: 'slack',
    sourceLabel: 'Slack Message',
    description: 'Warehouse manager submitting team meal reimbursement with GST on Slack',
    categoryHint: 'Meals & Entertainment',
    rawText: `[#team-reimbursements]
@neha-finance Hey Neha, reimbursing the D2C warehouse dispatch team celebration lunch from yesterday (12/08/2026).

Merchant: Swiggy / Domino's Pizza
Order Ref: SWG-8849201
Food Items Subtotal: ₹3,200.00
GST (5%): ₹160.00
Delivery & Packaging: ₹140.00
Grand Total Paid: ₹3,500.00

Attached the receipt snapshot. Please approve for our ledger!`,
  },
  {
    id: 'demo_slack_uber_travel',
    title: 'Slack: Client Travel',
    badge: 'Slack / Travel',
    sourceType: 'slack',
    sourceLabel: 'Slack Message',
    description: 'Sales team sharing airport taxi receipt breakdown on Slack travel channel',
    categoryHint: 'Travel',
    rawText: `[#ops-travel]
Expense report for client visit to Bangalore retail partners on 10 Aug 2026:
Vendor: Uber India Systems Pvt Ltd
Trip ID: UBR-8921-BLR
Base Fare: ₹1,450.00
Tolls & Airport Surcharge: ₹350.00
Total Fare: ₹1,800.00
Payment: Corporate ICICI Card ending 4019
Category: Travel`,
  },

  // --- FORWARDED EMAIL INVOICES (Vendor Inboxes) ---
  {
    id: 'demo_email_canva',
    title: 'Email: Canva Pro',
    badge: 'Email / Marketing',
    sourceType: 'email',
    sourceLabel: 'Email Forward',
    description: 'Forwarded billing confirmation email with GST breakdown and subscription tier',
    categoryHint: 'Marketing & Advertising',
    rawText: `---------- Forwarded message ---------
From: Canva Billing <billing@canva.com>
Date: Thu, Aug 13, 2026 at 11:30 AM
Subject: Your Canva Invoice #CAN-89104 for August 2026
To: Neha Sharma <neha.sharma@theurbanglow.in>

Hi Neha,

Thank you for subscribing to Canva Pro for Teams. Here is your receipt:
Vendor: Canva Pty Ltd
Invoice Date: August 13, 2026
Invoice ID: CAN-89104

Plan: Canva Pro (5 Team Seats) - Monthly
Subtotal: ₹3,999.00
IGST (18%): ₹719.82
Total Amount Charged: ₹4,718.82

Payment Method: Mastercard ending 1120
Payment Status: Successful`,
  },
  {
    id: 'demo_email_zoom',
    title: 'Email: Zoom Video',
    badge: 'Email / Software',
    sourceType: 'email',
    sourceLabel: 'Email Forward',
    description: 'Forwarded Zoom workplace business subscription invoice with clean breakdown',
    categoryHint: 'Software & SaaS',
    rawText: `---------- Forwarded message ---------
From: Zoom Video Communications <billing@zoom.us>
Date: Tue, Aug 11, 2026 at 4:15 PM
Subject: Invoice INV-ZM-99410 from Zoom Video Communications, Inc.
To: Accounts Payable <accounts@theurbanglow.in>

INVOICE SUMMARY:
Vendor: Zoom Video Communications, Inc.
Invoice Date: 2026-08-11
Invoice Number: INV-ZM-99410

Zoom Workplace Business Plan (10 Licenses): $199.90
Tax / Regulatory Surcharge: $0.00
Total Due: USD 199.90

Paid via Auto-pay on Aug 11, 2026.`,
  },
  {
    id: 'demo_email_google_workspace',
    title: 'Email: Google Workspace',
    badge: 'Email / SaaS',
    sourceType: 'email',
    sourceLabel: 'Email Forward',
    description: 'Forwarded monthly Google Workspace invoice with CGST/SGST split',
    categoryHint: 'Software & SaaS',
    rawText: `---------- Forwarded message ---------
From: Google Payments <payments-noreply@google.com>
Date: Mon, Aug 10, 2026 at 9:00 AM
Subject: Your Google Cloud / Google Workspace invoice is ready: G-2026-8812
To: finance@theurbanglow.in

Google India Private Limited
Tax Invoice / Receipt: G-2026-8812
Billing Date: 10-08-2026

Description: Google Workspace Enterprise (25 Users)
Subtotal: ₹18,750.00
CGST @ 9%: ₹1,687.50
SGST @ 9%: ₹1,687.50
Total Amount Paid: ₹22,125.00`,
  },

  // --- STANDARD RECEIPTS & INVOICES ---
  {
    id: 'demo_notion',
    title: 'Notion Subscription',
    badge: 'Clean / USD SaaS',
    sourceType: 'receipt',
    sourceLabel: 'Receipt',
    description: 'Standard software subscription invoice in USD with word-formatted date (TC 2)',
    categoryHint: 'Software & SaaS',
    rawText: `Vendor: Notion Labs Inc.
Invoice Date: August 3, 2026
Business Plan Subscription
Total: USD 240.00`,
  },
  {
    id: 'demo_starbucks',
    title: 'Starbucks Receipt',
    badge: 'Meals / DD/MM/YY',
    sourceType: 'receipt',
    sourceLabel: 'Receipt',
    description: 'Cafe food & beverage receipt with line items and DD/MM/YY date (TC 3)',
    categoryHint: 'Meals & Entertainment',
    rawText: `STARBUCKS
Mumbai
02/08/26

2 Cappuccino       760
1 Sandwich          320
----------------------
TOTAL              1080
Paid by Card`,
  },
  {
    id: 'demo_abc_logistics',
    title: 'ABC Logistics (Conflict)',
    badge: 'Math Conflict / Flag',
    sourceType: 'conflict',
    sourceLabel: 'Conflict',
    description: 'Conflict: Subtotal + GST = ₹23,600, but Amount Payable = ₹26,600 (TC 4)',
    categoryHint: 'Logistics & Shipping',
    isAmbiguous: true,
    rawText: `Vendor: ABC Logistics
Date: 08 Aug 2026
Subtotal: ₹20,000
GST: ₹3,600
Total: ₹23,600
Amount Payable: ₹26,600`,
  },
  {
    id: 'demo_meta',
    title: 'Meta Ads Invoice',
    badge: 'Clean / Marketing',
    sourceType: 'receipt',
    sourceLabel: 'Receipt',
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
    sourceType: 'receipt',
    sourceLabel: 'Receipt',
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
    sourceType: 'receipt',
    sourceLabel: 'Receipt',
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
    sourceType: 'receipt',
    sourceLabel: 'Receipt',
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
    id: 'demo_ca_audit',
    title: 'CA Retainer Invoice',
    badge: 'Professional / TDS Flag',
    sourceType: 'receipt',
    sourceLabel: 'Receipt',
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
];
