import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';
import { DEMO_INVOICES, DemoInvoice } from '../data/demoInvoices';
import { ParsedInvoice } from '../types';
import { parseInvoiceWithAI } from '../services/aiService';

interface ParseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractionSuccess: (parsed: ParsedInvoice, rawText: string) => void;
}

const ANALYSIS_STEPS = [
  'Reading raw invoice structure & OCR artifacts...',
  'Identifying merchant / vendor identity...',
  'Extracting line items, subtotal, tax & grand total...',
  'Classifying expense into canonical D2C category...',
  'Running deterministic validation & math checks...',
  'Invoice analyzed successfully!',
];

export const ParseInvoiceModal: React.FC<ParseInvoiceModalProps> = ({
  isOpen,
  onClose,
  onExtractionSuccess,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'negative' | 'slack' | 'email' | 'receipt'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && !rawText) {
      setActiveDemoId(null);
    }
  }, [isOpen]);

  // Animated progress step simulator during AI call
  useEffect(() => {
    let timer: any;
    if (isAnalyzing && currentStepIndex < ANALYSIS_STEPS.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex((prev) => Math.min(prev + 1, ANALYSIS_STEPS.length - 2));
      }, 450);
    }
    return () => clearTimeout(timer);
  }, [isAnalyzing, currentStepIndex]);

  if (!isOpen) return null;

  const handleSelectDemo = (demo: DemoInvoice) => {
    setRawText(demo.rawText);
    setActiveDemoId(demo.id);
    setErrorMessage(null);
  };

  const filteredDemos = DEMO_INVOICES.filter((demo) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'negative') return demo.sourceType === 'negative';
    if (selectedTab === 'slack') return demo.sourceType === 'slack';
    if (selectedTab === 'email') return demo.sourceType === 'email';
    if (selectedTab === 'receipt') return demo.sourceType === 'receipt' || demo.sourceType === 'conflict';
    return true;
  });

  const handleAnalyze = async () => {
    if (!rawText || !rawText.trim()) {
      setErrorMessage('Please paste invoice text or select one of the demo invoices above.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setCurrentStepIndex(0);

    try {
      const parsed = await parseInvoiceWithAI(rawText);
      setCurrentStepIndex(ANALYSIS_STEPS.length - 1);

      // Brief delay to show completion state smoothly
      setTimeout(() => {
        setIsAnalyzing(false);
        onExtractionSuccess(parsed, rawText);
      }, 400);
    } catch (err: any) {
      console.error('Invoice analysis error:', err);
      setIsAnalyzing(false);
      setErrorMessage(
        err.message || 'We could not extract structured data from this text. Please check the text and try again.'
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        setActiveDemoId(null);
        setErrorMessage(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        setActiveDemoId(null);
        setErrorMessage(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="parse-invoice-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="parse-invoice-modal"
        className="relative my-6 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Paste Receipt or Invoice
              </h2>
              <p className="text-xs text-slate-500">
                Paste raw receipt, invoice, OCR, email, or Slack text and LedgerAI will structure it automatically.
              </p>
            </div>
          </div>
          <button
            id="btn-close-parse-modal"
            onClick={onClose}
            disabled={isAnalyzing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Demo Invoices Quick Selectors */}
        <div className="mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-700 mb-2.5">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Test Scenarios & Input Sources:</span>
            </span>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All Sources' },
                { id: 'negative', label: 'Negative / Non-Invoice' },
                { id: 'slack', label: 'Slack Drops' },
                { id: 'email', label: 'Email Forwards' },
                { id: 'receipt', label: 'Invoices & Receipts' },
              ].map((tab) => {
                const isActive = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 max-h-[140px] overflow-y-auto pr-1">
            {filteredDemos.map((demo) => {
              const isSelected = activeDemoId === demo.id;
              const isNegative = demo.sourceType === 'negative';
              return (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleSelectDemo(demo)}
                  className={`flex flex-col items-start rounded-lg border p-2 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                      : isNegative
                      ? 'border-red-200/80 bg-red-50/40 hover:border-red-300 hover:bg-red-50/80'
                      : demo.sourceType === 'slack'
                      ? 'border-purple-200/80 bg-purple-50/40 hover:border-purple-300 hover:bg-purple-50/80'
                      : demo.sourceType === 'email'
                      ? 'border-sky-200/80 bg-sky-50/40 hover:border-sky-300 hover:bg-sky-50/80'
                      : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {demo.title}
                    </span>
                    {demo.isAmbiguous ? (
                      <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 shrink-0">
                        Flag
                      </span>
                    ) : isNegative ? (
                      <span className="rounded bg-red-100 px-1 py-0.2 text-[9px] font-bold text-red-800 shrink-0">
                        Reject
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-0.5 text-[10px] text-slate-500 truncate w-full">
                    {demo.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Text Input & Drag-Drop Area */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <label htmlFor="raw-invoice-textarea" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
              Raw Invoice / Receipt Text
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.json,.pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium text-xs transition-colors"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Upload File</span>
              </button>
              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setActiveDemoId(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              id="raw-invoice-textarea"
              rows={8}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setActiveDemoId(null);
                setErrorMessage(null);
              }}
              placeholder={`Paste any raw invoice, receipt, OCR scan, or email confirmation here...\n\nExample:\nInvoice #INV-2391\nMeta Platforms Ireland Ltd\nDate: 12 August 2026\nFacebook Advertising Campaign\nSubtotal: ₹42,372\nGST: ₹7,627\nTotal Amount Due: ₹49,999`}
              disabled={isAnalyzing}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed shadow-inner"
            />
            {rawText && (
              <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-sans">
                {rawText.length} characters • {rawText.split('\n').length} lines
              </div>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Multi-step AI Progress Indicator when Analyzing */}
        {isAnalyzing && (
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex items-center gap-2.5 text-indigo-900 font-semibold text-xs">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Analyzing with Gemini AI Extraction Engine...</span>
            </div>
            <div className="mt-2 text-xs text-indigo-700 font-medium flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              {ANALYSIS_STEPS[currentStepIndex]}
            </div>
            {/* Progress bar */}
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-indigo-200/80">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / ANALYSIS_STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer Action Buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>AI proposes • Validation checks • Human confirms</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-cancel-parse"
              type="button"
              onClick={onClose}
              disabled={isAnalyzing}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              id="btn-analyze-with-ai"
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !rawText.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Analyze with AI</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
